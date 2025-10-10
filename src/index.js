require('dotenv').config();
const { AuthService } = require('./services/auth.service');
const { FolderService } = require('./services/folder.service');
const { FileService } = require('./services/file.service');

class InternxtSDK {
  constructor(options = {}) {
    this.config = {
      apiUrl: options.apiUrl || process.env.DRIVE_NEW_API_URL || 'https://gateway.internxt.com/drive',
      networkUrl: options.networkUrl || process.env.NETWORK_URL || 'https://gateway.internxt.com/network',
      appCryptoSecret: options.appCryptoSecret || process.env.APP_CRYPTO_SECRET || '6KYQBP847D4ATSFA',
      appDetails: {
        clientName: options.clientName || 'internxt-sdk',
        clientVersion: options.clientVersion || '1.0.0',
      },
    };

    this.authService = new AuthService(this.config);
    this.credentials = null;
  }

  /**
   * Check if 2FA is needed for an email
   */
  async is2FANeeded(email) {
    return this.authService.is2FANeeded(email);
  }

  /**
   * Login to Internxt
   */
  async login(email, password, twoFactorCode = null) {
    this.credentials = await this.authService.login(email, password, twoFactorCode);
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
  async logout() {
    await this.authService.logout();
    this.credentials = null;
    return { success: true };
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  /**
   * Get saved credentials (auto-login)
   */
  async getCredentials() {
    this.credentials = await this.authService.getCredentials();
    return this.credentials;
  }

  /**
   * Ensure user is authenticated
   */
  async ensureAuthenticated() {
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
  async list(folderId = null) {
    await this.ensureAuthenticated();
    const folderService = new FolderService(this.config, this.credentials);
    return folderService.list(folderId);
  }

  /**
   * Create a folder
   */
  async createFolder(folderName, parentFolderId = null) {
    await this.ensureAuthenticated();
    const folderService = new FolderService(this.config, this.credentials);
    return folderService.createFolder(folderName, parentFolderId);
  }

  /**
   * Upload a file
   * @param {string} filePath - Path to the file to upload
   * @param {string|null} destinationFolderId - Destination folder ID (null for root)
   * @param {function|null} onProgress - Progress callback function(progress)
   */
  async uploadFile(filePath, destinationFolderId = null, onProgress = null) {
    await this.ensureAuthenticated();
    const fileService = new FileService(this.config, this.credentials);
    return fileService.uploadFile(filePath, destinationFolderId, onProgress);
  }

  /**
   * Download a file
   * @param {string} fileId - File ID to download
   * @param {string} destinationPath - Local directory path to save the file
   * @param {function|null} onProgress - Progress callback function(progress)
   */
  async downloadFile(fileId, destinationPath, onProgress = null) {
    await this.ensureAuthenticated();
    const fileService = new FileService(this.config, this.credentials);
    return fileService.downloadFile(fileId, destinationPath, onProgress);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId) {
    await this.ensureAuthenticated();
    const fileService = new FileService(this.config, this.credentials);
    return fileService.getFileMetadata(fileId);
  }

  /**
   * Get folder metadata
   */
  async getFolderMetadata(folderId) {
    await this.ensureAuthenticated();
    const folderService = new FolderService(this.config, this.credentials);
    return folderService.getFolderMeta(folderId);
  }

  /**
   * Rename a file
   */
  async renameFile(fileId, newName) {
    await this.ensureAuthenticated();
    const fileService = new FileService(this.config, this.credentials);
    return fileService.renameFile(fileId, newName);
  }

  /**
   * Rename a folder
   */
  async renameFolder(folderId, newName) {
    await this.ensureAuthenticated();
    const folderService = new FolderService(this.config, this.credentials);
    return folderService.renameFolder(folderId, newName);
  }

  /**
   * Move a file
   */
  async moveFile(fileId, destinationFolderId) {
    await this.ensureAuthenticated();
    const fileService = new FileService(this.config, this.credentials);
    return fileService.moveFile(fileId, destinationFolderId);
  }

  /**
   * Move a folder
   */
  async moveFolder(folderId, destinationFolderId) {
    await this.ensureAuthenticated();
    const folderService = new FolderService(this.config, this.credentials);
    return folderService.moveFolder(folderId, destinationFolderId);
  }
}

module.exports = InternxtSDK;
