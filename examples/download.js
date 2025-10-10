require('dotenv').config();
const InternxtSDK = require('../dist/index').default;

/**
 * Example: Download a file from Internxt Drive
 */
async function downloadExample(fileId) {
  const sdk = new InternxtSDK();

  try {
    // Get credentials (assumes already logged in)
    await sdk.getCredentials();
    
    if (!fileId) {
      console.log('Getting first file from root folder...');
      const contents = await sdk.list();
      if (contents.files.length === 0) {
        console.log('No files found in root folder');
        return;
      }
      fileId = contents.files[0].id;
      console.log('Downloading file:', contents.files[0].name);
    }
    
    console.log('File ID:', fileId);
    console.log('Downloading...\n');
    
    // Create downloads directory if it doesn't exist
    const fs = require('fs');
    const downloadDir = './downloads';
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    // Download with progress tracking
    const result = await sdk.downloadFile(
      fileId,
      downloadDir,
      (progress) => {
        const percent = Math.round(progress * 100);
        process.stdout.write(`\rDownload progress: ${percent}%`);
      }
    );
    
    console.log('\n\n✅ File downloaded successfully!');
    console.log('Saved to:', result.path);
    console.log('File name:', result.name);
    console.log('File size:', result.size, 'bytes');
    
    return result;
  } catch (error) {
    console.error('❌ Download failed:', error.message);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  const fileId = process.argv[2]; // Get file ID from command line
  downloadExample(fileId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { downloadExample };
