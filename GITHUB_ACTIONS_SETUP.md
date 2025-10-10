# GitHub Actions CI/CD Setup Guide

## Overview

This project uses GitHub Actions for:
1. **Continuous Integration (CI)** - Run tests on every push/PR
2. **NPM Publishing** - Automatically publish to NPM on releases
3. **Integration Testing** - Run full integration tests with credentials

## Required GitHub Secrets

### For NPM Publishing

#### `NPM_TOKEN` (Required for publishing)
1. Go to https://www.npmjs.com
2. Sign in or create an account
3. Click your profile → Access Tokens
4. Click "Generate New Token" → "Classic Token"
5. Select "Automation" type
6. Copy the token
7. Add to GitHub: Repo → Settings → Secrets and variables → Actions → New repository secret

### For Integration Tests

#### `INTERNXT_TEST_EMAIL` (Required for integration tests)
Your Internxt test account email address.

**Example:** `test-account@example.com`

#### `INTERNXT_TEST_PASSWORD` (Required for integration tests)
Your Internxt test account password.

**Example:** `YourSecurePassword123!`

#### `INTERNXT_TEST_2FA_SECRET` (Required for integration tests)
Your TOTP 2FA secret key (NOT the 6-digit code).

**How to get it:**
1. When setting up 2FA in Internxt, you'll see a QR code
2. Click "Can't scan?" or "Enter manually"
3. Copy the secret key (usually 16+ characters)
4. This is the key used to generate 6-digit codes

**Example:** `JBSWY3DPEHPK3PXP`

#### `DESKTOP_HEADER` (Optional)
Desktop header token for privileged operations. Has a default value if not set.

**Default:** `3b68706a367fd567b929396290b1de40768bb768`

### How to Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:
   - Name: `NPM_TOKEN`, Value: (your NPM token)
   - Name: `INTERNXT_TEST_EMAIL`, Value: (your test email)
   - Name: `INTERNXT_TEST_PASSWORD`, Value: (your test password)
   - Name: `INTERNXT_TEST_2FA_SECRET`, Value: (your 2FA secret key)
   - Name: `DESKTOP_HEADER`, Value: (optional, use default if not set)

## GitHub Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**What it does:**
- Tests on Node.js 18.x, 20.x, and 22.x
- Runs `npm ci` to install dependencies
- Runs `npm run build` to compile TypeScript
- Runs `npm run test:unit` (only unit tests, no credentials needed)
- Runs `npx tsc --noEmit` to check types

**No secrets required** - Only runs unit tests.

### 2. NPM Publish Workflow (`.github/workflows/npm-publish.yml`)

**Triggers:**
- Creating a GitHub release
- Manual trigger via GitHub Actions UI

**What it does:**
- Runs unit tests on Node.js 18.x and 20.x
- If manually triggered AND secrets are available: runs integration tests
- Builds the package
- Publishes to NPM with provenance

**Required secrets:**
- `NPM_TOKEN` (for publishing)

**Optional secrets** (for integration tests on manual trigger):
- `INTERNXT_TEST_EMAIL`
- `INTERNXT_TEST_PASSWORD`
- `INTERNXT_TEST_2FA_SECRET`
- `DESKTOP_HEADER`

### 3. Integration Tests Workflow (`.github/workflows/integration-tests.yml`)

**Triggers:**
- Manual trigger via GitHub Actions UI
- Scheduled: Daily at 2 AM UTC

**What it does:**
- Runs full test suite including integration tests
- Uploads test artifacts (fixtures, logs) if tests fail

**Required secrets:**
- `INTERNXT_TEST_EMAIL`
- `INTERNXT_TEST_PASSWORD`
- `INTERNXT_TEST_2FA_SECRET`
- `DESKTOP_HEADER` (optional)

## Publishing to NPM

### Automatic Publishing (Recommended)

1. **Update version:**
   ```bash
   npm version patch  # or minor, or major
   ```

2. **Commit and push:**
   ```bash
   git push origin main
   git push --tags
   ```

3. **Create GitHub release:**
   
   Via GitHub CLI:
   ```bash
   gh release create v0.1.0 --title "Release v0.1.0" --notes "Initial release"
   ```
   
   Or via GitHub UI:
   - Go to your repo → Releases → Draft a new release
   - Choose or create a tag (e.g., `v0.1.0`)
   - Add release title and notes
   - Click "Publish release"

