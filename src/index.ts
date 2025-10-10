import * as dotenv from 'dotenv';
dotenv.config();

import { AuthService } from './services/auth.service';
import { FileService } from './services/file.service';
import { FolderService } from './services/folder.service';
import {
  Credentials,
  DownloadedFile,
  FileMetadata,
  Folder,
  FolderContents,
  InternalConfig,
  LoginResult,
  OperationResult,
  ProgressCallback,
  SDKConfig,
  UploadedFile
} from './types';

export class InternxtSDK {
  private config: InternalConfig;
  private authService: AuthService;
  private credentials: Credentials | null = null;

  constructor(options: SDKConfig = {}) {
    this.config = {
      apiUrl: options.apiUrl || process.env.DRIVE_NEW_API_URL || 'https://gateway.internxt.com/drive',
      networkUrl: options.networkUrl || process.env.NETWORK_URL || 'https://gateway.internxt.com/network',
      appCryptoSecret: options.appCryptoSecret || process.env.APP_CRYPTO_SECRET || '6KYQBP847D4ATSFA',
      clientName: options.clientName || 'internxt-sdk',
      clientVersion: options.clientVersion || '1.0.0',
      desktopHeader: options.desktopHeader || process.env.DESKTOP_HEADER,
      appDetails: {
        clientName: options.clientName || 'internxt-sdk',
        clientVersion: options.clientVersion || '1.0.0',
        desktopHeader: options.desktopHeader || process.env.DESKTOP_HEADER,
      },
    };

    this.authService = new AuthService(this.config);
  }

  /**
   * Check if 2FA is needed for an email
   */
  async is2FANeeded(email: string): Promise<boolean> {
    return this.authService.is2FANeeded(email);
  }

  /**
   * Login to Internxt
   */
  async login(email: string, password: string, twoFactorCode: string | null = null): Promise<LoginResult> {
    this.credentials = await this.authService.login(email, password, twoFactorCode || undefined);
    return {
      success: true,
      user: {
        email: this.credentials.user.email,
        uuid: this.credentials.user.uuid,
        rootFolderId: this.credentials.user.rootFolderId,
      },
    };
  }

  /**
   * Logout from Internxt
   */
  async logout(): Promise<{ success: boolean }> {
    await this.authService.logout();
    this.credentials = null;
    return { success: true };
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    return this.authService.isLoggedIn();
  }

  /**
   * Get saved credentials (auto-login)
   */
  async getCredentials(): Promise<Credentials | null> {
    this.credentials = await this.authService.getCredentials();
    return this.credentials;
  }

  /**
   * Ensure user is authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.credentials) {
      this.credentials = await this.authService.getCredentials();
    }

    if (!this.credentials) {
      throw new Error('Not authenticated. Please login first.');
    }
  }

  /**
   * List folder contents
   */
  async list(folderId: string | null = null): Promise<FolderContents> {
    await this.ensureAuthenticated();
    const folderService = new FolderService(this.config, this.credentials!);
    return folderService.list(folderId);
  }

  /**
   * Create a folder
   */
  async createFolder(folderName: string, parentFolderId: string | null = null): Promise<Folder> {
    await this.ensureAuthenticated();
    const folderService = new FolderService(this.config, this.credentials!);
    return folderService.createFolder(folderName, parentFolderId);
  }

  /**
   * Upload a file
   * @param filePath - Path to the file to upload
   * @param destinationFolderId - Destination folder ID (null for root)
   * @param onProgress - Progress callback function(progress)
   */
  async uploadFile(
    filePath: string,
    destinationFolderId: string | null = null,
    onProgress: ProgressCallback | null = null
  ): Promise<UploadedFile> {
    await this.ensureAuthenticated();
    const fileService = new FileService(this.config, this.credentials!);
    return fileService.uploadFile(filePath, destinationFolderId, onProgress);
  }

  /**
   * Download a file
   * @param fileId - File ID to download
   * @param destinationPath - Local directory path to save the file
   * @param onProgress - Progress callback function(progress)
   */
  async downloadFile(
    fileId: string,
    destinationPath: string,
    onProgress: ProgressCallback | null = null
  ): Promise<DownloadedFile> {
    await this.ensureAuthenticated();
    const fileService = new FileService(this.config, this.credentials!);
    return fileService.downloadFile(fileId, destinationPath, onProgress);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    await this.ensureAuthenticated();
    const fileService = new FileService(this.config, this.credentials!);
    return fileService.getFileMetadata(fileId);
  }

  /**
   * Get folder metadata
   */
  async getFolderMetadata(folderId: string): Promise<Folder> {
    await this.ensureAuthenticated();
    const folderService = new FolderService(this.config, this.credentials!);
    return folderService.getFolderMeta(folderId);
  }

  /**
   * Rename a file
   */
  async renameFile(fileId: string, newName: string): Promise<OperationResult> {
    await this.ensureAuthenticated();
    const fileService = new FileService(this.config, this.credentials!);
    return fileService.renameFile(fileId, newName);
  }

  /**
   * Rename a folder
   */
  async renameFolder(folderId: string, newName: string): Promise<OperationResult> {
    await this.ensureAuthenticated();
    const folderService = new FolderService(this.config, this.credentials!);
    return folderService.renameFolder(folderId, newName);
  }

  /**
   * Move a file
   */
  async moveFile(fileId: string, destinationFolderId: string): Promise<OperationResult> {
    await this.ensureAuthenticated();
    const fileService = new FileService(this.config, this.credentials!);
    return fileService.moveFile(fileId, destinationFolderId);
  }

  /**
   * Move a folder
   */
  async moveFolder(folderId: string, destinationFolderId: string): Promise<OperationResult> {
    await this.ensureAuthenticated();
    const folderService = new FolderService(this.config, this.credentials!);
    return folderService.moveFolder(folderId, destinationFolderId);
  }
}

export default InternxtSDK;

// Export types
export * from './types';
