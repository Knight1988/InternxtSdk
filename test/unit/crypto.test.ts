import { expect } from '../setup';
import { CryptoUtils } from '../../src/utils/crypto';

describe('CryptoUtils', () => {
  let cryptoUtils: CryptoUtils;

  beforeEach(() => {
    cryptoUtils = new CryptoUtils('test-secret-key-123456');
  });

  describe('passToHash', () => {
    it('should generate consistent hash for same password and salt', () => {
      const password = 'test-password-123';
      const salt = 'test-salt';

      const hash1 = cryptoUtils.passToHash({ password, salt });
      const hash2 = cryptoUtils.passToHash({ password, salt });

      expect(hash1.hash).to.equal(hash2.hash);
    });

    it('should generate different hashes for different passwords', () => {
      const salt = 'test-salt';
      const hash1 = cryptoUtils.passToHash({ password: 'password1', salt });
      const hash2 = cryptoUtils.passToHash({ password: 'password2', salt });

      expect(hash1.hash).to.not.equal(hash2.hash);
    });

    it('should generate different hashes for different salts', () => {
      const password = 'test-password';
      const hash1 = cryptoUtils.passToHash({ password, salt: '1234567890abcdef1234567890abcdef' });
      const hash2 = cryptoUtils.passToHash({ password, salt: 'fedcba0987654321fedcba0987654321' });

      expect(hash1.hash).to.not.equal(hash2.hash);
      expect(hash1.salt).to.not.equal(hash2.salt);
    });

    it('should return hash object with hash and salt properties', () => {
      const result = cryptoUtils.passToHash({ 
        password: 'test', 
        salt: 'salt' 
      });

      expect(result).to.have.property('hash');
      expect(result).to.have.property('salt');
      expect(result.hash).to.be.a('string');
      expect(result.salt).to.be.a('string');
      expect(result.hash.length).to.be.greaterThan(0);
    });

    it('should generate random salt if not provided', () => {
      const result1 = cryptoUtils.passToHash({ password: 'test' });
      const result2 = cryptoUtils.passToHash({ password: 'test' });

      expect(result1.salt).to.not.equal(result2.salt);
    });
  });

  describe('encryptText and decryptText', () => {
    it('should encrypt and decrypt text successfully', () => {
      const originalText = 'Hello, World!';

      const encrypted = cryptoUtils.encryptText(originalText);
      const decrypted = cryptoUtils.decryptText(encrypted);

      expect(decrypted).to.equal(originalText);
    });

    it('should fail to decrypt with wrong key', () => {
      const originalText = 'Secret message';
      const wrongCrypto = new CryptoUtils('wrong-secret-key');

      const encrypted = cryptoUtils.encryptText(originalText);
      
      expect(() => {
        wrongCrypto.decryptText(encrypted);
      }).to.throw();
    });

    it('should encrypt same text differently each time (due to random salt)', () => {
      const text = 'Same text';

      const encrypted1 = cryptoUtils.encryptText(text);
      const encrypted2 = cryptoUtils.encryptText(text);

      expect(encrypted1).to.not.equal(encrypted2);
      
      // But both should decrypt to same text
      expect(cryptoUtils.decryptText(encrypted1)).to.equal(text);
      expect(cryptoUtils.decryptText(encrypted2)).to.equal(text);
    });

    it('should handle empty strings', () => {
      const encrypted = cryptoUtils.encryptText('');
      const decrypted = cryptoUtils.decryptText(encrypted);
      
      expect(decrypted).to.equal('');
    });

    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`\n\t';

      const encrypted = cryptoUtils.encryptText(specialText);
      const decrypted = cryptoUtils.decryptText(encrypted);

      expect(decrypted).to.equal(specialText);
    });

    it('should handle unicode characters', () => {
      const unicodeText = '你好世界 🌍 مرحبا العالم';

      const encrypted = cryptoUtils.encryptText(unicodeText);
      const decrypted = cryptoUtils.decryptText(encrypted);

      expect(decrypted).to.equal(unicodeText);
    });
  });

  describe('decryptTextWithKey', () => {
    it('should decrypt text with custom key', () => {
      const text = 'Secret message';
      const customKey = 'custom-secret-key';
      
      const customCrypto = new CryptoUtils(customKey);
      const encrypted = customCrypto.encryptText(text);
      
      // Decrypt with the same custom key
      const decrypted = cryptoUtils.decryptTextWithKey(encrypted, customKey);
      
      expect(decrypted).to.equal(text);
    });
  });

  describe('generateKeys', () => {
    it('should generate PGP keys successfully', async function() {
      this.timeout(10000); // Key generation can take time

      const keys = await cryptoUtils.generateKeys('test-password');

      expect(keys).to.have.property('privateKeyEncrypted');
      expect(keys).to.have.property('publicKey');
      expect(keys).to.have.property('revocationCertificate');
      expect(keys).to.have.property('ecc');
      expect(keys).to.have.property('kyber');
      
      expect(keys.privateKeyEncrypted).to.be.a('string');
      expect(keys.publicKey).to.be.a('string');
      expect(keys.revocationCertificate).to.be.a('string');
      
      expect(keys.ecc).to.have.property('privateKeyEncrypted');
      expect(keys.ecc).to.have.property('publicKey');
    });

    it('should generate different keys each time', async function() {
      this.timeout(15000);

      const keys1 = await cryptoUtils.generateKeys('password1');
      const keys2 = await cryptoUtils.generateKeys('password2');

      expect(keys1.privateKeyEncrypted).to.not.equal(keys2.privateKeyEncrypted);
      expect(keys1.publicKey).to.not.equal(keys2.publicKey);
    });
  });

  describe('createCryptoProvider', () => {
    it('should create crypto provider', () => {
      const provider = cryptoUtils.createCryptoProvider();

      expect(provider).to.have.property('encryptPasswordHash');
      expect(provider).to.have.property('generateKeys');
      expect(provider.encryptPasswordHash).to.be.a('function');
      expect(provider.generateKeys).to.be.a('function');
    });

    it('should encrypt password hash correctly', () => {
      const provider = cryptoUtils.createCryptoProvider();
      const password = 'my-password';
      const salt = 'my-salt';
      const encryptedSalt = cryptoUtils.encryptText(salt);

      const encryptedHash = provider.encryptPasswordHash(password, encryptedSalt);

      expect(encryptedHash).to.be.a('string');
      expect(encryptedHash.length).to.be.greaterThan(0);
      
      // Decrypt and verify
      const decryptedHash = cryptoUtils.decryptText(encryptedHash);
      const expectedHash = cryptoUtils.passToHash({ password, salt });
      
      expect(decryptedHash).to.equal(expectedHash.hash);
    });

    it('should generate keys via provider', async function() {
      this.timeout(10000);
      
      const provider = cryptoUtils.createCryptoProvider();
      const keys = await provider.generateKeys('test-password');

      expect(keys).to.have.property('privateKeyEncrypted');
      expect(keys).to.have.property('publicKey');
      expect(keys).to.have.property('ecc');
    });
  });
});

