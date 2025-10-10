# Internxt SDK Wrapper

A comprehensive Node.js SDK wrapper for Internxt Drive that provides easy-to-use methods for authentication, file operations, and folder management. Built on top of `@internxt/sdk` and `@internxt/cli`.

**Now with full TypeScript support!** 🎉

## Features

✅ **Authentication**
- Login with email and password
- Two-factor authentication (2FA) support
- Automatic credential persistence
- Session management

✅ **Folder Operations**
- List folder contents
- Create new folders
- Rename folders
- Move folders
- Get folder metadata

✅ **File Operations**
- Upload files with progress tracking
- Download files with progress tracking
- Get file metadata
- Rename files
- Move files

✅ **Security**
- End-to-end encryption
- Secure password hashing (PBKDF2)
- AES-256-CBC encryption for local credentials
- Mnemonic-based file encryption

## Installation

```bash
npm install
npm run build  # Compile TypeScript
```

## Quick Start

### JavaScript
```javascript
const InternxtSDK = require('./dist/index').default;

async function main() {
  const sdk = new InternxtSDK();
  
  // Login
  await sdk.login('your-email@example.com', 'your-password');
  
  // List root folder
  const contents = await sdk.list();
  console.log('Folders:', contents.folders);
  console.log('Files:', contents.files);
  
  // Create a folder
  const folder = await sdk.createFolder('My New Folder');
  console.log('Created:', folder.name);
  
  // Upload a file
  const file = await sdk.uploadFile('./document.pdf', null, (progress) => {
    console.log(`Upload: ${Math.round(progress * 100)}%`);
  });
  console.log('Uploaded:', file.name);
  
  // Download a file
  await sdk.downloadFile(file.id, './downloads', (progress) => {
    console.log(`Download: ${Math.round(progress * 100)}%`);
  });
  
  // Logout
  await sdk.logout();
}

main();
```

### TypeScript
```typescript
import InternxtSDK from './dist/index';
import { LoginResult, FolderContents } from './dist/types';

async function main() {
  const sdk = new InternxtSDK({
    clientName: 'my-app',
    clientVersion: '1.0.0'
  });
  
  const result: LoginResult = await sdk.login(email, password);
  const contents: FolderContents = await sdk.list();
}

main();
```

See [TYPESCRIPT.md](./TYPESCRIPT.md) for full TypeScript documentation.

## API Reference

### Constructor

```javascript
const sdk = new InternxtSDK(options);
```

**Options:**
- `apiUrl` - Internxt API URL (default: from env or 'https://gateway.internxt.com/drive')
- `networkUrl` - Network URL (default: from env or 'https://gateway.internxt.com/network')
- `appCryptoSecret` - Encryption secret (default: from env)
- `clientName` - App name (default: 'internxt-sdk')
- `clientVersion` - App version (default: '1.0.0')

### Authentication

#### `await sdk.is2FANeeded(email)`
Check if 2FA is enabled for an account.

```javascript
const needs2FA = await sdk.is2FANeeded('user@example.com');
```

#### `await sdk.login(email, password, twoFactorCode)`
Login to Internxt.

```javascript
const result = await sdk.login('user@example.com', 'password', '123456');
console.log(result.user);
```

#### `await sdk.logout()`
Logout and clear saved credentials.

```javascript
await sdk.logout();
```

#### `await sdk.isLoggedIn()`
Check if user is logged in.

```javascript
const loggedIn = await sdk.isLoggedIn();
```

#### `await sdk.getCredentials()`
Get saved credentials (auto-login).

```javascript
const credentials = await sdk.getCredentials();
```

### Folder Operations

#### `await sdk.list(folderId)`
List contents of a folder. Pass `null` for root folder.

```javascript
const contents = await sdk.list(); // root folder
const contents = await sdk.list('folder-uuid'); // specific folder
```

Returns:
```javascript
{
  folders: [
    { id, name, createdAt, updatedAt, parentId }
  ],
  files: [
    { id, name, type, size, createdAt, updatedAt, folderId }
  ]
}
```

