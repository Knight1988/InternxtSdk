import * as dotenv from 'dotenv';
import * as path from 'path';
import * as chai from 'chai';

// Load test environment variables
const envPath = path.resolve(process.cwd(), '.env.test.local');
const envTestPath = path.resolve(process.cwd(), '.env.test');

// Try to load .env.test.local first (local overrides), fallback to .env.test
dotenv.config({ path: envPath });
dotenv.config({ path: envTestPath });

// Configure Chai
export const expect = chai.expect;

// Test timeout configuration
export const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '30000', 10);

// Test credentials from environment
export const getTestCredentials = () => {
  const email = process.env.INTERNXT_TEST_EMAIL;
  const password = process.env.INTERNXT_TEST_PASSWORD;
  const twoFactorCode = process.env.INTERNXT_TEST_2FA_CODE;

  if (!email || !password) {
    throw new Error(
      'Test credentials not found. Please create .env.test.local with INTERNXT_TEST_EMAIL and INTERNXT_TEST_PASSWORD'
    );
  }

  return {
    email,
    password,
    twoFactorCode: twoFactorCode || undefined,
  };
};

// Test configuration
export const getTestConfig = () => {
  return {
    folderName: process.env.TEST_FOLDER_NAME || 'test-folder-mocha',
    filePath: process.env.TEST_FILE_PATH || './test/fixtures/test-file.txt',
  };
};
