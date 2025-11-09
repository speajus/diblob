# GitHub Workflows

This directory contains GitHub Actions workflows for the diblob monorepo.

## Workflows

### 1. CI (`ci.yml`)

**Trigger**: Pull requests and pushes to `main`

**Purpose**: Continuous integration testing

**Steps**:
1. Checkout code
2. Setup Node.js 22
3. Install dependencies
4. Run tests
5. Build all packages
6. Type check with TypeScript

**When it runs**:
- On every pull request to `main`
- On every push to `main`

---

### 2. Release (`publish-npm.yml`)

**Trigger**: Pushes to `main` branch

**Purpose**: Automated versioning and publishing using Changesets

**Steps**:
1. Checkout code
2. Setup Node.js 22 with npm registry
3. Install dependencies
4. Run tests
5. Build all packages
6. Run Changesets action which:
   - Creates a "Version Packages" PR if there are changesets
   - OR publishes to npm if the Version Packages PR is merged

**How it works**:

1. **Developer creates a changeset**:
   ```bash
   npm run changeset
   ```
   Commits the changeset file to the PR.

2. **PR is merged to main**:
   - Workflow runs and detects unpublished changesets
   - Creates a "Version Packages" PR that:
     - Updates package.json versions (both packages to same version due to fixed versioning)
     - Generates/updates CHANGELOG.md files
     - Removes consumed changeset files

3. **Version Packages PR is merged**:
   - Workflow runs again
   - Detects version changes
   - Publishes both packages to npm
   - Creates git tags

**Required Secrets**:
- `NPM_TOKEN`: npm authentication token with publish permissions
  - Create at: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
  - Add to: Repository Settings → Secrets and variables → Actions

---

### 3. Deploy Documentation (`deploy-docs.yml`)

**Trigger**: Pushes to `main` branch or manual dispatch

**Purpose**: Build and deploy VitePress documentation to GitHub Pages

**Steps**:
1. Checkout code
2. Setup Node.js 22
3. Setup GitHub Pages
4. Install dependencies
5. Build documentation (from `packages/diblob/docs/`)
6. Upload artifact
7. Deploy to GitHub Pages

**Requirements**:
- GitHub Pages must be enabled in repository settings
- Source: GitHub Actions

---

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: Select "GitHub Actions"
3. Save

### 2. Add NPM_TOKEN Secret

1. Create an npm access token:
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type
   - Copy the token

2. Add to GitHub:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

### 3. Verify Workflows

After setup, workflows will run automatically. You can monitor them in the "Actions" tab.

## Publishing Workflow Example

### Step-by-step release process:

1. **Make changes and create changeset**:
   ```bash
   # Make your code changes
   git checkout -b feature/my-feature
   
   # Create a changeset
   npm run changeset
   # Select packages, choose version bump, write summary
   
   # Commit everything
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

2. **Create and merge PR**:
   - Create PR on GitHub
   - CI workflow runs (tests, build, type check)
   - Get approval and merge to main

3. **Automatic Version PR**:
   - Release workflow detects changeset
   - Creates "Version Packages" PR automatically
   - Review the version bumps and changelogs
   - Merge the Version Packages PR

4. **Automatic Publishing**:
   - Release workflow detects version changes
   - Publishes both packages to npm
   - Creates git tags
   - Done! 🎉

## Troubleshooting

### CI fails with "npm ci" error
- Delete `package-lock.json` and run `npm install` locally
- Commit the updated lock file

### Release workflow doesn't create Version PR
- Check that changesets exist in `.changeset/` directory
- Verify changeset files are not empty
- Check workflow logs in Actions tab

### Publishing fails
- Verify `NPM_TOKEN` secret is set correctly
- Check token has publish permissions
- Verify package names are available on npm
- Check package.json `publishConfig` if present

### Documentation deployment fails
- Verify GitHub Pages is enabled
- Check that docs build locally: `npm run docs:build -w @speajus/diblob`
- Review workflow logs for specific errors

