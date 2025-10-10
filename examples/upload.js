require('dotenv').config();
const InternxtSDK = require('../dist/index').default;

/**
 * Example: Upload a file to Internxt Drive
 */
async function uploadExample() {
  const sdk = new InternxtSDK();

  try {
    // Get credentials (assumes already logged in)
    await sdk.getCredentials();
    
    console.log('Uploading file...\n');
    
    // Create a test file to upload
    const fs = require('fs');
    const testFile = './test-upload.txt';
    fs.writeFileSync(testFile, `Test file created at ${new Date().toISOString()}`);
    
    // Upload with progress tracking
    const uploadedFile = await sdk.uploadFile(
      testFile,
      null, // null = root folder
      (progress) => {
        const percent = Math.round(progress * 100);
        process.stdout.write(`\rUpload progress: ${percent}%`);
      }
    );
    
    console.log('\n\n✅ File uploaded successfully!');
    console.log('File ID:', uploadedFile.id);
    console.log('File Name:', uploadedFile.name);
    console.log('File Size:', uploadedFile.size, 'bytes');
    
    // Clean up local test file
    fs.unlinkSync(testFile);
    
    return uploadedFile;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  uploadExample()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { uploadExample };
