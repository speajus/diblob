# Setup Guide

This document explains the VitePress documentation and GitHub workflows setup for diblob.

## Documentation

The project uses [VitePress](https://vitepress.dev/) for documentation.

### Local Development

Start the development server:

```bash
npm run docs:dev
```

This will start a local server at `http://localhost:5173` with hot reload.

### Build Documentation

Build the static documentation site:

```bash
npm run docs:build
```

The built site will be in `docs/.vitepress/dist`.

### Preview Built Site

Preview the built documentation:

```bash
npm run docs:preview
```

### Documentation Structure

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress configuration
├── public/                # Static assets (logo, images, etc.)
├── guide/                 # User guides
│   ├── what-is-diblob.md
│   ├── getting-started.md
│   ├── blobs.md
│   ├── containers.md
│   ├── dependency-resolution.md
│   ├── reactive-dependencies.md
│   ├── async-support.md
│   ├── container-nesting.md
│   ├── lifecycle.md
│   ├── constructor-injection.md
│   └── factory-injection.md
├── api/                   # API reference
│   ├── index.md
│   ├── create-blob.md
│   ├── create-container.md
│   ├── container-methods.md
│   └── types.md
├── examples/              # Code examples
│   ├── index.md
│   ├── basic.md
│   ├── factory-injection.md
│   ├── async.md
│   ├── reactive.md
│   └── nesting.md
└── index.md              # Homepage
```

## GitHub Workflows

### 1. Publish to npm

**File:** `.github/workflows/publish-npm.yml`

**Trigger:** When a new release is published on GitHub

**What it does:**
1. Checks out the code
2. Sets up Node.js 22
3. Installs dependencies
4. Runs tests
5. Builds the library
6. Publishes to npm with provenance

**Setup Required:**
1. Create an npm account if you don't have one
2. Generate an npm access token:
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type
   - Copy the token
3. Add the token to GitHub secrets:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm token
4. Create a release on GitHub to trigger the workflow

### 2. Deploy Documentation

**File:** `.github/workflows/deploy-docs.yml`

**Trigger:** 
- Push to `main` branch
- Manual trigger via workflow_dispatch

**What it does:**
1. Checks out the code
2. Sets up Node.js 22
3. Installs dependencies
4. Builds the documentation
5. Deploys to GitHub Pages

**Setup Required:**
1. Enable GitHub Pages:
   - Go to your repository → Settings → Pages
   - Under "Build and deployment"
   - Source: "GitHub Actions"
2. The workflow will automatically deploy on push to main

**Access the documentation at:**
`https://jspears.github.io/diblob/`

## Publishing Workflow

### Publishing a New Version

1. **Update version in package.json:**
   ```bash
   npm version patch  # or minor, or major
   ```

2. **Commit and push:**
   ```bash
   git add package.json
   git commit -m "Bump version to X.Y.Z"
   git push
   ```

3. **Create a GitHub release:**
   - Go to your repository → Releases → "Draft a new release"
   - Click "Choose a tag" → Create new tag (e.g., `v0.1.0`)
   - Fill in release title and description
   - Click "Publish release"

4. **The workflow will automatically:**
   - Run tests
   - Build the library
   - Publish to npm

### Documentation Updates

Documentation is automatically deployed when you push to `main`:

1. **Make changes to documentation:**
   ```bash
   # Edit files in docs/
   npm run docs:dev  # Preview locally
   ```

2. **Commit and push:**
   ```bash
   git add docs/
   git commit -m "Update documentation"
   git push
   ```

3. **The workflow will automatically:**
   - Build the documentation
   - Deploy to GitHub Pages

## Customization

### Update Base URL

If your repository name is different, update the base URL in `docs/.vitepress/config.ts`:

```typescript
export default defineConfig({
  base: '/your-repo-name/',  // Change this
  // ...
})
```

### Add a Logo

1. Add your logo to `docs/public/logo.svg`
2. The config already references it in the theme config

### Update GitHub Links

Update the repository URL in:
- `package.json` - `repository.url`
- `docs/.vitepress/config.ts` - `themeConfig.socialLinks`

## Troubleshooting

### Documentation Build Fails

Check for dead links:
```bash
npm run docs:build
```

Fix any dead links reported in the output.

### npm Publish Fails

1. Check that `NPM_TOKEN` secret is set correctly
2. Verify you have permission to publish to the package name
3. Check that the version number hasn't been published before

### GitHub Pages Not Updating

1. Check the Actions tab for workflow errors
2. Verify GitHub Pages is enabled in repository settings
3. Check that the workflow has write permissions for Pages

## Additional Resources

- [VitePress Documentation](https://vitepress.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

