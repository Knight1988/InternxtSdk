require('dotenv').config();
const { Auth } = require('@internxt/sdk');
const { createHash, pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } = require('crypto');
const readline = require('readline');
const openpgp = require('openpgp');
const { aes } = require('@internxt/lib');

// Configure environment variables
process.env.DRIVE_NEW_API_URL = process.env.DRIVE_NEW_API_URL || 'https://gateway.internxt.com/drive';
process.env.APP_CRYPTO_SECRET = process.env.APP_CRYPTO_SECRET || '6KYQBP847D4ATSFA';

class InternxtLogin {
  constructor() {
    this.apiUrl = process.env.DRIVE_NEW_API_URL;
    this.appDetails = {
      clientName: 'internxt-login-example',
      clientVersion: '1.0.0',
    };
  }

  /**
   * Create crypto provider for password encryption
   */
  createCryptoProvider() {
    const self = this;
    return {
      encryptPasswordHash(password, encryptedSalt) {
        const salt = self.decryptText(encryptedSalt);
        const hashObj = self.passToHash({ password, salt });
        return self.encryptText(hashObj.hash);
      },
      async generateKeys(password) {
        // Generate PGP keys using openpgp
        const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
          userIDs: [{ email: 'inxt@inxt.com' }],
          curve: 'ed25519Legacy',
        });
        
        // Encrypt private key with password
        const aesInit = { iv: Buffer.from(process.env.APP_CRYPTO_SECRET || '6KYQBP847D4ATSFA') };
        const privateKeyEncrypted = aes.encrypt(privateKey, password, aesInit);
        const publicKeyBase64 = Buffer.from(publicKey).toString('base64');
        const revocationCertificateBase64 = Buffer.from(revocationCertificate).toString('base64');
        
        return {
          privateKeyEncrypted: privateKeyEncrypted,
          publicKey: publicKeyBase64,
          revocationCertificate: revocationCertificateBase64,
          ecc: {
            privateKeyEncrypted: privateKeyEncrypted,
            publicKey: publicKeyBase64,
          },
          kyber: {
            privateKeyEncrypted: null,
            publicKey: null,
          },
        };
      },
    };
  }

  /**
   * Hash password with salt
   */
  passToHash(passObject) {
    const salt = passObject.salt ?? randomBytes(128 / 8).toString('hex');
    const hash = pbkdf2Sync(
      passObject.password,
      Buffer.from(salt, 'hex'),
      10000,
      256 / 8,
      'sha1'
    ).toString('hex');
    return { salt, hash };
  }

  /**
   * Encrypt text using AES-256-CBC (OpenSSL compatible)
   */
  encryptText(textToEncrypt) {
    const secret = process.env.APP_CRYPTO_SECRET;
    const salt = randomBytes(8);
    const { key, iv } = this.getKeyAndIvFrom(secret, salt);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(textToEncrypt, 'utf8'),
      cipher.final(),
    ]);
    const openSSLstart = Buffer.from('Salted__');
    return Buffer.concat([openSSLstart, salt, encrypted]).toString('hex');
  }

  /**
   * Decrypt text using AES-256-CBC (OpenSSL compatible)
   */
  decryptText(encryptedText) {
    const secret = process.env.APP_CRYPTO_SECRET;
    const cypherText = Buffer.from(encryptedText, 'hex');
    const salt = cypherText.subarray(8, 16);
    const { key, iv } = this.getKeyAndIvFrom(secret, salt);
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const contentsToDecrypt = cypherText.subarray(16);
    return Buffer.concat([
      decipher.update(contentsToDecrypt),
      decipher.final(),
    ]).toString('utf8');
  }

  /**
   * Generate key and IV from secret and salt (OpenSSL EVP_BytesToKey equivalent)
   */
  getKeyAndIvFrom(secret, salt) {
    const TRANSFORM_ROUNDS = 3;
    const password = Buffer.concat([Buffer.from(secret, 'binary'), salt]);
    const md5Hashes = [];
    let digest = password;
    
    for (let i = 0; i < TRANSFORM_ROUNDS; i++) {
      md5Hashes[i] = createHash('md5').update(digest).digest();
      digest = Buffer.concat([md5Hashes[i], password]);
    }
    
    const key = Buffer.concat([md5Hashes[0], md5Hashes[1]]);
    const iv = md5Hashes[2];
    return { key, iv };
  }

  /**
   * Decrypt mnemonic with password
   */
  decryptMnemonic(encryptedMnemonic, password) {
    const salt = randomBytes(8);
    const { key, iv } = this.getKeyAndIvFrom(password, salt);
    
    try {
      const cypherText = Buffer.from(encryptedMnemonic, 'hex');
      const saltFromText = cypherText.subarray(8, 16);
      const { key: actualKey, iv: actualIv } = this.getKeyAndIvFrom(password, saltFromText);
      const decipher = createDecipheriv('aes-256-cbc', actualKey, actualIv);
      const contentsToDecrypt = cypherText.subarray(16);
      return Buffer.concat([
        decipher.update(contentsToDecrypt),
        decipher.final(),
      ]).toString('utf8');
    } catch (error) {
      console.error('Failed to decrypt mnemonic:', error.message);
      return null;
    }
  }

  /**
   * Check if 2FA is needed for the account
   */
  async is2FANeeded(email) {
    try {
      const authClient = Auth.client(this.apiUrl, this.appDetails);
      const securityDetails = await authClient.securityDetails(email);
      return securityDetails.tfaEnabled;
    } catch (error) {
      throw new Error(`Failed to check 2FA status: ${error.message}`);
    }
  }

  /**
   * Perform login
   */
  async doLogin(email, password, twoFactorCode = undefined) {
    try {
      const authClient = Auth.client(this.apiUrl, this.appDetails);
      const cryptoProvider = this.createCryptoProvider();

      const loginDetails = {
        email: email.toLowerCase(),
        password: password,
        tfaCode: twoFactorCode,
      };

      console.log('Attempting to login...');
      const data = await authClient.loginAccess(loginDetails, cryptoProvider);
      
      const { user, newToken } = data;
      
      // Decrypt mnemonic
      const clearMnemonic = this.decryptMnemonic(user.mnemonic, password);
      
      const loginCredentials = {
        user: {
          ...user,
          mnemonic: clearMnemonic,
        },
        token: newToken,
        lastLoggedInAt: new Date().toISOString(),
      };

      return loginCredentials;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Prompt user for input
   */
  async promptInput(question, isPassword = false) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      if (isPassword) {
        rl.question(question, (answer) => {
          rl.close();
          resolve(answer);
        });
        // Hide input for password (note: this is basic, not fully secure)
        if (rl.input.isTTY) {
          rl.stdoutMuted = true;
          rl._writeToOutput = function _writeToOutput(stringToWrite) {
            if (rl.stdoutMuted && !stringToWrite.includes(question)) {
              rl.output.write('*');
            } else {
              rl.output.write(stringToWrite);
            }
          };
        }
      } else {
        rl.question(question, (answer) => {
          rl.close();
          resolve(answer);
        });
      }
    });
  }
}

