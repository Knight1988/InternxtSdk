import { expect, getTestCredentials, getTestConfig, TEST_TIMEOUT } from '../setup';
import InternxtSDK from '../../src/index';
import { Folder } from '../../src/types';

describe('Folder Operations Integration Tests', function() {
  this.timeout(TEST_TIMEOUT);

  let sdk: InternxtSDK;
  let credentials: ReturnType<typeof getTestCredentials>;
  let testConfig: ReturnType<typeof getTestConfig>;
  let createdFolder: Folder | null = null;

  before(async function() {
    try {
      credentials = getTestCredentials();
      testConfig = getTestConfig();
    } catch (error) {
      console.warn('\n⚠️  Skipping integration tests: Test credentials not configured');
      this.skip();
    }

    sdk = new InternxtSDK();
    await sdk.login(
      credentials.email,
      credentials.password,
      credentials.twoFactorCode
    );
  });

  after(async () => {
    // Cleanup: Delete created test folder if exists
    if (createdFolder) {
      try {
        // Note: SDK doesn't expose delete yet, but we track it for manual cleanup
        console.log(`\n⚠️  Please manually delete test folder: ${createdFolder.name} (ID: ${createdFolder.id})`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    const loggedIn = await sdk.isLoggedIn();
    if (loggedIn) {
      await sdk.logout();
    }
  });

  describe('list', () => {
    it('should list root folder contents', async () => {
      const contents = await sdk.list();

      expect(contents).to.have.property('folders');
      expect(contents).to.have.property('files');
      expect(contents.folders).to.be.an('array');
      expect(contents.files).to.be.an('array');
    });

    it('should list specific folder contents by ID', async () => {
      // Create a test folder first
      const testFolder = await sdk.createFolder(`list-test-${Date.now()}`);
      const contents = await sdk.list(testFolder.id);

      expect(contents).to.have.property('folders');
      expect(contents).to.have.property('files');
    });

    it('should return folder metadata', async () => {
      const contents = await sdk.list();

      if (contents.folders.length > 0) {
        const folder = contents.folders[0];
        
        expect(folder).to.have.property('id');
        expect(folder).to.have.property('name');
        expect(folder).to.have.property('createdAt');
        expect(folder).to.have.property('updatedAt');
        
        expect(folder.id).to.be.a('string');
        expect(folder.name).to.be.a('string');
      }
    });
  });

  describe('createFolder', () => {
    it('should create folder in root', async () => {
      const folderName = `${testConfig.folderName}-${Date.now()}`;
      const folder = await sdk.createFolder(folderName);

      createdFolder = folder;

      expect(folder).to.have.property('id');
      expect(folder).to.have.property('name');
      expect(folder.name).to.equal(folderName);
      expect(folder.id).to.be.a('string');
    });

    it('should create folder in specific parent', async () => {
      // First create parent folder
      const parentName = `parent-${Date.now()}`;
      const parentFolder = await sdk.createFolder(parentName);

      // Then create child folder
      const childName = `child-${Date.now()}`;
      const childFolder = await sdk.createFolder(childName, parentFolder.id);

      expect(childFolder).to.have.property('id');
      expect(childFolder).to.have.property('name');
      expect(childFolder.name).to.equal(childName);
      expect(childFolder).to.have.property('parentId');
      expect(childFolder.parentId).to.equal(parentFolder.id);
    });

    it('should fail to create folder with empty name', async function() {
      try {
        await sdk.createFolder('');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe('renameFolder', () => {
    it('should rename folder successfully', async function() {
      this.timeout(TEST_TIMEOUT);

      // Create folder to rename
      const originalName = `rename-test-${Date.now()}`;
      const folder = await sdk.createFolder(originalName);

      // Rename it
      const newName = `renamed-${Date.now()}`;
      const result = await sdk.renameFolder(folder.id, newName);

      expect(result).to.have.property('success', true);

      // Verify rename by listing folder contents
      const contents = await sdk.list();
      const renamedFolder = contents.folders.find(f => f.id === folder.id);

      expect(renamedFolder).to.exist;
      expect(renamedFolder?.name).to.equal(newName);
    });
  });

  describe('moveFolder', () => {
    it('should move folder to another parent', async function() {
      this.timeout(TEST_TIMEOUT);

      // Create source and destination folders
      const folderToMove = await sdk.createFolder(`move-source-${Date.now()}`);
      const destinationFolder = await sdk.createFolder(`move-dest-${Date.now()}`);

      // Move folder
      const result = await sdk.moveFolder(folderToMove.id, destinationFolder.id);

      expect(result).to.have.property('success', true);

      // Verify move by checking destination folder contents
      const destContents = await sdk.list(destinationFolder.id);
      const movedFolder = destContents.folders.find(f => f.id === folderToMove.id);

      expect(movedFolder).to.exist;
    });
  });
});
