# GitHub Secrets Configuration Quick Reference

## Required Secrets for CI/CD

### For NPM Publishing
| Secret Name | Description | Where to Get It | Required |
|------------|-------------|-----------------|----------|
| `NPM_TOKEN` | NPM automation token | npmjs.com → Profile → Access Tokens → Generate Classic Token (Automation) | ✅ Yes |

### For Integration Tests
| Secret Name | Description | Example | Required |
|------------|-------------|---------|----------|
| `INTERNXT_TEST_EMAIL` | Test account email | `test@example.com` | ✅ Yes |
| `INTERNXT_TEST_PASSWORD` | Test account password | `SecurePassword123!` | ✅ Yes |
| `INTERNXT_TEST_2FA_SECRET` | TOTP secret key (NOT 6-digit code) | `JBSWY3DPEHPK3PXP` | ✅ Yes |
| `DESKTOP_HEADER` | Desktop token for privileged operations | `3b68706a367fd567b929396290b1de40768bb768` | ⚪ Optional (has default) |

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret one by one

## Getting Your 2FA Secret Key

When setting up 2FA in Internxt:
1. You'll see a QR code
2. Click **"Can't scan?"** or **"Enter manually"**
3. Copy the secret key shown (16+ character string)
4. This is `INTERNXT_TEST_2FA_SECRET` - NOT the 6-digit code

## Workflows That Use Secrets

### 1. NPM Publish (`npm-publish.yml`)
- **Triggers**: Release creation, manual dispatch
- **Uses**: `NPM_TOKEN` (always), test secrets (on manual dispatch only)
- **Purpose**: Publish package to NPM

### 2. Integration Tests (`integration-tests.yml`)
- **Triggers**: Manual, daily at 2 AM UTC
- **Uses**: All test secrets
- **Purpose**: Run full integration test suite

### 3. CI (`ci.yml`)
- **Triggers**: Push/PR to main/develop
- **Uses**: No secrets (unit tests only)
- **Purpose**: Fast CI checks

## Testing Your Setup

### Local Testing (Before CI)
```bash
# Create local env file
cp .env.test .env.test.local

# Add your credentials to .env.test.local
# Then test locally
npm run test:integration
```

### CI Testing
1. Add secrets to GitHub
2. Go to **Actions** tab
3. Select **Integration Tests** workflow
4. Click **Run workflow**
5. Check results

## Quick Commands

```bash
# Version bump
npm version patch

# Push with tags
git push origin main --tags

# Create release (triggers publish)
gh release create v0.1.0 --title "v0.1.0" --notes "Release notes"
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Test credentials not found" | Check secret names are exact (case-sensitive) |
| "Invalid 2FA code" | Use TOTP secret key, not 6-digit code |
| NPM publish auth error | Verify NPM_TOKEN is "Automation" type |
| Integration tests timeout | Check credentials are valid in Internxt |

## Security Notes

✅ **Safe:**
- Secrets are encrypted in GitHub
- Not visible in logs
- Only accessible to workflows with permission

⚠️ **Never:**
- Commit secrets to git
- Share secrets in issues/PRs
- Use production account for tests
