# Internxt SDK Examples

This directory contains example scripts demonstrating various SDK features.

## Prerequisites

Make sure you're logged in first:

```bash
node examples/auth.js
```

Or set credentials in `.env`:

```env
INXT_USER=your-email@example.com
INXT_PASSWORD=your-password
INXT_TWOFACTORCODE=123456  # if 2FA enabled
```

## Examples

### Authentication

```bash
node examples/auth.js
```

Demonstrates:
- Checking login status
- Logging in with credentials
- Handling 2FA
- Logging out

### List Folders and Files

```bash
# List root folder
node examples/list.js

# List specific folder
node examples/list.js <folder-id>
```

Shows all folders and files with:
- Names and IDs
- File sizes
- Creation/modification dates

### Create Folders

```bash
node examples/create-folder.js
```

Creates:
- A parent folder with timestamp
- Two subfolders (Documents and Photos)
- Lists the created structure

### Upload Files

```bash
node examples/upload.js
```

Demonstrates:
- Creating a test file
- Uploading with progress tracking
- Getting file metadata after upload

### Download Files

```bash
# Download first file from root
node examples/download.js

# Download specific file
node examples/download.js <file-id>
```

Features:
- Progress tracking
- Creating download directory
- Preserving file metadata

## Using in Your Code

All examples export their main functions:

```javascript
const { authExample } = require('./examples/auth');
const { listExample } = require('./examples/list');
const { uploadExample } = require('./examples/upload');
const { downloadExample } = require('./examples/download');
const { createFolderExample } = require('./examples/create-folder');

// Use in your code
await authExample();
const contents = await listExample();
const file = await uploadExample();
await downloadExample(file.id);
```

## Complete Workflow Example

```javascript
const InternxtSDK = require('../src/index');

async function completeWorkflow() {
  const sdk = new InternxtSDK();
  
  // 1. Login
  await sdk.login(email, password);
  
  // 2. Create a project folder
  const projectFolder = await sdk.createFolder('My Project');
  
  // 3. Upload files to it
  const file1 = await sdk.uploadFile('./document.pdf', projectFolder.id);
  const file2 = await sdk.uploadFile('./photo.jpg', projectFolder.id);
  
  // 4. List contents
  const contents = await sdk.list(projectFolder.id);
  console.log('Files:', contents.files.map(f => f.name));
  
  // 5. Download a file
  await sdk.downloadFile(file1.id, './backups');
  
  // 6. Logout
  await sdk.logout();
}
```

## Tips

- Run `auth.js` first to login and save credentials
- Once logged in, other examples work without credentials
- Use folder/file IDs from `list.js` in other examples
- Check `downloads/` folder for downloaded files
- Set progress callbacks to track upload/download status
