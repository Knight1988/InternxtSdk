# Test Environment Configuration

## Overview
This file contains test environment variables. Create a `.env.test.local` file for your actual credentials.

## Setup

1. Copy `.env.test` to `.env.test.local`:
   ```bash
   cp .env.test .env.test.local
   ```

2. Edit `.env.test.local` and add your test account credentials:
   ```bash
   INTERNXT_TEST_EMAIL=your-test-email@example.com
   INTERNXT_TEST_PASSWORD=your-test-password
   INTERNXT_TEST_2FA_SECRET=your-2fa-secret-key-if-needed
   ```

3. The `.env.test.local` file is gitignored and safe for local testing

## Available Variables

### Required
- `INTERNXT_TEST_EMAIL` - Your test account email
- `INTERNXT_TEST_PASSWORD` - Your test account password

### Optional
- `INTERNXT_TEST_2FA_SECRET` - Your 2FA secret key (TOTP secret) if your account requires it
  - This is the secret key shown when you first set up 2FA (usually a long alphanumeric string)
  - The test suite will automatically generate time-based codes from this secret
- `TEST_TIMEOUT` - Test timeout in milliseconds (default: 30000)
- `TEST_FOLDER_NAME` - Name for test folders (default: test-folder-mocha)
- `TEST_FILE_PATH` - Path to test file (default: ./test/fixtures/test-file.txt)
- `DRIVE_NEW_API_URL` - Custom API URL
- `NETWORK_URL` - Custom network URL

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage
```

## Notes

- Integration tests require valid Internxt credentials
- If credentials are not configured, integration tests will be skipped
- Unit tests do not require credentials and can run offline
- Test files are automatically created in `test/fixtures/`
- Use a dedicated test account, not your production account