#### `await sdk.createFolder(name, parentFolderId)`
Create a new folder.

```javascript
const folder = await sdk.createFolder('My Folder');
const subfolder = await sdk.createFolder('Subfolder', parentFolderId);
```

#### `await sdk.getFolderMetadata(folderId)`
Get folder metadata.

```javascript
const folder = await sdk.getFolderMetadata('folder-uuid');
```

#### `await sdk.renameFolder(folderId, newName)`
Rename a folder.

```javascript
await sdk.renameFolder('folder-uuid', 'New Name');
```

#### `await sdk.moveFolder(folderId, destinationFolderId)`
Move a folder to another location.

```javascript
await sdk.moveFolder('folder-uuid', 'destination-folder-uuid');
```

### File Operations

#### `await sdk.uploadFile(filePath, destinationFolderId, onProgress)`
Upload a file.

```javascript
// Upload to root
const file = await sdk.uploadFile('./document.pdf');

// Upload to specific folder with progress
const file = await sdk.uploadFile('./photo.jpg', 'folder-uuid', (progress) => {
  console.log(`${Math.round(progress * 100)}%`);
});
```

#### `await sdk.downloadFile(fileId, destinationPath, onProgress)`
Download a file.

```javascript
// Download file
await sdk.downloadFile('file-uuid', './downloads');

// With progress tracking
await sdk.downloadFile('file-uuid', './downloads', (progress) => {
  console.log(`${Math.round(progress * 100)}%`);
});
```

#### `await sdk.getFileMetadata(fileId)`
Get file metadata.

```javascript
const file = await sdk.getFileMetadata('file-uuid');
console.log(file.name, file.size);
```

#### `await sdk.renameFile(fileId, newName)`
Rename a file.

```javascript
await sdk.renameFile('file-uuid', 'new-filename');
```

#### `await sdk.moveFile(fileId, destinationFolderId)`
Move a file to another folder.

```javascript
await sdk.moveFile('file-uuid', 'destination-folder-uuid');
```

## Configuration

Create a `.env` file:

```env
# Internxt API Configuration
DRIVE_NEW_API_URL=https://gateway.internxt.com/drive
NETWORK_URL=https://gateway.internxt.com/network
APP_CRYPTO_SECRET=6KYQBP847D4ATSFA

# Optional: Auto-login credentials
INXT_USER=your-email@example.com
INXT_PASSWORD=your-password
INXT_TWOFACTORCODE=123456
```

## Running the Demo

```bash
npm start
# or
npm run demo
```

The demo will:
1. Login to your account (or use saved credentials)
2. List your root folder contents
3. Create a test folder
4. Show example usage

## Project Structure

```
src/
├── index.js                  # Main SDK class
├── services/
│   ├── auth.service.js       # Authentication service
│   ├── folder.service.js     # Folder operations
│   ├── file.service.js       # File operations
│   ├── network-facade.service.js  # Network layer
│   └── download.service.js   # Download helpers
└── utils/
    └── crypto.js             # Cryptography utilities

example.js                    # Demo/example usage
index.js                      # Legacy login example
```

## How It Works

This SDK is built on top of official Internxt packages:

1. **@internxt/sdk** - Core API client for Drive operations
2. **@internxt/inxt-js** - Network layer for file upload/download
3. **@internxt/lib** - Cryptography and encryption utilities
4. **openpgp** - PGP key generation for secure authentication

### Security

- **Password Hashing**: PBKDF2 with 10,000 iterations using SHA-1
- **Local Encryption**: AES-256-CBC for storing credentials
- **File Encryption**: End-to-end encryption using mnemonic-based keys
- **Transport Security**: All API calls use HTTPS

### Credential Storage

Credentials are encrypted and stored in `~/.internxt-sdk/.credentials`. This allows automatic re-authentication without requiring login each time.

## Advanced Usage

