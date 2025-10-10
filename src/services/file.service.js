const { Drive, Network } = require('@internxt/sdk');
const { Environment } = require('@internxt/inxt-js');
const fs = require('fs');
const path = require('path');
const { NetworkFacade } = require('./network-facade.service');
const { DownloadService } = require('./download.service');
const { CryptoUtils } = require('../utils/crypto');

class FileService {
  constructor(config, credentials) {
    this.config = config;
    this.credentials = credentials;
    this.storageClient = Drive.Storage.client(
      config.apiUrl,
      config.appDetails,
      { token: credentials.token }
    );
    this.cryptoUtils = new CryptoUtils(config.appCryptoSecret);
  }

  /**
   * Get network facade for upload/download operations
   */
  getNetworkFacade() {
    const networkModule = Network.Network.client(
      this.config.networkUrl,
      this.config.appDetails,
      {
        bridgeUser: this.credentials.user.bridgeUser,
        userId: this.credentials.user.userId,
      }
    );

    const environment = new Environment({
      bridgeUser: this.credentials.user.bridgeUser,
      bridgePass: this.credentials.user.userId,
      bridgeUrl: this.config.networkUrl,
      encryptionKey: this.credentials.user.mnemonic,
      appDetails: this.config.appDetails,
    });

    const downloadService = new DownloadService();
    const networkFacade = new NetworkFacade(
      networkModule,
      environment,
      downloadService,
      this.cryptoUtils
    );

    return networkFacade;
  }

  /**
   * Upload a file
   */
  async uploadFile(filePath, destinationFolderId = null, onProgress = null) {
    const stats = await fs.promises.stat(filePath);
    
    if (!stats.size) {
      throw new Error('Cannot upload empty file');
    }

    const fileInfo = path.parse(filePath);
    const fileType = fileInfo.ext.replace('.', '');
    const folderUuid = destinationFolderId || this.credentials.user.rootFolderId;

    const networkFacade = this.getNetworkFacade();
    const readStream = fs.createReadStream(filePath);

    // Upload file to network
    const fileId = await new Promise((resolve, reject) => {
      const state = networkFacade.uploadFile(
        readStream,
        stats.size,
        this.credentials.user.bucket,
        (err, res) => {
          if (err) {
            return reject(err);
          }
          resolve(res);
        },
        onProgress
      );

      process.on('SIGINT', () => {
        state.stop();
        reject(new Error('Upload cancelled'));
      });
    });

    // Create file entry in Drive
    const createdFile = await this.storageClient.createFileEntryByUuid({
      plainName: fileInfo.name,
      type: fileType,
      size: stats.size,
      folderUuid: folderUuid,
      fileId: fileId,
      bucket: this.credentials.user.bucket,
      encryptVersion: 'Aes03',
      creationTime: stats.birthtime?.toISOString(),
      modificationTime: stats.mtime?.toISOString(),
    });

    return {
      id: createdFile.uuid,
      name: fileInfo.name,
      type: fileType,
      size: createdFile.size,
      createdAt: createdFile.createdAt,
      folderId: createdFile.folderUuid,
    };
  }

  /**
   * Download a file
   */
  async downloadFile(fileId, destinationPath, onProgress = null) {
    // Get file metadata
    const [getFilePromise] = this.storageClient.getFile(fileId);
    const fileMetadata = await getFilePromise;

    const ext = fileMetadata.type?.length > 0 ? `.${fileMetadata.type}` : '';
    const filename = `${fileMetadata.name}${ext}`;
    const downloadPath = path.join(destinationPath, filename);

    // Check if file already exists
    try {
      await fs.promises.access(downloadPath);
      throw new Error(`File already exists: ${downloadPath}`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    const networkFacade = this.getNetworkFacade();
    const fileWriteStream = fs.createWriteStream(downloadPath);

    // Download file
    const [executeDownload, abortable] = await networkFacade.downloadToStream(
      fileMetadata.bucket,
      this.credentials.user.mnemonic,
      fileMetadata.fileId,
      fileMetadata.size,
      this.writeStreamToWritableStream(fileWriteStream),
      undefined,
      {
        abortController: new AbortController(),
        progressCallback: onProgress,
      }
    );

    process.on('SIGINT', () => {
      abortable.abort('Download cancelled');
    });

    await executeDownload;

    // Set file modification time
    try {
      await fs.promises.utimes(
        downloadPath,
        new Date(),
        new Date(fileMetadata.modificationTime || fileMetadata.updatedAt)
      );
    } catch {
      // Ignore if we can't set the time
    }

    return {
      path: downloadPath,
      name: filename,
      size: fileMetadata.size,
    };
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId) {
    const [getFilePromise] = this.storageClient.getFile(fileId);
    const fileMetadata = await getFilePromise;
    
    return {
      id: fileMetadata.uuid,
      name: fileMetadata.name,
      type: fileMetadata.type,
      size: fileMetadata.size,
      createdAt: fileMetadata.createdAt,
      updatedAt: fileMetadata.updatedAt,
      folderId: fileMetadata.folderUuid,
    };
  }

  /**
   * Helper to convert read stream to writable stream
   */
  writeStreamToWritableStream(writeStream) {
    return {
      write: (chunk) => {
        return new Promise((resolve, reject) => {
          const canContinue = writeStream.write(chunk);
          if (canContinue) {
            resolve();
          } else {
            writeStream.once('drain', resolve);
            writeStream.once('error', reject);
          }
        });
      },
      close: () => {
        return new Promise((resolve) => {
          writeStream.end(resolve);
        });
      },
    };
  }

  /**
   * Rename file
   */
  async renameFile(fileId, newName) {
    await this.storageClient.updateFileMetaByUUID(fileId, {
      plainName: newName,
    });
    
    return { success: true, id: fileId, name: newName };
  }

  /**
   * Move file
   */
  async moveFile(fileId, destinationFolderId) {
    await this.storageClient.moveFileByUuid(fileId, {
      destinationFolderUuid: destinationFolderId,
    });
    
    return { success: true, id: fileId, newFolderId: destinationFolderId };
  }
}

module.exports = { FileService };
