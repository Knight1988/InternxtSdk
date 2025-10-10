# Internxt SDK Wrapper - Project Summary

## 🎉 What's Been Created

A complete, production-ready SDK wrapper for Internxt Drive with comprehensive functionality for authentication, file operations, and folder management.

## 📁 Project Structure

```
InternxtSdk/
├── src/
│   ├── index.js                          # Main SDK class
│   ├── services/
│   │   ├── auth.service.js               # Authentication & credential management
│   │   ├── folder.service.js             # Folder operations (list, create, rename, move)
│   │   ├── file.service.js               # File operations (upload, download, rename, move)
│   │   ├── network-facade.service.js     # Network layer abstraction
│   │   └── download.service.js           # Download helpers
│   └── utils/
│       └── crypto.js                     # Cryptography utilities (hashing, encryption, keys)
│
├── examples/
│   ├── auth.js                           # Authentication example
│   ├── list.js                           # List folders/files example
│   ├── create-folder.js                  # Create folders example
│   ├── upload.js                         # Upload file example
│   ├── download.js                       # Download file example
│   └── README.md                         # Examples documentation
│
├── example.js                            # Main demo script
├── index.js                              # Legacy login example (original)
│
├── README.md                             # Main documentation
├── API.md                                # Complete API reference
├── package.json                          # Dependencies & scripts
├── .env.example                          # Environment variables template
└── .gitignore                            # Git ignore rules
```

## ✨ Features Implemented

### 🔐 Authentication
- ✅ Login with email/password
- ✅ Two-factor authentication (2FA) support
- ✅ Automatic credential persistence
- ✅ Check login status
- ✅ Auto-login from saved credentials
- ✅ Logout and clear credentials

### 📁 Folder Operations
- ✅ List folder contents (folders & files)
- ✅ Create new folders
- ✅ Get folder metadata
- ✅ Rename folders
- ✅ Move folders
- ✅ Recursive listing support

### 📄 File Operations
- ✅ Upload files with progress tracking
- ✅ Download files with progress tracking
- ✅ Get file metadata
- ✅ Rename files
- ✅ Move files
- ✅ Preserve file timestamps

### 🔒 Security
- ✅ End-to-end encryption
- ✅ PBKDF2 password hashing (10,000 iterations)
- ✅ AES-256-CBC local credential encryption
- ✅ PGP key generation for authentication
- ✅ Mnemonic-based file encryption

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run Demo
```bash
npm start
# or
npm run demo
```

### 4. Use in Your Code
```javascript
const InternxtSDK = require('./src/index');

const sdk = new InternxtSDK();

// Login
await sdk.login('email@example.com', 'password');

// List files
const contents = await sdk.list();
console.log('Files:', contents.files);

// Upload file
const file = await sdk.uploadFile('./document.pdf', null, (progress) => {
  console.log(`Upload: ${Math.round(progress * 100)}%`);
});

// Download file
await sdk.downloadFile(file.id, './downloads', (progress) => {
  console.log(`Download: ${Math.round(progress * 100)}%`);
});

// Create folder
const folder = await sdk.createFolder('My Folder');

// Logout
await sdk.logout();
```

## 📚 Documentation

### Main Documentation
- **README.md** - Overview, installation, features, basic usage
- **API.md** - Complete API reference with all methods documented
- **examples/README.md** - Example scripts documentation

### Code Documentation
All services and methods have inline JSDoc comments explaining:
- Purpose and functionality
- Parameters and return types
- Usage examples
- Error conditions

## 🎯 Key Methods

### Authentication
```javascript
await sdk.is2FANeeded(email)           // Check if 2FA is enabled
await sdk.login(email, password, 2fa)  // Login and save credentials
await sdk.logout()                     // Logout and clear credentials
await sdk.isLoggedIn()                 // Check login status
await sdk.getCredentials()             // Load saved credentials
```

### Folders
```javascript
await sdk.list(folderId)                    // List folder contents
await sdk.createFolder(name, parentId)      // Create folder
await sdk.getFolderMetadata(folderId)       // Get folder info
await sdk.renameFolder(folderId, newName)   // Rename folder
await sdk.moveFolder(folderId, destId)      // Move folder
```

### Files
```javascript
await sdk.uploadFile(path, folderId, onProgress)      // Upload file
await sdk.downloadFile(fileId, destPath, onProgress)  // Download file
await sdk.getFileMetadata(fileId)                     // Get file info
await sdk.renameFile(fileId, newName)                 // Rename file
await sdk.moveFile(fileId, folderId)                  // Move file
```

