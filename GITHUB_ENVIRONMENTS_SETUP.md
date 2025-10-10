# GitHub Actions Setup with Environments

## Overview

This project uses GitHub Environments to manage secrets and provide deployment protection for NPM publishing and integration tests.

## GitHub Environment: "Prd"

All secrets should be configured in a GitHub Environment named **"Prd"** (Production).

### Why Use Environments?

✅ **Better Security**: Secrets are scoped to specific environments
✅ **Protection Rules**: Require approval before publishing
✅ **Audit Trail**: Track who deployed and when
✅ **URL Display**: Shows package URL in deployment history

## Setup GitHub Environment

### Step 1: Create the Environment

1. Go to your repository on GitHub
2. Click **Settings** tab
3. In the left sidebar, click **Environments**
4. Click **New environment**
5. Name it: `Prd`
6. Click **Configure environment**

### Step 2: (Optional) Add Protection Rules

You can add protection rules to require manual approval before publishing:

1. In the environment settings, enable **Required reviewers**
2. Add yourself or team members as reviewers
3. Enable **Wait timer** if you want a delay before deployment
4. Save the rules

### Step 3: Add Environment Secrets

In the **Prd** environment settings, add these secrets:

#### For NPM Publishing
| Secret Name | Description | Required |
|------------|-------------|----------|
| `NPM_TOKEN` | NPM automation token | ✅ Yes |

**How to get NPM_TOKEN:**
1. Go to https://www.npmjs.com
2. Sign in → Profile → Access Tokens
3. Generate New Token → Classic Token
4. Select "Automation" type
5. Copy the token
6. Add to Prd environment secrets

#### For Integration Tests
| Secret Name | Description | Example | Required |
|------------|-------------|---------|----------|
| `INTERNXT_TEST_EMAIL` | Test account email | `test@example.com` | ✅ Yes |
| `INTERNXT_TEST_PASSWORD` | Test account password | `SecurePassword123!` | ✅ Yes |
| `INTERNXT_TEST_2FA_SECRET` | TOTP secret key | `JBSWY3DPEHPK3PXP` | ✅ Yes |
| `DESKTOP_HEADER` | Desktop token | `3b68706a...` | ⚪ Optional |

**How to get 2FA Secret:**
1. In Internxt, go to 2FA setup
2. Click "Can't scan QR code?" or "Enter manually"
3. Copy the secret key (NOT the 6-digit code)
4. This is the TOTP seed used to generate codes

## Workflows Using "Prd" Environment

### 1. NPM Publish Workflow
```yaml
environment:
  name: Prd
  url: https://www.npmjs.com/package/@knight1988/internxt-sdk
```

**When it runs:**
- Creating a GitHub release
- Manual workflow dispatch

**What it does:**
1. Runs tests on Node.js 18.x and 20.x
2. Optionally runs integration tests (manual dispatch only)
3. Waits for environment protection rules (if configured)
4. Publishes to NPM with provenance
5. Records deployment in environment history

### 2. Integration Tests Workflow
```yaml
environment:
  name: Prd
```

**When it runs:**
- Manual trigger via GitHub Actions UI
- Scheduled: Daily at 2 AM UTC

**What it does:**
1. Runs full test suite with real credentials
2. Uses secrets from Prd environment
3. Uploads test artifacts if tests fail

### 3. CI Workflow
**Does NOT use environment** - runs unit tests only, no secrets needed.

## Publishing Workflow

### Automatic Publishing (with Environment)

1. **Update version:**
   ```bash
   npm version patch  # or minor, or major
   ```

2. **Commit and push:**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: bump version to x.x.x"
   git push origin main
   git push --tags
   ```

3. **Create GitHub release:**
   ```bash
   gh release create v0.1.0 --title "Release v0.1.0" --notes "Initial release"
   ```

4. **GitHub Actions will:**
   - ✅ Run tests on multiple Node versions
   - ⏸️ Wait for environment protection (if configured)
   - 📦 Build the package
   - 🚀 Publish to NPM
   - ✅ Record deployment in Prd environment

### Manual Trigger with Integration Tests

1. Go to **Actions** → **Publish to NPM**
2. Click **Run workflow**
3. Select branch: `main`
4. Click **Run workflow**

This will run both unit AND integration tests before publishing.

## Environment Secrets vs Repository Secrets

### Environment Secrets (Recommended) ✅
- Scoped to specific environment
- Can have protection rules
- Shows in deployment history
- Better security

### Repository Secrets
- Available to all workflows
- No protection rules
- Less visibility

**We use Environment Secrets for better security and control.**

## Viewing Deployments

1. Go to your repository
2. Click **Code** tab
3. On the right side, click **Deployments**
4. See all Prd deployments with:
   - Version number
   - Timestamp
   - Who triggered it
   - NPM package URL

## Security Best Practices

✅ **DO:**
- Use environment secrets for sensitive data
- Add required reviewers for production deployments
- Use a dedicated test account for integration tests
- Rotate NPM tokens periodically

❌ **DON'T:**
- Use production credentials for testing
- Commit secrets to git
- Share secrets in issues or PRs
- Use personal accounts for automation

## Troubleshooting

### Environment not found
**Problem:** Workflow fails with "environment not found"

**Solution:**
1. Create environment named exactly "Prd" (case-sensitive)
2. Push workflow file again

### Secrets not accessible
**Problem:** Tests fail with "credentials not found"

**Solution:**
1. Verify secrets are added to **Prd environment**, not repository
2. Secret names must be exact (case-sensitive)
3. Workflow must reference the environment

### Waiting for approval
**Problem:** Workflow is "Waiting" and not proceeding

**Solution:**
1. Check if required reviewers are configured
2. A reviewer must approve the deployment
3. Or remove the required reviewers rule

## Testing Your Setup

### 1. Test Integration Tests Workflow
```bash
# In GitHub UI:
Actions → Integration Tests → Run workflow
```

This will test that all environment secrets are configured correctly.

### 2. Test Publishing (Dry Run)
You can manually trigger the publish workflow without creating a release to test the setup (it won't actually publish without a version bump).

### 3. First Real Release
```bash
npm version 0.1.0
git push origin main --tags
gh release create v0.1.0 --title "Initial Release" --notes "First release"
```

## Quick Reference Commands

```bash
# Create environment via GitHub CLI
gh api repos/:owner/:repo/environments/Prd -X PUT

# List environments
gh api repos/:owner/:repo/environments

# Add secret to environment
gh secret set NPM_TOKEN --env Prd

# View deployments
gh api repos/:owner/:repo/deployments

# Create release (triggers publish)
gh release create v0.1.0 --title "v0.1.0" --notes "Release notes"
```

## Status Checklist

Before publishing, ensure:

- ✅ Prd environment created
- ✅ NPM_TOKEN added to Prd secrets
- ✅ INTERNXT_TEST_* secrets added to Prd
- ✅ Integration tests pass locally
- ✅ Protection rules configured (optional)
- ✅ Version bumped in package.json
- ✅ Changelog updated (if applicable)

## Next Steps

1. **Create Prd environment** in GitHub Settings → Environments
2. **Add all required secrets** to the Prd environment
3. **Test integration tests** workflow manually
4. **Create first release** to test the full publish workflow
5. **Monitor** the Actions tab for deployment status

For more details, see:
- `SECRETS_QUICK_REFERENCE.md` - Quick reference for secrets
- `README.md` - General project documentation
