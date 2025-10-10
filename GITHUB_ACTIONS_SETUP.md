# GitHub Actions CI/CD Setup Summary

## Files Created

### 1. `.github/workflows/npm-publish.yml`
**Purpose:** Automatically publish package to NPM when a release is created

**Triggers:**
- On GitHub release creation
- Manual workflow dispatch

**Jobs:**
- **build-and-test**: Tests on Node.js 18.x and 20.x, runs build and unit tests
- **publish-npm**: Publishes to NPM with provenance (requires `NPM_TOKEN` secret)

**Key Features:**
- Uses npm provenance for supply chain security
- Publishes as public package
- Only runs tests (not integration tests that require credentials)

### 2. `.github/workflows/ci.yml`
**Purpose:** Run automated tests on pull requests and pushes

**Triggers:**
- Push to main or develop branches
- Pull requests to main or develop branches

**Jobs:**
- **test**: Runs on Node.js 18.x, 20.x, and 22.x matrix
  - Installs dependencies
  - Builds the project
  - Runs unit tests
  - Checks TypeScript types

- **lint**: Placeholder for future linting/formatting checks

### 3. `.npmignore`
**Purpose:** Exclude development files from published package

**Excluded:**
- Source TypeScript files (except .d.ts)
- Test files and fixtures
- Configuration files (.env, tsconfig, mocha config)
- IDE and Git files
- Documentation (except README.md)

### 4. `.mocharc.unit.json`
**Purpose:** Separate mocha configuration for unit tests only

**Configuration:**
- Only runs tests in `test/unit/**/*.test.ts`
- Uses ts-node for TypeScript support
- 30 second timeout
- Colored output

## Package.json Updates

### Name Change
```json
"name": "@knight1988/internxt-sdk"
```
Now uses scoped package name for NPM publishing.

### New Fields Added
```json
"files": ["dist", "README.md", "LICENSE"],
"repository": {
  "type": "git",
  "url": "git+https://github.com/Knight1988/InternxtSdk.git"
},
"bugs": {
  "url": "https://github.com/Knight1988/InternxtSdk/issues"
},
"homepage": "https://github.com/Knight1988/InternxtSdk#readme"
```

### Updated Scripts
```json
"test:unit": "mocha --config .mocharc.unit.json"
```
Now uses separate config to only run unit tests (28 tests, ~600ms).

## How to Publish to NPM

### Setup (One-time)
1. Create NPM account at https://www.npmjs.com
2. Generate NPM token (Classic Token with Automation type):
   - Go to npmjs.com → Account → Access Tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type
   - Copy the token
3. Add token to GitHub Secrets:
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: (paste your NPM token)

### Publishing Process

#### Option 1: Automatic (Recommended)
```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Commit and push
git add package.json package-lock.json
git commit -m "chore: bump version to x.x.x"
git push origin main

# 3. Create GitHub release
gh release create v0.1.0 --title "Release v0.1.0" --notes "Initial release"
# Or create release via GitHub web UI
```

The workflow will automatically:
- ✅ Run tests on multiple Node versions
- ✅ Build the package
- ✅ Publish to NPM with provenance

#### Option 2: Manual Trigger
1. Go to GitHub → Actions → "Publish to NPM"
2. Click "Run workflow"
3. Select branch and click "Run workflow"

#### Option 3: Local Publishing
```bash
npm run build
npm publish
```

## CI Workflow

The CI workflow runs automatically on:
- Every push to main or develop
- Every pull request to main or develop

It will:
- ✅ Test on Node.js 18.x, 20.x, and 22.x
- ✅ Run `npm ci` to ensure clean install
- ✅ Run `npm run build` to compile TypeScript
- ✅ Run `npm run test:unit` to execute tests
- ✅ Run `npx tsc --noEmit` to check types

## Test Separation

### Unit Tests Only (for CI)
```bash
npm run test:unit
# Runs 28 tests in ~600ms
# No credentials required
```

### All Tests (local development)
```bash
npm test
# Runs 59 tests in ~50s
# Requires .env.test.local with credentials
```

### Integration Tests Only
```bash
npm run test:integration
# Runs 31 integration tests
# Requires .env.test.local with credentials
```

## What Gets Published

The NPM package will contain:
- ✅ `dist/` - Compiled JavaScript and TypeScript definitions
- ✅ `README.md` - Documentation
- ✅ `LICENSE` - License file
- ✅ `package.json` - Package metadata

It will NOT contain:
- ❌ `src/` - Source TypeScript files
- ❌ `test/` - Test files
- ❌ `.env*` - Environment files
- ❌ `tsconfig.json` - TypeScript config
- ❌ `.github/` - GitHub workflows
- ❌ Development documentation

## Package Installation (After Publishing)

Users can install your package with:
```bash
npm install @knight1988/internxt-sdk
```

## Status Check

✅ GitHub Actions workflows created
✅ NPM publish workflow configured
✅ CI workflow configured
✅ Package.json updated for publishing
✅ Test separation configured
✅ .npmignore created
✅ Documentation updated

**Next Step:** Add `NPM_TOKEN` secret to GitHub repository settings to enable automatic publishing.
