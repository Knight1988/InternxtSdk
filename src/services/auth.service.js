const { Auth, Drive } = require('@internxt/sdk');
const { CryptoUtils } = require('../utils/crypto');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class AuthService {
  constructor(config) {
    this.config = config;
    this.cryptoUtils = new CryptoUtils(config.appCryptoSecret);
    this.credentialsFile = path.join(
      os.homedir(),
      '.internxt-sdk',
      '.credentials'
    );
  }

  /**
   * Initialize the credentials directory
   */
  async ensureCredentialsDirExists() {
    const dir = path.dirname(this.credentialsFile);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Check if 2FA is needed for an account
   */
  async is2FANeeded(email) {
    const authClient = Auth.client(this.config.apiUrl, this.config.appDetails);
    const securityDetails = await authClient.securityDetails(email);
    return securityDetails.tfaEnabled;
  }

  /**
   * Perform login
   */
  async login(email, password, twoFactorCode) {
    const authClient = Auth.client(this.config.apiUrl, this.config.appDetails);
    const cryptoProvider = this.cryptoUtils.createCryptoProvider();

    const loginDetails = {
      email: email.toLowerCase(),
      password: password,
      tfaCode: twoFactorCode,
    };

    const data = await authClient.loginAccess(loginDetails, cryptoProvider);
    const { user, newToken } = data;
    
    // Decrypt mnemonic
    const clearMnemonic = this.cryptoUtils.decryptTextWithKey(
      user.mnemonic,
      password
    );
    
    const credentials = {
      user: {
        ...user,
        mnemonic: clearMnemonic,
      },
      token: newToken,
      lastLoggedInAt: new Date().toISOString(),
    };

    // Save credentials
    await this.saveCredentials(credentials);
    
    return credentials;
  }

  /**
   * Logout
   */
  async logout() {
    try {
      const credentials = await this.getCredentials();
      if (credentials && credentials.token) {
        const authClient = Auth.client(
          this.config.apiUrl,
          this.config.appDetails,
          { token: credentials.token }
        );
        await authClient.logout(credentials.token);
      }
      await this.clearCredentials();
    } catch (error) {
      // Ignore errors, just clear local credentials
      await this.clearCredentials();
    }
  }

  /**
   * Get saved credentials
   */
  async getCredentials() {
    try {
      const encryptedData = await fs.readFile(this.credentialsFile, 'utf8');
      const credentialsString = this.cryptoUtils.decryptText(encryptedData);
      return JSON.parse(credentialsString);
    } catch {
      return null;
    }
  }

  /**
   * Save credentials to disk
   */
  async saveCredentials(credentials) {
    await this.ensureCredentialsDirExists();
    const credentialsString = JSON.stringify(credentials);
    const encryptedData = this.cryptoUtils.encryptText(credentialsString);
    await fs.writeFile(this.credentialsFile, encryptedData, 'utf8');
  }

  /**
   * Clear saved credentials
   */
  async clearCredentials() {
    try {
      await fs.unlink(this.credentialsFile);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn() {
    const credentials = await this.getCredentials();
    return credentials !== null && credentials.token !== undefined;
  }
}

module.exports = { AuthService };
