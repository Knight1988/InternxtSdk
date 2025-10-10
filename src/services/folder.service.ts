import { Drive } from '@internxt/sdk';
import { SDKConfig, Credentials, Folder, File, FolderContents, AppDetails, OperationResult } from '../types';

export class FolderService {
  private credentials: Credentials;
  private storageClient: any;

  constructor(config: Required<SDKConfig> & { appDetails: AppDetails }, credentials: Credentials) {
    this.credentials = credentials;
    this.storageClient = Drive.Storage.client(
      config.apiUrl,
      config.appDetails,
      { token: credentials.token }
    );
  }

  /**
   * List folder contents
   */
  async list(folderId: string | null = null): Promise<FolderContents> {
    const folderUuid = folderId || this.credentials.user.rootFolderId;
    
    const folders = await this.getAllSubfolders(folderUuid, 0);
    const files = await this.getAllSubfiles(folderUuid, 0);
    
    return {
      folders: folders.map((f: any): Folder => ({
        id: f.uuid,
        name: f.plainName,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        parentId: f.parentUuid,
      })),
      files: files.map((f: any): File => ({
        id: f.uuid,
        name: f.type ? `${f.plainName}.${f.type}` : f.plainName,
        type: f.type,
        size: f.size,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        folderId: f.folderUuid,
      })),
    };
  }

  /**
   * Get all subfolders recursively
   */
  private async getAllSubfolders(folderUuid: string, offset: number): Promise<any[]> {
    const [folderContentPromise] = this.storageClient.getFolderFoldersByUuid(
      folderUuid,
      offset,
      50,
      'plainName',
      'ASC'
    );
    const { folders } = await folderContentPromise;
    
    if (folders.length > 0) {
      const more = await this.getAllSubfolders(
        folderUuid,
        offset + folders.length
      );
      return folders.concat(more);
    }
    return folders;
  }

  /**
   * Get all subfiles recursively
   */
  private async getAllSubfiles(folderUuid: string, offset: number): Promise<any[]> {
    const [folderContentPromise] = this.storageClient.getFolderFilesByUuid(
      folderUuid,
      offset,
      50,
      'plainName',
      'ASC'
    );
    const { files } = await folderContentPromise;
    
    if (files.length > 0) {
      const more = await this.getAllSubfiles(folderUuid, offset + files.length);
      return files.concat(more);
    }
    return files;
  }

  /**
   * Create a new folder
   */
  async createFolder(folderName: string, parentFolderId: string | null = null): Promise<Folder> {
    const parentUuid = parentFolderId || this.credentials.user.rootFolderId;
    
    const [createPromise] = this.storageClient.createFolderByUuid({
      plainName: folderName,
      parentFolderUuid: parentUuid,
    });
    
    const newFolder = await createPromise;
    
    return {
      id: newFolder.uuid,
      name: newFolder.plainName,
      createdAt: newFolder.createdAt,
      updatedAt: newFolder.updatedAt,
      parentId: newFolder.parentUuid,
    };
  }

  /**
   * Get folder metadata
   */
  async getFolderMeta(folderId: string): Promise<Folder> {
    const folderMeta = await this.storageClient.getFolderMeta(folderId);
    return {
      id: folderMeta.uuid,
      name: folderMeta.plainName,
      createdAt: folderMeta.createdAt,
      updatedAt: folderMeta.updatedAt,
      parentId: folderMeta.parentUuid,
    };
  }

  /**
   * Rename folder
   */
  async renameFolder(folderId: string, newName: string): Promise<OperationResult> {
    await this.storageClient.updateFolderNameWithUUID({
      uuid: folderId,
      plainName: newName,
    });
    
    return { success: true, id: folderId, name: newName };
  }

  /**
   * Move folder
   */
  async moveFolder(folderId: string, destinationFolderId: string): Promise<OperationResult> {
    await this.storageClient.moveFolderByUuid(folderId, {
      destinationFolderUuid: destinationFolderId,
    });
    
    return { success: true, id: folderId, newParentId: destinationFolderId };
  }
}
