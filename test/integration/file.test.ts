import { expect, getTestCredentials, getTestConfig, TEST_TIMEOUT } from '../setup';
import InternxtSDK from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';

describe('File Operations Integration Tests', function() {
  this.timeout(TEST_TIMEOUT);

  let sdk: InternxtSDK;
  let credentials: ReturnType<typeof getTestCredentials>;
  let testConfig: ReturnType<typeof getTestConfig>;
  let testFilePath: string;
  let uploadedFileId: string | null = null;

  before(async function() {
    try {
      credentials = getTestCredentials();
      testConfig = getTestConfig();
    } catch (error) {
      console.warn('\n⚠️  Skipping integration tests: Test credentials not configured');
      this.skip();
    }

    // Ensure test file exists
    testFilePath = path.resolve(process.cwd(), testConfig.filePath);
    const testFileDir = path.dirname(testFilePath);
    
    if (!fs.existsSync(testFileDir)) {
      fs.mkdirSync(testFileDir, { recursive: true });
    }

    if (!fs.existsSync(testFilePath)) {
      fs.writeFileSync(
        testFilePath,
        `Test file content\nCreated at: ${new Date().toISOString()}\n`
      );
    }

    sdk = new InternxtSDK();
    await sdk.login(
      credentials.email,
      credentials.password,
      credentials.twoFactorCode
    );
  });

  after(async () => {
    // Cleanup note
    if (uploadedFileId) {
      console.log(`\n⚠️  Please manually delete test file (ID: ${uploadedFileId})`);
    }

    const loggedIn = await sdk.isLoggedIn();
    if (loggedIn) {
      await sdk.logout();
    }
  });

  describe('uploadFile', () => {
    it('should upload file to root folder', async function() {
      this.timeout(60000); // Upload can take time

      let progressCalled = false;
      let lastProgress = 0;

      const onProgress = (progress: number) => {
        progressCalled = true;
        expect(progress).to.be.a('number');
        expect(progress).to.be.at.least(0);
        expect(progress).to.be.at.most(1);
        expect(progress).to.be.at.least(lastProgress);
        lastProgress = progress;
      };

      const uploadedFile = await sdk.uploadFile(testFilePath, null, onProgress);

      uploadedFileId = uploadedFile.id;

      expect(uploadedFile).to.have.property('id');
      expect(uploadedFile).to.have.property('name');
      expect(uploadedFile).to.have.property('size');
      
      expect(uploadedFile.id).to.be.a('string');
      expect(uploadedFile.name).to.be.a('string');
      expect(uploadedFile.size).to.be.a('number');
      expect(uploadedFile.size).to.be.greaterThan(0);
      
      expect(progressCalled).to.be.true;
      expect(lastProgress).to.equal(1); // Should reach 100%
    });

    it('should upload file to specific folder', async function() {
      this.timeout(60000);

      // Create test folder
      const folder = await sdk.createFolder(`upload-test-${Date.now()}`);

      const uploadedFile = await sdk.uploadFile(testFilePath, folder.id);

      expect(uploadedFile).to.have.property('id');
      expect(uploadedFile).to.have.property('folderId');
      expect(uploadedFile.folderId).to.equal(folder.id);
    });

    it('should fail to upload non-existent file', async function() {
      try {
        await sdk.uploadFile('/nonexistent/file/path.txt');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it('should handle progress callback correctly', async function() {
      this.timeout(60000);

      const progressValues: number[] = [];

      const onProgress = (progress: number) => {
        progressValues.push(progress);
      };

      await sdk.uploadFile(testFilePath, null, onProgress);

      expect(progressValues.length).to.be.greaterThan(0);
      expect(progressValues[0]).to.be.at.least(0);
      expect(progressValues[progressValues.length - 1]).to.equal(1);
      
      // Progress should be monotonically increasing
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).to.be.at.least(progressValues[i - 1]);
      }
    });
  });

  describe('getFileMetadata', () => {
    it('should get file metadata after upload', async function() {
      this.timeout(60000);

      // Upload a file first
      const uploadedFile = await sdk.uploadFile(testFilePath);
      
      // Get metadata
      const metadata = await sdk.getFileMetadata(uploadedFile.id);

      expect(metadata).to.have.property('id');
      expect(metadata).to.have.property('name');
      expect(metadata).to.have.property('size');
      expect(metadata).to.have.property('type');
      expect(metadata).to.have.property('createdAt');
      expect(metadata).to.have.property('updatedAt');
      
      expect(metadata.id).to.equal(uploadedFile.id);
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async function() {
      this.timeout(60000);

      // Upload a file first
      const uploadedFile = await sdk.uploadFile(testFilePath);

      // Download it
      const downloadPath = path.join(path.dirname(testFilePath), `downloaded-${Date.now()}.txt`);
      
      let progressCalled = false;

      const onProgress = (progress: number) => {
        progressCalled = true;
        expect(progress).to.be.at.least(0);
        expect(progress).to.be.at.most(1);
      };

      const downloadedFile = await sdk.downloadFile(
        uploadedFile.id,
        downloadPath,
        onProgress
      );

      expect(downloadedFile).to.have.property('fileId');
      expect(downloadedFile).to.have.property('path');
      expect(downloadedFile.path).to.equal(downloadPath);
      
      expect(fs.existsSync(downloadPath)).to.be.true;
      expect(progressCalled).to.be.true;

      // Cleanup
      fs.unlinkSync(downloadPath);
    });

    it('should download file content correctly', async function() {
      this.timeout(60000);

      // Create a file with specific content
      const specificContent = `Test content ${Date.now()}\nLine 2\nLine 3`;
      const specificFilePath = path.join(path.dirname(testFilePath), `specific-${Date.now()}.txt`);
      fs.writeFileSync(specificFilePath, specificContent);

      // Upload it
      const uploadedFile = await sdk.uploadFile(specificFilePath);

      // Download it
      const downloadPath = path.join(path.dirname(testFilePath), `verify-${Date.now()}.txt`);
      await sdk.downloadFile(uploadedFile.id, downloadPath);

      // Verify content
      const downloadedContent = fs.readFileSync(downloadPath, 'utf-8');
      expect(downloadedContent).to.equal(specificContent);

      // Cleanup
      fs.unlinkSync(specificFilePath);
      fs.unlinkSync(downloadPath);
    });
  });

  describe('renameFile', () => {
    it('should rename file successfully', async function() {
      this.timeout(60000);

      // Upload a file
      const uploadedFile = await sdk.uploadFile(testFilePath);

      // Rename it
      const newName = `renamed-file-${Date.now()}.txt`;
      const result = await sdk.renameFile(uploadedFile.id, newName);

      expect(result).to.have.property('success', true);

      // Verify rename
      const metadata = await sdk.getFileMetadata(uploadedFile.id);
      expect(metadata.name).to.equal(newName);
    });
  });

  describe('moveFile', () => {
    it('should move file to another folder', async function() {
      this.timeout(60000);

      // Upload a file
      const uploadedFile = await sdk.uploadFile(testFilePath);

      // Create destination folder
      const destFolder = await sdk.createFolder(`file-dest-${Date.now()}`);

      // Move file
      const result = await sdk.moveFile(uploadedFile.id, destFolder.id);

      expect(result).to.have.property('success', true);

      // Verify move
      const contents = await sdk.list(destFolder.id);
      const movedFile = contents.files.find(f => f.id === uploadedFile.id);

      expect(movedFile).to.exist;
    });
  });
});
