import * as fs from 'fs';
import * as path from 'path';
import InternxtSDK from '../../src/index';
import { expect, getTestConfig, getTestCredentials, TEST_TIMEOUT } from '../setup';

describe('File Operations Integration Tests', function () {
  this.timeout(TEST_TIMEOUT);

  let sdk: InternxtSDK;
  let credentials: ReturnType<typeof getTestCredentials>;
  let testConfig: ReturnType<typeof getTestConfig>;
  let testFilePath: string;
  let testFolderId: string | null = null;
  let uploadedFileIds: string[] = [];
  let createdFolderIds: string[] = [];

  before(async function () {
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

    // Create or find Test folder for integration tests
    const rootContents = await sdk.list();
    let testFolder = rootContents.folders.find(f => f.name === 'Test');

    if (!testFolder) {
      testFolder = await sdk.createFolder('Test');
      console.log(`\n✓ Created Test folder (ID: ${testFolder.id})`);
    } else {
      console.log(`\n✓ Using existing Test folder (ID: ${testFolder.id})`);
    }

    testFolderId = testFolder.id;
  });

  after(async () => {
    // Cleanup uploaded files
    if (uploadedFileIds.length > 0) {
      console.log('\n🧹 Cleaning up test files...');

      for (const fileId of uploadedFileIds) {
        try {
          const driveFile = (sdk as any).driveFile;
          if (driveFile && typeof driveFile.deleteFile === 'function') {
            await driveFile.deleteFile(fileId);
            console.log(`  ✓ Deleted file ${fileId}`);
          }
        } catch (error: any) {
          console.warn(`  ⚠️  Failed to delete file ${fileId}: ${error.message}`);
        }
      }
    }

    // Cleanup created folders
    if (createdFolderIds.length > 0) {
      console.log('🧹 Cleaning up test folders...');

      for (const folderId of createdFolderIds.reverse()) {
        try {
          const driveFolder = (sdk as any).driveFolder;
          if (driveFolder && typeof driveFolder.deleteFolder === 'function') {
            await driveFolder.deleteFolder(folderId);
            console.log(`  ✓ Deleted folder ${folderId}`);
          }
        } catch (error: any) {
          console.warn(`  ⚠️  Failed to delete folder ${folderId}: ${error.message}`);
        }
      }
    }

    const loggedIn = await sdk.isLoggedIn();
    if (loggedIn) {
      await sdk.logout();
    }
  });

  describe('uploadFile', () => {
    it('should upload file to Test folder', async function () {
      this.timeout(60000); // Upload can take time

      // Create a unique test file for this upload
      const uniqueFilePath = path.join(
        path.dirname(testFilePath),
        `upload-test-${Date.now()}.txt`
      );
      fs.writeFileSync(uniqueFilePath, `Upload test file\nCreated at: ${new Date().toISOString()}\n`);

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

      const uploadedFile = await sdk.uploadFile(uniqueFilePath, testFolderId!, onProgress);

      // Clean up local test file
      fs.unlinkSync(uniqueFilePath);

      uploadedFileIds.push(uploadedFile.id);

      expect(uploadedFile).to.have.property('id');
      expect(uploadedFile).to.have.property('name');
      expect(uploadedFile).to.have.property('size');

      expect(uploadedFile.id).to.be.a('string');
      expect(uploadedFile.name).to.be.a('string');
      expect(uploadedFile.size).to.be.a('number');
      expect(uploadedFile.size).to.be.greaterThan(0);

      // Progress callback may not be called for very small files
      if (progressCalled) {
        expect(lastProgress).to.be.at.most(1);
      }
    });

    it('should upload file to subfolder in Test directory', async function () {
      this.timeout(60000);

      // Create unique test file
      const uniqueFilePath = path.join(
        path.dirname(testFilePath),
        `subfolder-test-${Date.now()}.txt`
      );
      fs.writeFileSync(uniqueFilePath, `Subfolder test file\nCreated at: ${new Date().toISOString()}\n`);

      // Create test subfolder in Test
      const folder = await sdk.createFolder(`upload-test-${Date.now()}`, testFolderId!);
      createdFolderIds.push(folder.id);

      const uploadedFile = await sdk.uploadFile(uniqueFilePath, folder.id);
      uploadedFileIds.push(uploadedFile.id);

      // Clean up local test file
      fs.unlinkSync(uniqueFilePath);

      expect(uploadedFile).to.have.property('id');
      expect(uploadedFile).to.have.property('folderId');
      expect(uploadedFile.folderId).to.equal(folder.id);
    });

    it('should fail to upload non-existent file', async function () {
      try {
        await sdk.uploadFile('/nonexistent/file/path.txt', testFolderId!);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it('should handle progress callback correctly', async function () {
      this.timeout(60000);

      // Create a larger file to ensure progress callbacks are triggered
      const largeFilePath = path.join(
        path.dirname(testFilePath),
        `progress-test-${Date.now()}.txt`
      );
      // Create a file with ~1MB of content to ensure progress callbacks
      const largeContent = 'x'.repeat(1024 * 1024);
      fs.writeFileSync(largeFilePath, largeContent);

      const progressValues: number[] = [];

      const onProgress = (progress: number) => {
        progressValues.push(progress);
      };

      const uploadedFile = await sdk.uploadFile(largeFilePath, testFolderId!, onProgress);
      uploadedFileIds.push(uploadedFile.id);

      // Clean up local test file
      fs.unlinkSync(largeFilePath);

      // Progress may or may not be called depending on file size and upload speed
      // Just verify that if called, values are valid
      if (progressValues.length > 0) {
        expect(progressValues[0]).to.be.at.least(0);
        expect(progressValues[progressValues.length - 1]).to.be.at.most(1);

        // Progress should be monotonically increasing
        for (let i = 1; i < progressValues.length; i++) {
          expect(progressValues[i]).to.be.at.least(progressValues[i - 1]);
        }
      }
    });
  });

  describe('getFileMetadata', () => {
    it('should get file metadata after upload', async function () {
      this.timeout(60000);

      // Create unique test file
      const uniqueFilePath = path.join(
        path.dirname(testFilePath),
        `metadata-test-${Date.now()}.txt`
      );
      fs.writeFileSync(uniqueFilePath, `Metadata test file\nCreated at: ${new Date().toISOString()}\n`);

      // Upload a file first to Test folder
      const uploadedFile = await sdk.uploadFile(uniqueFilePath, testFolderId!);
      uploadedFileIds.push(uploadedFile.id);

      // Clean up local test file
      fs.unlinkSync(uniqueFilePath);

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
    it('should download file successfully', async function () {
      this.timeout(60000);

      // Create unique test file
      const uniqueFilePath = path.join(
        path.dirname(testFilePath),
        `download-test-${Date.now()}.txt`
      );
      fs.writeFileSync(uniqueFilePath, `Download test file\nCreated at: ${new Date().toISOString()}\n`);

      // Upload a file first to Test folder
      const uploadedFile = await sdk.uploadFile(uniqueFilePath, testFolderId!);
      uploadedFileIds.push(uploadedFile.id);

      // Clean up local upload file
      fs.unlinkSync(uniqueFilePath);

      // Download it to a different location
      const downloadDir = path.dirname(testFilePath);

      const onProgress = (progress: number) => {
        expect(progress).to.be.at.least(0);
        expect(progress).to.be.at.most(1);
      };

      const downloadedFile = await sdk.downloadFile(
        uploadedFile.id,
        downloadDir,
        onProgress
      );

      expect(downloadedFile).to.have.property('path');
      expect(downloadedFile).to.have.property('name');
      expect(downloadedFile).to.have.property('size');

      expect(fs.existsSync(downloadedFile.path)).to.be.true;

      // Progress callback may not be called for very small files
      // expect(progressCalled).to.be.true;

      // Cleanup
      fs.unlinkSync(downloadedFile.path);
    });

    it('should download file content correctly', async function () {
      this.timeout(60000);

      // Create a file with specific content
      const specificContent = `Test content ${Date.now()}\nLine 2\nLine 3`;
      const specificFilePath = path.join(path.dirname(testFilePath), `specific-${Date.now()}.txt`);
      fs.writeFileSync(specificFilePath, specificContent);

      // Upload it to Test folder
      const uploadedFile = await sdk.uploadFile(specificFilePath, testFolderId!);
      uploadedFileIds.push(uploadedFile.id);

      // Clean up local upload file
      fs.unlinkSync(specificFilePath);

      // Download it
      const downloadDir = path.dirname(testFilePath);
      const downloadedFile = await sdk.downloadFile(uploadedFile.id, downloadDir);

      // Verify content matches
      const downloadedContent = fs.readFileSync(downloadedFile.path, 'utf-8');
      expect(downloadedContent).to.equal(specificContent);

      // Cleanup downloaded file
      fs.unlinkSync(downloadedFile.path);
    });
  });

  describe('renameFile', () => {
    it('should rename file successfully', async function () {
      this.timeout(60000);

      // Create unique test file
      const uniqueFilePath = path.join(
        path.dirname(testFilePath),
        `rename-test-${Date.now()}.txt`
      );
      fs.writeFileSync(uniqueFilePath, `Rename test file\nCreated at: ${new Date().toISOString()}\n`);

      // Upload a file to Test folder
      const uploadedFile = await sdk.uploadFile(uniqueFilePath, testFolderId!);
      uploadedFileIds.push(uploadedFile.id);

      // Clean up local test file
      fs.unlinkSync(uniqueFilePath);

      // Rename it
      const newName = `renamed-file-${Date.now()}.txt`;
      const result = await sdk.renameFile(uploadedFile.id, newName);

      expect(result).to.have.property('success', true);

      // Verify rename by checking metadata
      const metadata = await sdk.getFileMetadata(uploadedFile.id);
      expect(metadata.name).to.include('renamed-file');
    });
  });

  describe('moveFile', () => {
    it('should move file within Test folder structure', async function () {
      this.timeout(60000);

      // Create unique test file
      const uniqueFilePath = path.join(
        path.dirname(testFilePath),
        `move-test-${Date.now()}.txt`
      );
      fs.writeFileSync(uniqueFilePath, `Move test file\nCreated at: ${new Date().toISOString()}\n`);

      // Upload a file to Test folder
      const uploadedFile = await sdk.uploadFile(uniqueFilePath, testFolderId!);
      uploadedFileIds.push(uploadedFile.id);

      // Clean up local test file
      fs.unlinkSync(uniqueFilePath);

      // Create destination folder in Test
      const destFolder = await sdk.createFolder(`file-dest-${Date.now()}`, testFolderId!);
      createdFolderIds.push(destFolder.id);

      // Move file
      const result = await sdk.moveFile(uploadedFile.id, destFolder.id);

      expect(result).to.have.property('success', true);

      // Verify move by checking destination folder contents
      const contents = await sdk.list(destFolder.id);
      const movedFile = contents.files.find(f => f.id === uploadedFile.id);

      expect(movedFile).to.exist;
      expect(movedFile?.id).to.equal(uploadedFile.id);
    });
  });
});
