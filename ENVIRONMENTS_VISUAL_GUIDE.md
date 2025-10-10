# GitHub Actions with Environments - Visual Guide

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                            │
│                      Knight1988/InternxtSdk                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐        ┌────────────────┐       ┌────────────────┐
│   CI Workflow │        │ NPM Publish    │       │  Integration   │
│               │        │   Workflow     │       │  Tests         │
├───────────────┤        ├────────────────┤       ├────────────────┤
│ Trigger:      │        │ Trigger:       │       │ Trigger:       │
│ • Push/PR     │        │ • Release      │       │ • Manual       │
│               │        │ • Manual       │       │ • Daily 2AM    │
├───────────────┤        ├────────────────┤       ├────────────────┤
│ Environment:  │        │ Environment:   │       │ Environment:   │
│ ❌ None       │        │ ✅ Prd         │       │ ✅ Prd         │
├───────────────┤        ├────────────────┤       ├────────────────┤
│ Secrets:      │        │ Secrets:       │       │ Secrets:       │
│ ❌ None       │        │ • NPM_TOKEN    │       │ • TEST_EMAIL   │
│               │        │ • TEST_* (opt) │       │ • TEST_PASS    │
│               │        │                │       │ • TEST_2FA     │
├───────────────┤        ├────────────────┤       ├────────────────┤
│ Tests:        │        │ Tests:         │       │ Tests:         │
│ Unit only     │        │ Unit + Int(opt)│       │ Unit + Int     │
│ 28 tests      │        │ 28-59 tests    │       │ 59 tests       │
│ ~600ms        │        │ ~1-50s         │       │ ~50s           │
└───────────────┘        └────────────────┘       └────────────────┘
                                  │
                                  │ (if release)
                                  ▼
                         ┌─────────────────┐
                         │  Protection     │
                         │  Rules?         │
                         │  (optional)     │
                         └─────────────────┘
                                  │
                         ┌────────┴────────┐
                         │                 │
                         ▼                 ▼
                    ┌─────────┐       ┌─────────┐
                    │ Approve │       │ Auto    │
                    │ Manual  │       │ Deploy  │
                    └─────────┘       └─────────┘
                         │                 │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Publish to     │
                         │  NPM Registry   │
                         └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Deployment     │
                         │  Recorded in    │
                         │  Prd History    │
                         └─────────────────┘
```

## Environment: Prd

```
┌──────────────────────────────────────────────────────────────┐
│                    Environment: Prd                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📦 Deployment URL:                                          │
│     https://www.npmjs.com/package/@knight1988/internxt-sdk  │
│                                                              │
│  🔐 Environment Secrets:                                     │
│     ├─ NPM_TOKEN                (required for publish)      │
│     ├─ INTERNXT_TEST_EMAIL      (required for int tests)    │
│     ├─ INTERNXT_TEST_PASSWORD   (required for int tests)    │
│     ├─ INTERNXT_TEST_2FA_SECRET (required for int tests)    │
│     └─ DESKTOP_HEADER           (optional, has default)     │
│                                                              │
│  🛡️  Protection Rules (optional):                            │
│     ├─ Required reviewers: [ ]                              │
│     ├─ Wait timer: [ ]                                      │
│     └─ Deployment branches: main                            │
│                                                              │
│  📊 Deployment History:                                      │
│     ├─ v0.1.0  [2024-10-10]  by @Knight1988                │
│     ├─ v0.2.0  [2024-10-15]  by @Knight1988                │
│     └─ ...                                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Workflow Comparison

| Feature                  | CI Workflow | NPM Publish | Integration Tests |
|-------------------------|-------------|-------------|-------------------|
| **Uses Environment**    | ❌ No       | ✅ Yes (Prd) | ✅ Yes (Prd)      |
| **Requires Secrets**    | ❌ No       | ✅ Yes       | ✅ Yes            |
| **Protection Rules**    | ❌ No       | ✅ Optional  | ✅ Optional       |
| **Speed**               | ⚡ Fast     | ⚡ Fast/Slow | 🐌 Slow          |
| **Run Frequency**       | Every push  | On release  | Daily + Manual    |
| **Deployment Tracking** | ❌ No       | ✅ Yes       | ❌ No             |

## Setup Steps Visual

```
Step 1: Create Environment
═══════════════════════════
GitHub → Settings → Environments → New environment → "Prd"

Step 2: Add Secrets
═══════════════════
Prd → Environment secrets → Add secret
  ├─ NPM_TOKEN
  ├─ INTERNXT_TEST_EMAIL
  ├─ INTERNXT_TEST_PASSWORD
  ├─ INTERNXT_TEST_2FA_SECRET
  └─ DESKTOP_HEADER (optional)

Step 3: Configure Protection (Optional)
═══════════════════════════════════════
Prd → Required reviewers → Add reviewers

Step 4: Test
═══════════
Actions → Integration Tests → Run workflow
└─ Verify all secrets work

Step 5: First Release
════════════════════
npm version 0.1.0
git push origin main --tags
gh release create v0.1.0
└─ Triggers NPM Publish workflow
   └─ Uses Prd environment
      └─ Publishes to NPM
         └─ Records deployment
```

## Secrets Flow

```
Developer
    │
    ├─ Adds secrets to Prd environment
    │
    ▼
GitHub Environment "Prd"
    │
    ├─ Stores encrypted secrets
    │
    ▼
Workflow Runs
    │
    ├─ References environment: Prd
    ├─ Applies protection rules
    ├─ Injects secrets as env vars
    │
    ▼
Test/Build/Publish Steps
    │
    ├─ Access secrets via ${{ secrets.SECRET_NAME }}
    ├─ Never exposed in logs
    │
    ▼
Deployment Complete
    │
    └─ Recorded in Prd deployment history
```

## Benefits of Using Environments

| Benefit               | Description                                      |
|----------------------|--------------------------------------------------|
| 🔒 **Security**      | Secrets scoped to environment, not global        |
| 👥 **Protection**    | Require reviewers before deployment              |
| 📊 **Visibility**    | See all deployments in one place                 |
| 🔍 **Audit Trail**   | Track who deployed when                          |
| 🎯 **URL Tracking**  | Link deployments to NPM package                  |
| ⏸️  **Control**      | Add wait timers or branch restrictions           |

## Quick Commands

```bash
# Create environment via GitHub CLI
gh api repos/Knight1988/InternxtSdk/environments/Prd -X PUT \
  -f deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}'

# Add secret to environment
gh secret set NPM_TOKEN --env Prd --body "your-token-here"

# List environment secrets
gh secret list --env Prd

# View deployments
gh api repos/Knight1988/InternxtSdk/deployments

# Create release (triggers publish workflow)
gh release create v0.1.0 --title "Release v0.1.0" --notes "Initial release"
```

## Troubleshooting Visual

```
❌ Workflow fails with "environment not found"
   └─ Solution: Create "Prd" environment (case-sensitive)

❌ "Waiting for approval" and stuck
   └─ Solution: Check required reviewers, approve manually
              OR remove protection rule

❌ "NPM_TOKEN not found"
   └─ Solution: Add secret to Prd ENVIRONMENT, not repo secrets

❌ Integration tests fail with "credentials not found"
   └─ Solution: Verify all INTERNXT_TEST_* secrets in Prd environment

❌ Can't find deployment history
   └─ Solution: Click "Environments" tab → "Prd" → "View deployment"
```