4. **Monitor the workflow:**
   - Go to Actions tab
   - Watch "Publish to NPM" workflow
   - Check that tests pass and package is published

### Manual Publishing

If you prefer to publish manually:

```bash
npm run build
npm publish
```

## Running Integration Tests in CI

### Option 1: Manual Trigger

1. Go to your repo → **Actions** tab
2. Click **Integration Tests** workflow
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow** button

### Option 2: Scheduled Run

Integration tests run automatically every day at 2 AM UTC. Check the Actions tab for results.

### Option 3: Before Publishing

When you manually trigger the "Publish to NPM" workflow (not via release), it will run integration tests if the secrets are configured.

## Local Development

### Setup

1. **Copy the test environment file:**
   ```bash
   cp .env.test .env.test.local
   ```

2. **Edit `.env.test.local` with your credentials:**
   ```bash
   INTERNXT_TEST_EMAIL=your-test-email@example.com
   INTERNXT_TEST_PASSWORD=your-test-password
   INTERNXT_TEST_2FA_SECRET=YOUR2FASECRETKEY
   ```

3. **Run tests:**
   ```bash
   # All tests (unit + integration)
   npm test
   
   # Unit tests only (fast, no credentials)
   npm run test:unit
   
   # Integration tests only
   npm run test:integration
   ```

## Test Separation

### Unit Tests (28 tests, ~600ms)
```bash
npm run test:unit
```
- Tests crypto utilities
- Tests SDK constructor
- No network calls
- No credentials required
- Safe for public CI

### Integration Tests (31 tests, ~50s)
```bash
npm run test:integration
```
- Tests authentication
- Tests file operations (upload, download, rename, move, delete)
- Tests folder operations (create, list, rename, move, delete)
- Requires valid Internxt credentials
- Requires 2FA secret for TOTP generation
- Cleans up test files/folders after running

### All Tests (59 tests)
```bash
npm test
```
Runs both unit and integration tests.

## Package Contents

When published to NPM, the package includes:
- ✅ `dist/` - Compiled JavaScript and TypeScript definitions
- ✅ `README.md` - Documentation
- ✅ `LICENSE` - License file
- ✅ `package.json` - Package metadata

Excluded (via `.npmignore`):
- ❌ `src/` - Source TypeScript files
- ❌ `test/` - Test files
- ❌ `.env*` - Environment files
- ❌ Configuration files (tsconfig, mocha, etc.)
- ❌ `.github/` - GitHub workflows

## Troubleshooting

### Integration tests fail in CI

**Problem:** Integration tests fail with "Test credentials not found"

**Solution:** 
1. Verify secrets are added to GitHub (Settings → Secrets → Actions)
2. Secret names must be exact: `INTERNXT_TEST_EMAIL`, `INTERNXT_TEST_PASSWORD`, `INTERNXT_TEST_2FA_SECRET`
3. Check that the workflow has access to secrets (look at workflow logs)

### NPM publish fails

**Problem:** Publish step fails with authentication error

**Solution:**
1. Check that `NPM_TOKEN` secret is added to GitHub
2. Verify token is still valid at npmjs.com
3. Ensure token has "Automation" type (not "Publish" or "Read")

### 2FA code generation fails

**Problem:** Tests fail with "Invalid 2FA code"

**Solution:**
1. Verify `INTERNXT_TEST_2FA_SECRET` is the secret key, not a 6-digit code
2. Check that your system time is synchronized (TOTP is time-based)
3. Test locally first: `npm run test:integration`

### Tests fail with "File not found" or "Not Found"

**Problem:** Operations fail immediately after create/upload

**Solution:**
- Already fixed in code with 1-second delays
- Internxt API needs small delay for operations to propagate
- If still failing, increase delays in test files

## Status Checklist

- ✅ CI workflow created
- ✅ NPM publish workflow created
- ✅ Integration tests workflow created
- ✅ Package.json configured for publishing
- ✅ Test separation configured (unit vs integration)
- ✅ .npmignore created
- ✅ Documentation updated

**Next Steps:**
1. Add `NPM_TOKEN` secret for publishing
2. Add test credentials secrets for integration tests
3. Create first release to test publishing workflow
