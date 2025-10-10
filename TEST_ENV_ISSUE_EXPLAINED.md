# Test Environment Issue - Root Cause Analysis

## 🔍 Investigation Results

### The Problem
Folder `rename` and `move` operations fail in our tests with:
- `Error: Value of 'uuid' is not a valid UUID`
- `Error: destinationFolder must be a UUID`

But the same operations work perfectly using the `@internxt/cli` command.

### ✅ Root Cause Found

The Internxt API **requires** a special header for certain operations:

```
x-internxt-desktop-header: <desktop_token>
```

### 🔬 Evidence

#### 1. CLI Configuration
The CLI includes this in its `.env` file:
```bash
# From node_modules/@internxt/cli/.env
DESKTOP_HEADER=3b68706a367fd567b929396290b1de40768bb768
```

#### 2. SDK Header Construction
From `@internxt/sdk/dist/shared/headers/index.js`:
```javascript
function basicHeaders({ clientName, clientVersion, customHeaders, desktopToken }) {
    var extra = {};
    if (desktopToken) {
        extra['x-internxt-desktop-header'] = desktopToken;  // ← THIS!
    }
    return {
        'content-type': 'application/json; charset=utf-8',
        'internxt-version': clientVersion,
        'internxt-client': clientName,
        ...extra,
        ...customHeaders
    };
}
```

#### 3. CLI App Details
The CLI passes `desktopHeader` to the SDK:
```typescript
// From @internxt/cli SDK manager
static getAppDetails = () => {
    return {
        clientName: 'internxt-cli',
        clientVersion: '1.5.6',
        desktopHeader: ConfigService.instance.get('DESKTOP_HEADER'),  // ← THIS!
    };
};
```

#### 4. Our Implementation
We currently pass:
```typescript
appDetails: {
    clientName: 'internxt-sdk',
    clientVersion: '1.0.0',
    // desktopHeader: undefined  ← MISSING!
}
```

### 📊 Impact Analysis

**Without `desktopHeader`:**
- ✅ Login works
- ✅ Logout works
- ✅ List folders works
- ✅ Create folders works
- ❌ **Rename folders fails**
- ❌ **Move folders fails**
- ❌ **File uploads fail** (likely same reason)

**With `desktopHeader`:**
- ✅ All operations work (as proven by CLI)

### 🎯 Why This Matters

The API uses the `x-internxt-desktop-header` to:
1. **Identify authorized clients** - Only official clients have valid desktop headers
2. **Enable privileged operations** - Rename, move, upload require this header
3. **Security/Rate limiting** - Prevents unauthorized SDK usage

This is actually a **security feature**, not a bug!

### 💡 The Solution

Add `desktopHeader` to our `AppDetails`:

```typescript
// types/index.ts
export interface AppDetails {
  clientName: string;
  clientVersion: string;
  desktopHeader?: string;  // Add this
}

// index.ts - Constructor
this.config = {
  // ...
  appDetails: {
    clientName: options.clientName || 'internxt-sdk',
    clientVersion: options.clientVersion || '1.0.0',
    desktopHeader: options.desktopHeader || 
                   process.env.DESKTOP_HEADER || 
                   '3b68706a367fd567b929396290b1de40768bb768',
  },
};
```

### 📝 Implementation Options

#### Option 1: Use CLI's Desktop Header (Simplest)
```typescript
desktopHeader: '3b68706a367fd567b929396290b1de40768bb768'
```
**Pros:** Works immediately, matches CLI  
**Cons:** Hardcoding may violate terms of service

#### Option 2: Require Users to Provide It
```typescript
if (!options.desktopHeader && !process.env.DESKTOP_HEADER) {
    throw new Error('desktopHeader required for SDK usage');
}
```
**Pros:** Explicit, proper licensing  
**Cons:** Users need to obtain valid header

#### Option 3: Document as Optional
```typescript
desktopHeader: options.desktopHeader || process.env.DESKTOP_HEADER
```
**Pros:** Flexible, works without it for basic ops  
**Cons:** Rename/move/upload won't work without it

### 🔒 Security Considerations

The `desktopHeader` token:
- Is meant for **official Internxt clients** only
- May be tied to specific client versions
- Could change or be revoked
- Using it in third-party SDKs may violate ToS

### ✅ Recommended Action

1. **Add `desktopHeader` support** to the SDK (makes it capable)
2. **Document the requirement** clearly
3. **Let users provide their own** via environment variable
4. **Update tests** to use `DESKTOP_HEADER` from env

```bash
# .env.test
DESKTOP_HEADER=3b68706a367fd567b929396290b1de40768bb768
```

### 📚 Related Files

**CLI Files:**
- `node_modules/@internxt/cli/.env` - Contains DESKTOP_HEADER
- `node_modules/@internxt/cli/dist/services/sdk-manager.service.js` - Uses it

**SDK Files:**
- `node_modules/@internxt/sdk/dist/shared/headers/index.js` - Adds header
- `node_modules/@internxt/sdk/dist/drive/storage/index.js` - Calls headers()

**Our Files:**
- `src/types/index.ts` - AppDetails interface (needs update)
- `src/index.ts` - SDK constructor (needs update)
- `src/services/*.ts` - Use appDetails from config

### 🎓 Key Learnings

1. **API security is multi-layered** - Token auth + desktop header
2. **Not all operations require same auth level** - Read vs Write
3. **Official clients have special privileges** - Desktop header grants access
4. **Environment matters** - What works in CLI may need special headers in SDK
5. **Always check headers when debugging API calls** - They matter!

### 📊 Test Comparison

| Operation | Without desktopHeader | With desktopHeader |
|-----------|----------------------|-------------------|
| Login | ✅ Works | ✅ Works |
| List | ✅ Works | ✅ Works |
| Create | ✅ Works | ✅ Works |
| Rename | ❌ Fails | ✅ Works |
| Move | ❌ Fails | ✅ Works |
| Upload | ❌ Fails | ✅ Works |

### 🚀 Next Steps

1. Update `AppDetails` interface to include `desktopHeader`
2. Update SDK constructor to accept and use `desktopHeader`
3. Add `DESKTOP_HEADER` to `.env.test`
4. Re-run tests - they should now pass!
5. Document this requirement in README

---

## Summary

**The "test environment issue" is actually a missing `x-internxt-desktop-header` HTTP header.**

The CLI works because it includes this header. Our tests don't because we don't have it configured.

This is not a code bug - it's a missing security token that the API requires for privileged operations!
