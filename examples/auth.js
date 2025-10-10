require('dotenv').config();
const InternxtSDK = require('../dist/index').default;
const readline = require('readline');

/**
 * Example: Complete authentication flow
 */
async function authExample() {
  const sdk = new InternxtSDK();

  try {
    // Check if already logged in
    const isLoggedIn = await sdk.isLoggedIn();
    
    if (isLoggedIn) {
      console.log('✅ Already logged in!');
      const credentials = await sdk.getCredentials();
      console.log('User:', credentials.user.email);
      console.log('Root Folder ID:', credentials.user.rootFolderId);
      
      // Ask if user wants to logout
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      const answer = await new Promise(resolve => {
        rl.question('\nLogout? (y/n): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() === 'y') {
        await sdk.logout();
        console.log('✅ Logged out successfully');
      }
      
      return;
    }
    
    console.log('Not logged in. Please provide credentials:\n');
    
    // Get credentials from environment or prompt
    if (!process.env.INXT_USER || !process.env.INXT_PASSWORD) {
      console.log('Set INXT_USER and INXT_PASSWORD in .env file');
      console.log('Example:');
      console.log('  INXT_USER=your-email@example.com');
      console.log('  INXT_PASSWORD=your-password');
      console.log('  INXT_TWOFACTORCODE=123456  # if 2FA enabled');
      return;
    }
    
    const email = process.env.INXT_USER;
    const password = process.env.INXT_PASSWORD;
    
    // Check if 2FA is needed
    console.log('Checking 2FA status...');
    const needs2FA = await sdk.is2FANeeded(email);
    console.log('2FA enabled:', needs2FA);
    
    let twoFactorCode = null;
    if (needs2FA) {
      twoFactorCode = process.env.INXT_TWOFACTORCODE;
      if (!twoFactorCode) {
        console.log('2FA is enabled but INXT_TWOFACTORCODE not set in .env');
        return;
      }
    }
    
    // Login
    console.log('\nLogging in...');
    const result = await sdk.login(email, password, twoFactorCode);
    
    console.log('\n✅ Login successful!');
    console.log('User:', result.user.email);
    console.log('UUID:', result.user.uuid);
    console.log('Root Folder ID:', result.user.rootFolderId);
    console.log('\nCredentials saved. Next time you can use the SDK without logging in again.');
    
    return result;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  authExample()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { authExample };