/**
 * Main function to run the login flow
 */
async function main() {
  const internxtLogin = new InternxtLogin();

  try {
    // Get email from user or environment variable
    const email = process.env.INXT_USER || await internxtLogin.promptInput('Email: ');
    
    // Get password from user or environment variable
    const password = process.env.INXT_PASSWORD || await internxtLogin.promptInput('Password: ', true);
    console.log(''); // New line after password

    // Check if 2FA is needed
    const is2FANeeded = await internxtLogin.is2FANeeded(email);
    
    let twoFactorCode;
    if (is2FANeeded) {
      console.log('Two-factor authentication is enabled for this account.');
      twoFactorCode = process.env.INXT_TWOFACTORCODE || await internxtLogin.promptInput('Two-factor code: ');
    }

    // Perform login
    const loginCredentials = await internxtLogin.doLogin(email, password, twoFactorCode);

    console.log('\n✅ Successfully logged in!');
    console.log('\nUser Details:');
    console.log('  Email:', loginCredentials.user.email);
    console.log('  UUID:', loginCredentials.user.uuid);
    console.log('  Created At:', new Date(loginCredentials.user.createdAt).toLocaleString());
    console.log('  Token:', loginCredentials.token.substring(0, 20) + '...');
    if (loginCredentials.user.mnemonic) {
      console.log('  Mnemonic (first 20 chars):', loginCredentials.user.mnemonic.substring(0, 20) + '...');
    }
    console.log('  Logged in at:', loginCredentials.lastLoggedInAt);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { InternxtLogin };
