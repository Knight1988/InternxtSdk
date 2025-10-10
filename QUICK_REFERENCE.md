# Internxt SDK - Quick Reference Card

## 🚀 Installation & Setup

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm start  # Run demo
```

## 📖 Basic Usage

```javascript
const InternxtSDK = require('./src/index');
const sdk = new InternxtSDK();
```

## 🔐 Authentication (3 methods)

| Method | Code | Description |
|--------|------|-------------|
| **Login** | `await sdk.login(email, password, 2fa)` | Login and save credentials |
| **Check Status** | `await sdk.isLoggedIn()` | Check if already logged in |
| **Auto-Login** | `await sdk.getCredentials()` | Load saved credentials |
| **Logout** | `await sdk.logout()` | Clear credentials |
| **Check 2FA** | `await sdk.is2FANeeded(email)` | Check if 2FA required |

## 📁 Folder Operations (5 methods)

| Method | Code | Description |
|--------|------|-------------|
| **List** | `await sdk.list(folderId)` | List folders & files |
| **Create** | `await sdk.createFolder(name, parentId)` | Create new folder |
| **Get Info** | `await sdk.getFolderMetadata(folderId)` | Get folder details |
| **Rename** | `await sdk.renameFolder(folderId, newName)` | Rename folder |
| **Move** | `await sdk.moveFolder(folderId, destId)` | Move folder |

## 📄 File Operations (5 methods)

| Method | Code | Description |
|--------|------|-------------|
| **Upload** | `await sdk.uploadFile(path, folderId, onProgress)` | Upload file |
| **Download** | `await sdk.downloadFile(fileId, destPath, onProgress)` | Download file |
| **Get Info** | `await sdk.getFileMetadata(fileId)` | Get file details |
| **Rename** | `await sdk.renameFile(fileId, newName)` | Rename file |
| **Move** | `await sdk.moveFile(fileId, folderId)` | Move file |

## 💡 Common Patterns

### Pattern 1: Login Once, Use Forever
```javascript
// First time
await sdk.login(email, password);

// Next time (auto-login)
await sdk.getCredentials();
const files = await sdk.list();
```

### Pattern 2: Upload with Progress
```javascript
await sdk.uploadFile('./file.zip', null, (progress) => {
  console.log(`${Math.round(progress * 100)}%`);
});
```

### Pattern 3: List Root Folder
```javascript
const { folders, files } = await sdk.list();
console.log(`${folders.length} folders, ${files.length} files`);
```

### Pattern 4: Create Folder Structure
```javascript
const parent = await sdk.createFolder('Projects');
const sub = await sdk.createFolder('Photos', parent.id);
```

### Pattern 5: Batch Upload
```javascript
for (const file of ['a.txt', 'b.txt']) {
  await sdk.uploadFile(file, folderId);
}
```

## 📊 Return Types

### List Result
```javascript
{
  folders: [{ id, name, createdAt, updatedAt, parentId }],
  files: [{ id, name, type, size, createdAt, updatedAt, folderId }]
}
```

### Upload/File Result
```javascript
{ id, name, type, size, createdAt, folderId }
```

### Folder Result
```javascript
{ id, name, createdAt, updatedAt, parentId }
```

## ⚠️ Important Notes

1. **Always authenticate first**: Call `login()` or `getCredentials()` before other operations
2. **Progress is 0.0 to 1.0**: Multiply by 100 for percentage
3. **Null folder ID = root**: Use `null` or omit for root folder operations
4. **Files include extension**: Name returned includes `.ext` 
5. **Downloads preserve timestamps**: Original file times maintained

## 🎯 Examples

Run individual examples:
```bash
node examples/auth.js           # Authentication
node examples/list.js           # List contents
node examples/create-folder.js  # Create folders
node examples/upload.js         # Upload file
node examples/download.js       # Download file
```

## 🔗 Documentation Files

- **README.md** - Overview and getting started
- **API.md** - Complete API reference
- **PROJECT_SUMMARY.md** - Project structure and features
- **examples/README.md** - Example scripts guide

## 🆘 Troubleshooting

| Error | Solution |
|-------|----------|
| "Not authenticated" | Call `await sdk.login()` or `await sdk.getCredentials()` |
| "File already exists" | Delete existing file or use different destination |
| "File not found" | Check file ID with `await sdk.list()` |
| "Invalid credentials" | Verify email/password are correct |

## ⚙️ Environment Variables

```env
DRIVE_NEW_API_URL=https://gateway.internxt.com/drive
NETWORK_URL=https://gateway.internxt.com/network
APP_CRYPTO_SECRET=6KYQBP847D4ATSFA
INXT_USER=email@example.com        # Optional: auto-login
INXT_PASSWORD=your-password        # Optional: auto-login
INXT_TWOFACTORCODE=123456         # Optional: if 2FA enabled
```

## 📦 What's Included

- ✅ Complete authentication system
- ✅ File upload/download with progress
- ✅ Folder management
- ✅ Credential persistence
- ✅ End-to-end encryption
- ✅ 5 working examples
- ✅ Full API documentation

## 🎓 Learning Path

1. Start with `npm start` to see demo
2. Read `README.md` for overview
3. Try examples in `examples/` folder
4. Check `API.md` for detailed reference
5. Build your own integration!

---

**Ready to use!** See `README.md` and `API.md` for full documentation.
