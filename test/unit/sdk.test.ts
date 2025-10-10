import { expect } from '../setup';
import InternxtSDK from '../../src/index';

describe('InternxtSDK', () => {
  let sdk: InternxtSDK;

  beforeEach(() => {
    sdk = new InternxtSDK();
  });

  describe('Constructor', () => {
    it('should create SDK instance with default config', () => {
      expect(sdk).to.be.instanceOf(InternxtSDK);
    });

    it('should create SDK instance with custom config', () => {
      const customSdk = new InternxtSDK({
        clientName: 'custom-client',
        clientVersion: '2.0.0',
      });

      expect(customSdk).to.be.instanceOf(InternxtSDK);
    });

    it('should accept custom API URLs', () => {
      const customSdk = new InternxtSDK({
        apiUrl: 'https://custom-api.example.com',
        networkUrl: 'https://custom-network.example.com',
      });

      expect(customSdk).to.be.instanceOf(InternxtSDK);
    });

    it('should accept custom crypto secret', () => {
      const customSdk = new InternxtSDK({
        appCryptoSecret: 'CUSTOM_SECRET_KEY',
      });

      expect(customSdk).to.be.instanceOf(InternxtSDK);
    });
  });

  describe('isLoggedIn', () => {
    it('should return Promise for isLoggedIn method', () => {
      const result = sdk.isLoggedIn();
      expect(result).to.be.instanceOf(Promise);
    });

    it('should have all required methods', () => {
      expect(sdk).to.have.property('login');
      expect(sdk).to.have.property('logout');
      expect(sdk).to.have.property('isLoggedIn');
      expect(sdk).to.have.property('is2FANeeded');
      expect(sdk).to.have.property('list');
      expect(sdk).to.have.property('createFolder');
      expect(sdk).to.have.property('renameFolder');
      expect(sdk).to.have.property('moveFolder');
      expect(sdk).to.have.property('uploadFile');
      expect(sdk).to.have.property('downloadFile');
      expect(sdk).to.have.property('getFileMetadata');
      expect(sdk).to.have.property('renameFile');
      expect(sdk).to.have.property('moveFile');
    });
  });

  describe('Method Types', () => {
    it('should have login method that returns Promise', () => {
      const result = sdk.login('test@example.com', 'password');
      expect(result).to.be.instanceOf(Promise);
    });

    it('should have logout method that returns Promise', () => {
      const result = sdk.logout();
      expect(result).to.be.instanceOf(Promise);
    });

    it('should have is2FANeeded method that returns Promise', () => {
      const result = sdk.is2FANeeded('test@example.com');
      expect(result).to.be.instanceOf(Promise);
    });

    it('should have list method that returns Promise', () => {
      const result = sdk.list();
      expect(result).to.be.instanceOf(Promise);
    });

    it('should have createFolder method that returns Promise', () => {
      const result = sdk.createFolder('test-folder');
      expect(result).to.be.instanceOf(Promise);
    });
  });
});
