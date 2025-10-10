# Internxt SDK - Complete API Documentation

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [SDK Configuration](#sdk-configuration)
4. [Authentication API](#authentication-api)
5. [Folder API](#folder-api)
6. [File API](#file-api)
7. [Error Handling](#error-handling)
8. [TypeScript Support](#typescript-support)

---

## Installation

```bash
npm install
```

Required dependencies are automatically installed.

---

## Quick Start

```javascript
const InternxtSDK = require('./src/index');

async function main() {
  const sdk = new InternxtSDK();
  
  // Login
  await sdk.login('email@example.com', 'password');
  
  // Use the SDK
  const files = await sdk.list();
  console.log('Files:', files);
  
  // Logout
  await sdk.logout();
}

main();
```

---

## SDK Configuration

### Constructor Options

```javascript
const sdk = new InternxtSDK({
  apiUrl: 'https://gateway.internxt.com/drive',
  networkUrl: 'https://gateway.internxt.com/network',
  appCryptoSecret: '6KYQBP847D4ATSFA',
  clientName: 'my-app',
  clientVersion: '1.0.0'
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | string | From env or internxt default | Internxt Drive API URL |
| `networkUrl` | string | From env or internxt default | Network API URL for uploads/downloads |
| `appCryptoSecret` | string | From env or default secret | Secret for local credential encryption |
| `clientName` | string | `'internxt-sdk'` | Your application name |
| `clientVersion` | string | `'1.0.0'` | Your application version |

### Environment Variables

Create a `.env` file:

```env
DRIVE_NEW_API_URL=https://gateway.internxt.com/drive
NETWORK_URL=https://gateway.internxt.com/network
APP_CRYPTO_SECRET=6KYQBP847D4ATSFA

# Optional: Auto-login
INXT_USER=your-email@example.com
INXT_PASSWORD=your-password
INXT_TWOFACTORCODE=123456
```

---

## Authentication API

### is2FANeeded()

Check if two-factor authentication is enabled for an account.

```javascript
await sdk.is2FANeeded(email: string): Promise<boolean>
```

**Parameters:**
- `email` (string) - User's email address

**Returns:** Promise<boolean> - `true` if 2FA is enabled

**Example:**
```javascript
const needs2FA = await sdk.is2FANeeded('user@example.com');
if (needs2FA) {
  console.log('2FA code required');
}
```

---

### login()

Authenticate with Internxt and save credentials.

```javascript
await sdk.login(
  email: string,
  password: string,
  twoFactorCode?: string
): Promise<LoginResult>
```

**Parameters:**
- `email` (string) - User's email address
- `password` (string) - User's password
- `twoFactorCode` (string, optional) - 2FA code if enabled

**Returns:** Promise<LoginResult>
```javascript
{
  success: boolean,
  user: {
    email: string,
    uuid: string,
    rootFolderId: string
  }
}
```

**Example:**
```javascript
const result = await sdk.login('user@example.com', 'password123');
console.log('Logged in as:', result.user.email);

// With 2FA
const result2FA = await sdk.login('user@example.com', 'password123', '123456');
```

**Errors:**
- Throws error if credentials are invalid
- Throws error if 2FA code is wrong
- Throws error if network request fails

---

### logout()

Logout and clear saved credentials.

```javascript
await sdk.logout(): Promise<{ success: boolean }>
```

**Returns:** Promise<{ success: boolean }>

**Example:**
```javascript
await sdk.logout();
console.log('Logged out successfully');
```

---

### isLoggedIn()

Check if user has valid saved credentials.

```javascript
await sdk.isLoggedIn(): Promise<boolean>
```

**Returns:** Promise<boolean> - `true` if logged in

**Example:**
```javascript
if (await sdk.isLoggedIn()) {
  console.log('Already logged in');
} else {
  await sdk.login(email, password);
}
```

---

### getCredentials()

Load saved credentials without re-authenticating.

```javascript
await sdk.getCredentials(): Promise<Credentials | null>
```

**Returns:** Promise<Credentials | null> - Credentials object or null if not logged in

**Example:**
```javascript
const credentials = await sdk.getCredentials();
if (credentials) {
  console.log('User:', credentials.user.email);
  console.log('Token:', credentials.token);
}
```

---

## Folder API

### list()

List contents of a folder (folders and files).

```javascript
await sdk.list(folderId?: string): Promise<FolderContents>
```

**Parameters:**
- `folderId` (string, optional) - Folder UUID. If null/undefined, lists root folder

**Returns:** Promise<FolderContents>
```javascript
{
  folders: [
    {
      id: string,
      name: string,
      createdAt: string,
      updatedAt: string,
      parentId: string
    }
  ],
  files: [
    {
      id: string,
      name: string,
      type: string,
      size: number,
      createdAt: string,
      updatedAt: string,
      folderId: string
    }
  ]
}
```

**Example:**
```javascript
// List root folder
const root = await sdk.list();
console.log('Folders:', root.folders.length);
console.log('Files:', root.files.length);

// List specific folder
const contents = await sdk.list('folder-uuid-here');
contents.files.forEach(file => {
  console.log(`${file.name} - ${file.size} bytes`);
});
```

---

### createFolder()

Create a new folder.

```javascript
await sdk.createFolder(
  folderName: string,
  parentFolderId?: string
): Promise<Folder>
```

**Parameters:**
- `folderName` (string) - Name of the new folder
- `parentFolderId` (string, optional) - Parent folder UUID. If null, creates in root

**Returns:** Promise<Folder>
```javascript
{
  id: string,
  name: string,
  createdAt: string,
  updatedAt: string,
  parentId: string
}
```

**Example:**
```javascript
// Create in root
const folder = await sdk.createFolder('My Documents');
console.log('Created folder:', folder.id);

// Create subfolder
const subfolder = await sdk.createFolder('Photos', folder.id);
console.log('Created subfolder:', subfolder.name);
```

---

### getFolderMetadata()

Get metadata for a specific folder.

```javascript
await sdk.getFolderMetadata(folderId: string): Promise<Folder>
```

**Parameters:**
- `folderId` (string) - Folder UUID

**Returns:** Promise<Folder>

**Example:**
```javascript
const folder = await sdk.getFolderMetadata('folder-uuid');
console.log('Folder name:', folder.name);
console.log('Created:', folder.createdAt);
```

---

### renameFolder()

Rename a folder.

```javascript
await sdk.renameFolder(
  folderId: string,
  newName: string
): Promise<{ success: boolean, id: string, name: string }>
```

**Parameters:**
- `folderId` (string) - Folder UUID
- `newName` (string) - New folder name

**Returns:** Promise<{ success, id, name }>

**Example:**
```javascript
await sdk.renameFolder('folder-uuid', 'Renamed Folder');
console.log('Folder renamed successfully');
```

---

### moveFolder()

Move a folder to another location.

```javascript
await sdk.moveFolder(
  folderId: string,
  destinationFolderId: string
): Promise<{ success: boolean, id: string, newParentId: string }>
```

**Parameters:**
- `folderId` (string) - Folder UUID to move
- `destinationFolderId` (string) - Destination parent folder UUID

**Returns:** Promise<{ success, id, newParentId }>

**Example:**
```javascript
await sdk.moveFolder('folder-uuid', 'destination-folder-uuid');
console.log('Folder moved successfully');
```

---

## File API

### uploadFile()

Upload a file to Internxt Drive.

```javascript
await sdk.uploadFile(
  filePath: string,
  destinationFolderId?: string,
  onProgress?: (progress: number) => void
): Promise<File>
```

**Parameters:**
- `filePath` (string) - Local file path to upload
- `destinationFolderId` (string, optional) - Destination folder UUID. If null, uploads to root
- `onProgress` (function, optional) - Callback for progress updates (0.0 to 1.0)

**Returns:** Promise<File>
```javascript
{
  id: string,
  name: string,
  type: string,
  size: number,
  createdAt: string,
  folderId: string
}
```

**Example:**
```javascript
// Simple upload to root
const file = await sdk.uploadFile('./document.pdf');
console.log('Uploaded:', file.name);

// Upload to specific folder
const file2 = await sdk.uploadFile('./photo.jpg', 'folder-uuid');

// Upload with progress
const file3 = await sdk.uploadFile('./video.mp4', null, (progress) => {
  console.log(`Progress: ${Math.round(progress * 100)}%`);
});
```

**Errors:**
- Throws error if file doesn't exist
- Throws error if file is empty
- Throws error if upload fails

---

### downloadFile()

Download a file from Internxt Drive.

```javascript
await sdk.downloadFile(
  fileId: string,
  destinationPath: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string, name: string, size: number }>
```

**Parameters:**
- `fileId` (string) - File UUID to download
- `destinationPath` (string) - Local directory path to save file
- `onProgress` (function, optional) - Callback for progress updates (0.0 to 1.0)

**Returns:** Promise<{ path, name, size }>

**Example:**
```javascript
// Simple download
await sdk.downloadFile('file-uuid', './downloads');

// Download with progress
await sdk.downloadFile('file-uuid', './downloads', (progress) => {
  const percent = Math.round(progress * 100);
  process.stdout.write(`\rDownloading: ${percent}%`);
});
```

**Errors:**
- Throws error if file not found
- Throws error if destination directory doesn't exist
- Throws error if file already exists at destination

---

### getFileMetadata()

Get metadata for a specific file.

```javascript
await sdk.getFileMetadata(fileId: string): Promise<FileMetadata>
```

**Parameters:**
- `fileId` (string) - File UUID

**Returns:** Promise<FileMetadata>
```javascript
{
  id: string,
  name: string,
  type: string,
  size: number,
  createdAt: string,
  updatedAt: string,
  folderId: string
}
```

**Example:**
```javascript
const file = await sdk.getFileMetadata('file-uuid');
console.log('File:', file.name);
console.log('Size:', file.size, 'bytes');
console.log('Type:', file.type);
```

---

### renameFile()

Rename a file.

```javascript
await sdk.renameFile(
  fileId: string,
  newName: string
): Promise<{ success: boolean, id: string, name: string }>
```

**Parameters:**
- `fileId` (string) - File UUID
- `newName` (string) - New file name (without extension)

**Returns:** Promise<{ success, id, name }>

**Example:**
```javascript
await sdk.renameFile('file-uuid', 'new-filename');
console.log('File renamed successfully');
```

---

### moveFile()

Move a file to another folder.

```javascript
await sdk.moveFile(
  fileId: string,
  destinationFolderId: string
): Promise<{ success: boolean, id: string, newFolderId: string }>
```

**Parameters:**
- `fileId` (string) - File UUID to move
- `destinationFolderId` (string) - Destination folder UUID

**Returns:** Promise<{ success, id, newFolderId }>

**Example:**
```javascript
await sdk.moveFile('file-uuid', 'destination-folder-uuid');
console.log('File moved successfully');
```

---

## Error Handling

All SDK methods return Promises and can throw errors. Use try-catch:

```javascript
try {
  await sdk.uploadFile('./file.txt');
} catch (error) {
  console.error('Error:', error.message);
  
  // Check error type
  if (error.message.includes('not authenticated')) {
    await sdk.login(email, password);
  } else if (error.message.includes('already exists')) {
    console.error('File already exists');
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Not authenticated" | No saved credentials | Call `sdk.login()` first |
| "File already exists" | Downloading to existing file | Delete or rename existing file |
| "File not found" | Invalid file ID | Check file ID with `sdk.list()` |
| "Login failed" | Wrong credentials | Verify email/password |
| "Cannot upload empty file" | File has 0 bytes | Check file content |

---

## TypeScript Support

While this SDK is written in JavaScript, you can create type definitions:

```typescript
// types.d.ts
declare module '@internxt/sdk-wrapper' {
  interface LoginResult {
    success: boolean;
    user: {
      email: string;
      uuid: string;
      rootFolderId: string;
    };
  }
  
  interface Folder {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    parentId: string;
  }
  
  interface File {
    id: string;
    name: string;
    type: string;
    size: number;
    createdAt: string;
    updatedAt: string;
    folderId: string;
  }
  
  interface FolderContents {
    folders: Folder[];
    files: File[];
  }
  
  class InternxtSDK {
    constructor(options?: {
      apiUrl?: string;
      networkUrl?: string;
      appCryptoSecret?: string;
      clientName?: string;
      clientVersion?: string;
    });
    
    is2FANeeded(email: string): Promise<boolean>;
    login(email: string, password: string, twoFactorCode?: string): Promise<LoginResult>;
    logout(): Promise<{ success: boolean }>;
    isLoggedIn(): Promise<boolean>;
    getCredentials(): Promise<any>;
    
    list(folderId?: string): Promise<FolderContents>;
    createFolder(name: string, parentId?: string): Promise<Folder>;
    getFolderMetadata(folderId: string): Promise<Folder>;
    renameFolder(folderId: string, newName: string): Promise<{ success: boolean; id: string; name: string }>;
    moveFolder(folderId: string, destinationId: string): Promise<{ success: boolean; id: string; newParentId: string }>;
    
    uploadFile(filePath: string, destinationFolderId?: string, onProgress?: (progress: number) => void): Promise<File>;
    downloadFile(fileId: string, destinationPath: string, onProgress?: (progress: number) => void): Promise<{ path: string; name: string; size: number }>;
    getFileMetadata(fileId: string): Promise<File>;
    renameFile(fileId: string, newName: string): Promise<{ success: boolean; id: string; name: string }>;
    moveFile(fileId: string, destinationFolderId: string): Promise<{ success: boolean; id: string; newFolderId: string }>;
  }
  
  export = InternxtSDK;
}
```

---

## Advanced Usage Examples

### Batch Upload

```javascript
const files = ['file1.txt', 'file2.txt', 'file3.txt'];

for (const file of files) {
  try {
    const result = await sdk.uploadFile(file, folderId);
    console.log('✅ Uploaded:', result.name);
  } catch (error) {
    console.error('❌ Failed:', file, error.message);
  }
}
```

### Recursive Folder Listing

```javascript
async function listRecursive(folderId = null, indent = 0) {
  const contents = await sdk.list(folderId);
  
  for (const folder of contents.folders) {
    console.log('  '.repeat(indent) + '📁 ' + folder.name);
    await listRecursive(folder.id, indent + 1);
  }
  
  for (const file of contents.files) {
    console.log('  '.repeat(indent) + '📄 ' + file.name);
  }
}

await listRecursive();
```

### Progress Bar

```javascript
function createProgressBar() {
  let lastPercent = 0;
  return (progress) => {
    const percent = Math.round(progress * 100);
    if (percent !== lastPercent) {
      const bar = '█'.repeat(percent / 2) + '░'.repeat(50 - percent / 2);
      process.stdout.write(`\r[${bar}] ${percent}%`);
      lastPercent = percent;
    }
  };
}

await sdk.uploadFile('./file.zip', null, createProgressBar());
console.log('\n✅ Upload complete');
```

---

## Support & Resources

- **GitHub**: [internxt/cli](https://github.com/internxt/cli)
- **SDK**: [internxt/sdk](https://github.com/internxt/sdk)
- **Website**: [internxt.com](https://internxt.com)

---

## License

MIT
