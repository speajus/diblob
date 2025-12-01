# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

## Fixed Versioning ⚠️

**All packages in this monorepo are configured to publish at the same version.**

This is configured in `.changeset/config.json`:
```json
{
  "fixed": [["@speajus/diblob", "@speajus/diblob-visualizer"]]
}
```

### What this means:

- When you create a changeset for **any** package, **both** packages will be versioned together
- If you bump `@speajus/diblob` from `0.2.1` to `0.3.0`, `@speajus/diblob-visualizer` will also be bumped to `0.3.0`
- This ensures version consistency across the monorepo
- Users can easily identify which versions of packages work together

## Quick Start

### Creating a Changeset

```bash
npm run changeset
```

Follow the prompts to select packages, choose version bump type (major/minor/patch), and write a summary.

### Versioning Packages

```bash
npm run version-packages
```

Updates all package versions to the same number and generates CHANGELOGs.

### Publishing

```bash
npm run release
```

Builds and publishes all changed packages to npm.

## Learn More

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Fixed Versioning](https://github.com/changesets/changesets/blob/main/docs/fixed-packages.md)
- [Common Questions](https://github.com/changesets/changesets/blob/main/docs/common-questions.md)

