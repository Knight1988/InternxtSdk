#!/usr/bin/env node

require('dotenv').config();
const InternxtSDK = require('./dist/index').default;
const readline = require('readline');

// Create SDK instance
const sdk = new InternxtSDK();

/**
 * Prompt user for input
 */
async function promptInput(question, isPassword = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Example usage of the SDK
 */
async function main() {
  console.log('=== Internxt SDK Demo ===\n');

  try {
    // Check if already logged in
    const isLoggedIn = await sdk.isLoggedIn();
    
    if (!isLoggedIn) {
      console.log('Please login to your Internxt account:\n');
      
      // Get credentials
      const email = process.env.INXT_USER || await promptInput('Email: ');
      const password = process.env.INXT_PASSWORD || await promptInput('Password: ');
      
      // Check 2FA
      const needs2FA = await sdk.is2FANeeded(email);
      let twoFactorCode;
      
      if (needs2FA) {
        console.log('Two-factor authentication is enabled.');
        twoFactorCode = process.env.INXT_TWOFACTORCODE || await promptInput('2FA Code: ');
      }
      
      // Login
      console.log('\nLogging in...');
      const loginResult = await sdk.login(email, password, twoFactorCode);
      console.log('✅ Login successful!');
      console.log('User:', loginResult.user.email);
      console.log('Root Folder ID:', loginResult.user.rootFolderId);
    } else {
      console.log('Already logged in! Loading credentials...');
      await sdk.getCredentials();
      console.log('✅ Credentials loaded');
    }

    console.log('\n--- Listing root folder contents ---');
    const contents = await sdk.list();
    console.log(`\nFolders (${contents.folders.length}):`);
    contents.folders.slice(0, 5).forEach(folder => {
      console.log(`  📁 ${folder.name} (ID: ${folder.id})`);
    });
    if (contents.folders.length > 5) {
      console.log(`  ... and ${contents.folders.length - 5} more`);
    }
    
    console.log(`\nFiles (${contents.files.length}):`);
    contents.files.slice(0, 5).forEach(file => {
      console.log(`  📄 ${file.name} (${formatFileSize(file.size)})`);
    });
    if (contents.files.length > 5) {
      console.log(`  ... and ${contents.files.length - 5} more`);
    }

    // Demonstrate creating a folder
    console.log('\n--- Creating a test folder ---');
    const folderName = `SDK-Test-${Date.now()}`;
    const newFolder = await sdk.createFolder(folderName);
    console.log('✅ Folder created:', newFolder.name);
    console.log('   ID:', newFolder.id);

    console.log('\n--- Demo completed successfully! ---');
    console.log('\nYou can now use the SDK in your own code:');
    console.log('  const InternxtSDK = require("./src/index");');
    console.log('  const sdk = new InternxtSDK();');
    console.log('  await sdk.login(email, password);');
    console.log('  const files = await sdk.list();');
    console.log('  await sdk.uploadFile("./myfile.txt");');
    console.log('  await sdk.downloadFile(fileId, "./downloads");');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { sdk };
