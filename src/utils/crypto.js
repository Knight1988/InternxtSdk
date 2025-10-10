const { createHash, pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } = require('crypto');
const openpgp = require('openpgp');
const { aes } = require('@internxt/lib');

class CryptoUtils {
  constructor(appCryptoSecret) {
    this.appCryptoSecret = appCryptoSecret;
  }

  /**
   * Hash password with salt using PBKDF2
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
    const salt = randomBytes(8);
    const { key, iv } = this.getKeyAndIvFrom(this.appCryptoSecret, salt);
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
    const cypherText = Buffer.from(encryptedText, 'hex');
    const salt = cypherText.subarray(8, 16);
    const { key, iv } = this.getKeyAndIvFrom(this.appCryptoSecret, salt);
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const contentsToDecrypt = cypherText.subarray(16);
    return Buffer.concat([
      decipher.update(contentsToDecrypt),
      decipher.final(),
    ]).toString('utf8');
  }

  /**
   * Decrypt text with a specific key
   */
  decryptTextWithKey(encryptedText, secret) {
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
   * Generate PGP keys
   */
  async generateKeys(password) {
    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
      userIDs: [{ email: 'inxt@inxt.com' }],
      curve: 'ed25519Legacy',
    });
    
    const aesInit = { iv: Buffer.from(this.appCryptoSecret) };
    const privateKeyEncrypted = aes.encrypt(privateKey, password, aesInit);
    const publicKeyBase64 = Buffer.from(publicKey).toString('base64');
    const revocationCertificateBase64 = Buffer.from(revocationCertificate).toString('base64');
    
    return {
      privateKeyEncrypted,
      publicKey: publicKeyBase64,
      revocationCertificate: revocationCertificateBase64,
      ecc: {
        privateKeyEncrypted,
        publicKey: publicKeyBase64,
      },
      kyber: {
        privateKeyEncrypted: null,
        publicKey: null,
      },
    };
  }

  /**
   * Create crypto provider for SDK
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
        return self.generateKeys(password);
      },
    };
  }
}

module.exports = { CryptoUtils };
