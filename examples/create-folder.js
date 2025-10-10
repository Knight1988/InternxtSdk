require('dotenv').config();
const InternxtSDK = require('../src/index');

/**
 * Example: Create folders in Internxt Drive
 */
async function createFolderExample() {
  const sdk = new InternxtSDK();

  try {
    // Get credentials (assumes already logged in)
    await sdk.getCredentials();
    
    console.log('Creating folders...\n');
    
    // Create a parent folder
    const parentFolder = await sdk.createFolder(`SDK-Demo-${Date.now()}`);
    console.log('✅ Created parent folder:', parentFolder.name);
    console.log('   ID:', parentFolder.id);
    console.log('');
    
    // Create subfolders
    const subfolder1 = await sdk.createFolder('Documents', parentFolder.id);
    console.log('✅ Created subfolder:', subfolder1.name);
    console.log('   ID:', subfolder1.id);
    console.log('');
    
    const subfolder2 = await sdk.createFolder('Photos', parentFolder.id);
    console.log('✅ Created subfolder:', subfolder2.name);
    console.log('   ID:', subfolder2.id);
    console.log('');
    
    // List the parent folder to see subfolders
    console.log('Listing parent folder contents:');
    const contents = await sdk.list(parentFolder.id);
    contents.folders.forEach(f => console.log('  📁', f.name));
    
    return { parentFolder, subfolders: [subfolder1, subfolder2] };
  } catch (error) {
    console.error('❌ Create folder failed:', error.message);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  createFolderExample()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { createFolderExample };