### Custom Progress Tracking

```javascript
let lastProgress = 0;
await sdk.uploadFile('./large-file.zip', null, (progress) => {
  const percent = Math.round(progress * 100);
  if (percent !== lastProgress) {
    console.log(`Uploading: ${percent}%`);
    lastProgress = percent;
  }
});
```

### Error Handling

```javascript
try {
  await sdk.uploadFile('./file.txt');
} catch (error) {
  if (error.message.includes('already exists')) {
    console.error('File already exists');
  } else {
    console.error('Upload failed:', error.message);
  }
}
```

### Batch Operations

```javascript
// Upload multiple files
const files = ['file1.txt', 'file2.txt', 'file3.txt'];
for (const file of files) {
  const result = await sdk.uploadFile(file, folderId);
  console.log('Uploaded:', result.name);
}

// Download all files in a folder
const contents = await sdk.list(folderId);
for (const file of contents.files) {
  await sdk.downloadFile(file.id, './downloads');
  console.log('Downloaded:', file.name);
}
```

## Troubleshooting

**Q: "Not authenticated" error**  
A: Make sure to call `await sdk.login()` or `await sdk.getCredentials()` before using other methods.

**Q: Upload/download progress not working**  
A: Pass a callback function as the third parameter to track progress.

**Q: File already exists error**  
A: The SDK prevents overwriting existing files during download. Delete or rename the existing file first.

## Dependencies

- `@internxt/sdk` - Official Internxt SDK
- `@internxt/inxt-js` - Network layer for file operations
- `@internxt/lib` - Cryptography utilities
- `openpgp` - PGP encryption
- `dotenv` - Environment configuration

## Publishing to NPM

### Prerequisites

#### Required for Publishing:
1. **NPM_TOKEN**: Set up NPM token in GitHub Secrets
   - Go to npmjs.com → Account → Access Tokens
   - Generate "Classic Token" with "Automation" type
   - Add to GitHub: Repo Settings → Secrets → Actions → `NPM_TOKEN`

#### Optional for Integration Tests in CI:
2. **INTERNXT_TEST_EMAIL**: Test account email
3. **INTERNXT_TEST_PASSWORD**: Test account password
4. **INTERNXT_TEST_2FA_SECRET**: TOTP secret key (not the 6-digit code)
5. **DESKTOP_HEADER**: Token for privileged operations (has default value)

See [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) for detailed setup instructions.

### Automatic Publishing
The package is automatically published to NPM when you create a GitHub release:

```bash
# Update version in package.json first
npm version patch  # or minor, or major

# Commit and push
git add package.json package-lock.json
git commit -m "chore: bump version to x.x.x"
git push origin main
git push --tags

# Create a GitHub release (via GitHub UI or CLI)
gh release create v0.1.0 --title "Release v0.1.0" --notes "Release notes here"
```

The GitHub Action will:
1. Run tests on Node.js 18.x and 20.x
2. Build the package
3. Publish to NPM with provenance

### Manual Publishing
You can also trigger the workflow manually from the GitHub Actions tab, or publish directly:

```bash
npm run build
npm publish
```

## Continuous Integration

The project includes two GitHub Actions workflows:

### CI Workflow (`ci.yml`)
- Runs on push/PR to main and develop branches
- Tests on Node.js 18.x, 20.x, and 22.x
- Runs build and unit tests
- Performs TypeScript type checking

### NPM Publish Workflow (`npm-publish.yml`)
- Triggers on release creation or manual dispatch
- Runs full test suite
- Publishes to NPM registry

## License

MIT

## Credits

Built with code patterns from:
- [@internxt/cli](https://github.com/internxt/cli) - Official Internxt CLI
- [@internxt/sdk](https://github.com/internxt/sdk) - Official Internxt SDK

## Support

- [Internxt Website](https://internxt.com)
- [Internxt GitHub](https://github.com/internxt)
- [Internxt CLI Repository](https://github.com/internxt/cli)

