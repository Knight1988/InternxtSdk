require('dotenv').config();
const InternxtSDK = require('../src/index');

/**
 * Example: List contents of folders
 */
async function listExample(folderId = null) {
  const sdk = new InternxtSDK();

  try {
    // Get credentials (assumes already logged in)
    await sdk.getCredentials();
    
    console.log('Listing folder contents...\n');
    
    // List folder
    const contents = await sdk.list(folderId);
    
    console.log('=== Folders ===');
    if (contents.folders.length === 0) {
      console.log('  (no folders)');
    } else {
      contents.folders.forEach(folder => {
        console.log(`  📁 ${folder.name}`);
        console.log(`     ID: ${folder.id}`);
        console.log(`     Created: ${new Date(folder.createdAt).toLocaleString()}`);
        console.log('');
      });
    }
    
    console.log('=== Files ===');
    if (contents.files.length === 0) {
      console.log('  (no files)');
    } else {
      contents.files.forEach(file => {
        const size = formatFileSize(file.size);
        console.log(`  📄 ${file.name} (${size})`);
        console.log(`     ID: ${file.id}`);
        console.log(`     Type: ${file.type || 'none'}`);
        console.log(`     Modified: ${new Date(file.updatedAt).toLocaleString()}`);
        console.log('');
      });
    }
    
    console.log(`Total: ${contents.folders.length} folders, ${contents.files.length} files`);
    
    return contents;
  } catch (error) {
    console.error('❌ List failed:', error.message);
    throw error;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Run if executed directly
if (require.main === module) {
  const folderId = process.argv[2]; // Get folder ID from command line
  listExample(folderId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { listExample };
