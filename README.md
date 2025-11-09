# diblob Monorepo

A monorepo containing the diblob dependency injection framework and its visualization tools.

## Packages

### [@speajus/diblob](./packages/diblob)

The core dependency injection framework where the proxy (blob) is the key.

- **Version**: 0.2.1
- **Description**: A dependency injection framework with automatic dependency resolution, reactive dependencies, and full TypeScript support
- **Documentation**: [https://speajus.github.io/diblob/](https://speajus.github.io/diblob/)

### [@speajus/diblob-visualizer](./packages/diblob-visualizer)

Interactive dependency injection graph visualization for diblob.

- **Version**: 1.0.0
- **Description**: Svelte-based visualization tool for exploring diblob container dependency graphs
- **Features**: Real-time graph updates, lifecycle indicators, statistics dashboard

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- npm >= 7.0.0 (for workspaces support)

### Installation

\`\`\`bash
# Install all dependencies
npm install
\`\`\`

### Building

\`\`\`bash
# Build all packages
npm run build

# Build individual packages
npm run build:diblob
npm run build:visualizer
\`\`\`

### Testing

\`\`\`bash
# Run tests for diblob
npm test

# Run tests in watch mode
npm run test:watch
\`\`\`

### Development

\`\`\`bash
# Start visualizer in development mode
npm run dev:visualizer

# Start documentation site
npm run docs:dev
\`\`\`

## Monorepo Structure

\`\`\`
diblob/
├── packages/
│   ├── diblob/              # Core DI framework
│   │   ├── src/             # Source code
│   │   ├── test/            # Tests
│   │   ├── examples/        # Example code
│   │   └── dist/            # Build output
│   │
│   └── diblob-visualizer/   # Visualization tool
│       ├── src/             # Svelte components
│       ├── public/          # Static assets
│       └── dist/            # Build output
│
├── docs/                    # Documentation site
├── .changeset/              # Changesets configuration
└── package.json             # Workspace root
\`\`\`

## Publishing

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

**Fixed Versioning**: All packages in this monorepo are configured to publish at the same version. When you create a changeset, both packages will be bumped to the same version number, ensuring version consistency across the monorepo.

### Creating a Changeset

When you make changes that should be published:

\`\`\`bash
npm run changeset
\`\`\`

Follow the prompts to:
1. Select which packages have changed
2. Choose the version bump type (major, minor, patch)
3. Write a summary of the changes

### Versioning Packages

To update package versions based on changesets:

\`\`\`bash
npm run version-packages
\`\`\`

This will:
- Update package.json versions
- Update dependencies between packages
- Generate CHANGELOG.md files

### Publishing to npm

\`\`\`bash
npm run release
\`\`\`

This will:
1. Build all packages
2. Publish changed packages to npm
3. Create git tags for the releases

## Scripts Reference

| Script | Description |
|--------|-------------|
| \`npm run build\` | Build all packages |
| \`npm run build:diblob\` | Build diblob package only |
| \`npm run build:visualizer\` | Build visualizer package only |
| \`npm test\` | Run diblob tests |
| \`npm run test:watch\` | Run tests in watch mode |
| \`npm run dev:visualizer\` | Start visualizer dev server |
| \`npm run docs:dev\` | Start documentation dev server |
| \`npm run docs:build\` | Build documentation site |
| \`npm run docs:preview\` | Preview built documentation |
| \`npm run clean\` | Remove all build outputs and node_modules |
| \`npm run changeset\` | Create a new changeset |
| \`npm run version-packages\` | Update versions from changesets |
| \`npm run release\` | Build and publish packages |

## Contributing

1. Make your changes
2. Add tests if applicable
3. Run \`npm test\` to ensure tests pass
4. Run \`npm run build\` to ensure builds succeed
5. Create a changeset: \`npm run changeset\`
6. Commit your changes including the changeset file

## License

MIT - See LICENSE file in each package for details

## Links

- [diblob Documentation](https://speajus.github.io/diblob/)
- [GitHub Repository](https://github.com/speajus/diblob)
- [npm - @speajus/diblob](https://www.npmjs.com/package/@speajus/diblob)
- [npm - @speajus/diblob-visualizer](https://www.npmjs.com/package/@speajus/diblob-visualizer)
