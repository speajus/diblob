# GitHub Workflows Configuration

## Summary

All GitHub workflows have been updated to work with the monorepo structure.

## Workflows

### ✅ 1. CI Workflow (`ci.yml`)
**Status**: New workflow created

**Triggers**:
- Pull requests to `main`
- Pushes to `main`

**What it does**:
- Runs tests
- Builds all packages
- Type checks with TypeScript

**Purpose**: Ensures code quality on every PR and push

---

### ✅ 2. Release Workflow (`publish-npm.yml`)
**Status**: Updated for monorepo + Changesets

**Triggers**:
- Pushes to `main`

**What it does**:
1. Runs tests and builds
2. Uses Changesets action to:
   - Create "Version Packages" PR when changesets exist
   - Publish to npm when Version Packages PR is merged

**Changes from original**:
- ❌ Old: Triggered on GitHub releases
- ✅ New: Automated with Changesets workflow
- ❌ Old: Single package publish
- ✅ New: Publishes both packages at same version

**How it works**:
```
Developer creates changeset → Merge PR → Workflow creates Version PR
→ Merge Version PR → Workflow publishes to npm
```

---

### ✅ 3. Documentation Workflow (`deploy-docs.yml`)
**Status**: Updated for monorepo structure

**Triggers**:
- Pushes to `main`
- Manual dispatch

**What it does**:
- Builds VitePress documentation
- Deploys to GitHub Pages

**Changes**:
- ❌ Old: `npm run docs:build` (root level)
- ✅ New: `npm run docs:build -w @speajus/diblob` (workspace)
- ❌ Old: `docs/.vitepress/dist`
- ✅ New: `packages/diblob/docs/.vitepress/dist`

---

## Setup Required

### 1. NPM_TOKEN Secret

**Required for**: Release workflow (publishing to npm)

**Steps**:
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Classic Token"
3. Select "Automation" type
4. Copy the token
5. Go to GitHub repo Settings → Secrets and variables → Actions
6. Click "New repository secret"
7. Name: `NPM_TOKEN`
8. Paste token and save

### 2. GitHub Pages

**Required for**: Documentation deployment

**Steps**:
1. Go to repository Settings → Pages
2. Source: Select "GitHub Actions"
3. Save

---

## Publishing Workflow

### Complete Release Process

1. **Developer makes changes**:
   ```bash
   git checkout -b feature/my-feature
   # Make changes
   npm run changeset
   # Select packages, version bump, write summary
   git add .
   git commit -m "feat: add feature"
   git push
   ```

2. **Create PR and merge**:
   - CI workflow runs (tests, build, type check)
   - Get approval and merge to main

3. **Automatic Version PR**:
   - Release workflow detects changeset
   - Creates "Version Packages" PR
   - Updates both packages to same version (fixed versioning)
   - Generates CHANGELOGs

4. **Merge Version PR**:
   - Release workflow publishes both packages to npm
   - Creates git tags
   - Done! 🎉

---

## Verification

### Test Locally

```bash
# Test what CI runs
npm ci
npm test
npm run build
npx tsc --build --force

# Test docs build
npm run docs:build
```

### Monitor Workflows

- Go to repository "Actions" tab
- View workflow runs
- Check logs if failures occur

---

## Workflow Files

```
.github/workflows/
├── ci.yml              # CI testing on PRs and pushes
├── publish-npm.yml     # Automated releases with Changesets
├── deploy-docs.yml     # Documentation deployment
└── README.md           # Detailed workflow documentation
```

---

## Key Differences from Before

| Aspect | Before | After |
|--------|--------|-------|
| **Publishing** | Manual GitHub releases | Automated with Changesets |
| **Versioning** | Manual version bumps | Automated via changesets |
| **CI** | No dedicated CI workflow | Full CI on PRs |
| **Docs Path** | `docs/` | `packages/diblob/docs/` |
| **Build** | Single package | All workspace packages |
| **Version Sync** | Independent versions | Fixed versioning (same version) |

---

## Troubleshooting

### CI Fails
- Check test output in workflow logs
- Run `npm test` locally to reproduce
- Verify all dependencies are in package.json

### Release Workflow Doesn't Create Version PR
- Ensure changesets exist in `.changeset/` directory
- Check changeset files are not empty
- Verify workflow has write permissions

### Publishing Fails
- Verify `NPM_TOKEN` secret is set
- Check token has publish permissions
- Ensure package names are available on npm
- Verify you're a collaborator on the npm packages

### Docs Deployment Fails
- Verify GitHub Pages is enabled
- Check docs build locally: `npm run docs:build`
- Review workflow logs for errors

---

## Next Steps

1. ✅ Workflows are configured and ready
2. ⚠️ Add `NPM_TOKEN` secret to GitHub
3. ⚠️ Enable GitHub Pages
4. ✅ Test by creating a changeset and PR
5. ✅ Monitor first automated release

---

## Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Changesets GitHub Action](https://github.com/changesets/action)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