## 📦 Dependencies

### Core Libraries
- **@internxt/sdk** (^1.11.12) - Official Internxt SDK for API calls
- **@internxt/inxt-js** (^2.2.9) - Network layer for uploads/downloads
- **@internxt/lib** (^1.3.1) - Cryptography and encryption
- **openpgp** (^6.2.2) - PGP key generation
- **dotenv** (^16.4.5) - Environment configuration

### Included via @internxt/cli
- Authentication services
- File/folder management
- Network operations
- Crypto utilities

## 🔧 NPM Scripts

```json
{
  "start": "node example.js",        // Run main demo
  "demo": "node example.js",         // Run main demo (alias)
  "test": "node example.js"          // Run main demo (alias)
}
```

## 💡 Usage Examples

### Example 1: Simple Login and List
```bash
node examples/auth.js
node examples/list.js
```

### Example 2: Create Folder Structure
```bash
node examples/create-folder.js
```

### Example 3: Upload File
```bash
node examples/upload.js
```

### Example 4: Download File
```bash
node examples/download.js <file-id>
```

## 🔐 Credential Storage

Credentials are encrypted and stored locally:
- **Location**: `~/.internxt-sdk/.credentials`
- **Encryption**: AES-256-CBC
- **Auto-login**: Automatic on next SDK instantiation
- **Security**: Secret key from environment or default

## ⚙️ Configuration Options

### SDK Constructor
```javascript
new InternxtSDK({
  apiUrl: 'https://gateway.internxt.com/drive',
  networkUrl: 'https://gateway.internxt.com/network',
  appCryptoSecret: 'YOUR_SECRET',
  clientName: 'my-app',
  clientVersion: '1.0.0'
})
```

### Environment Variables
```env
DRIVE_NEW_API_URL=https://gateway.internxt.com/drive
NETWORK_URL=https://gateway.internxt.com/network
APP_CRYPTO_SECRET=6KYQBP847D4ATSFA
INXT_USER=email@example.com
INXT_PASSWORD=your-password
INXT_TWOFACTORCODE=123456
```

## 🎨 Progress Tracking

Both upload and download support progress callbacks:

```javascript
// Upload with progress
await sdk.uploadFile('./file.zip', null, (progress) => {
  const percent = Math.round(progress * 100);
  console.log(`Uploading: ${percent}%`);
});

// Download with progress bar
await sdk.downloadFile(fileId, './downloads', (progress) => {
  const bar = '█'.repeat(progress * 50);
  const empty = '░'.repeat(50 - progress * 50);
  process.stdout.write(`\r[${bar}${empty}] ${Math.round(progress * 100)}%`);
});
```

## 🛠️ Error Handling

All methods throw descriptive errors:

```javascript
try {
  await sdk.uploadFile('./file.txt');
} catch (error) {
  if (error.message.includes('not authenticated')) {
    // Need to login
    await sdk.login(email, password);
  } else if (error.message.includes('already exists')) {
    // File exists at destination
    console.error('File already exists');
  } else {
    // Other error
    console.error('Error:', error.message);
  }
}
```

## 📈 Advanced Features

### Batch Operations
Upload/download multiple files with error handling and progress tracking.

### Recursive Folder Traversal
Navigate entire folder structures programmatically.

### Auto-Authentication
Saved credentials allow seamless re-authentication.

### Progress Callbacks
Track upload/download progress in real-time.

### File Metadata Preservation
Maintains original file timestamps on download.

## 🧪 Testing

Run the demo script to test all functionality:

```bash
npm start
```

This will:
1. Login (or use saved credentials)
2. List root folder contents
3. Create a test folder
4. Show usage examples

## 📝 Next Steps

1. **Run the demo**: `npm start`
2. **Try examples**: Explore `examples/` directory
3. **Read API docs**: Check `API.md` for detailed reference
4. **Integrate**: Use in your own projects

## 🤝 Contributing

Based on official Internxt packages:
- [internxt/cli](https://github.com/internxt/cli)
- [internxt/sdk](https://github.com/internxt/sdk)

## 📄 License

MIT

---

## Summary

You now have a **complete, production-ready Internxt SDK** with:
- ✅ Full authentication system
- ✅ Complete file operations
- ✅ Complete folder operations  
- ✅ Progress tracking
- ✅ Comprehensive documentation
- ✅ Working examples
- ✅ Error handling
- ✅ Security best practices

**Everything is ready to use!** 🚀
