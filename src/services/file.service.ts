import { Environment } from '@internxt/inxt-js';
import { Drive, Network } from '@internxt/sdk';
import * as fs from 'fs';
import * as path from 'path';
import {
  Credentials,
  DownloadedFile,
  FileMetadata,
  InternalConfig,
  OperationResult,
  ProgressCallback,
  UploadedFile
} from '../types';
import { CryptoUtils } from '../utils/crypto';
import { DownloadService } from './download.service';
import { NetworkFacade } from './network-facade.service';

export class FileService {
  private config: InternalConfig;
  private credentials: Credentials;
  private storageClient: any;
  private cryptoUtils: CryptoUtils;

  constructor(config: InternalConfig, credentials: Credentials) {
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
  private getNetworkFacade(): NetworkFacade {
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
  async uploadFile(
    filePath: string,
    destinationFolderId: string | null = null,
    onProgress: ProgressCallback | null = null,
    force: boolean = false
  ): Promise<UploadedFile> {
    const stats = await fs.promises.stat(filePath);

    if (!stats.size) {
      throw new Error('Cannot upload empty file');
    }

    const fileInfo = path.parse(filePath);
    const fileType = fileInfo.ext.replace('.', '');
    const folderUuid = destinationFolderId || this.credentials.user.rootFolderId;

    // Check if a file with the same name/type already exists in the destination folder
    // If it exists and force is false -> throw an error. If force is true -> delete existing files first.
    const matchingFiles: any[] = [];
    let offset = 0;
    // Paginate through folder files
    while (true) {
      const [folderFilesPromise] = this.storageClient.getFolderFilesByUuid(
        folderUuid,
        offset,
        50,
        'plainName',
        'ASC'
      );
      const { files } = await folderFilesPromise;

      for (const f of files) {
        const fType = f.type || '';
        if (f.plainName === fileInfo.name && fType === fileType) {
          matchingFiles.push(f);
        }
      }

      if (!files || files.length < 50) break;
      offset += files.length;
    }

    if (matchingFiles.length > 0) {
      if (!force) {
        const ext = fileType ? `.${fileType}` : '';
        throw new Error(`File already exists: ${fileInfo.name}${ext}`);
      }

      // Delete matching files if forcing
      for (const mf of matchingFiles) {
        try {
          await this.storageClient.deleteFileByUuid(mf.uuid);
        } catch (err) {
          // If deletion fails, continue to attempt upload; user asked to force overwrite
        }
      }
    }

    const networkFacade = this.getNetworkFacade();
    const readStream = fs.createReadStream(filePath);

    // Upload file to network
    const fileId = await new Promise<string>((resolve, reject) => {
      const state = networkFacade.uploadFile(
        readStream,
        stats.size,
        this.credentials.user.bucket,
        (err: Error | null, res?: string) => {
          if (err) {
            return reject(err);
          }
          resolve(res!);
        },
        onProgress || undefined
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
      size: typeof createdFile.size === 'string' ? parseInt(createdFile.size, 10) : createdFile.size,
      createdAt: createdFile.createdAt,
      folderId: createdFile.folderUuid,
    };
  }

  /**
   * Download a file
   */
  async downloadFile(
    fileId: string,
    destinationPath: string,
    onProgress: ProgressCallback | null = null
  ): Promise<DownloadedFile> {
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
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    const networkFacade = this.getNetworkFacade();
    const fileWriteStream = fs.createWriteStream(downloadPath);

    // Download file - pass the write stream directly
    const [executeDownload, abortable] = await networkFacade.downloadToStream(
      fileMetadata.bucket,
      this.credentials.user.mnemonic,
      fileMetadata.fileId,
      fileMetadata.size,
      fileWriteStream, // Pass the stream directly
      undefined,
      {
        abortController: new AbortController(),
        progressCallback: onProgress || undefined,
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
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
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
   * Rename file
   */
  async renameFile(fileId: string, newName: string): Promise<OperationResult> {
    await this.storageClient.updateFileMetaByUUID(fileId, {
      plainName: newName,
    });

    return { success: true, id: fileId, name: newName };
  }

  /**
   * Move file
   */
  async moveFile(fileId: string, destinationFolderId: string): Promise<OperationResult> {
    await this.storageClient.moveFileByUuid(fileId, {
      destinationFolder: destinationFolderId,
    });

    return { success: true, id: fileId, newFolderId: destinationFolderId };
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<OperationResult> {
    await this.storageClient.deleteFileByUuid(fileId);

    return { success: true, id: fileId };
  }
}

