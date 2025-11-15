# diblob Monorepo

A monorepo containing the diblob dependency injection framework and its visualization tools.

## Packages

### [@speajus/diblob](./packages/diblob)

The core dependency injection framework where the proxy (blob) is the key.

- **Description**: A dependency injection framework with automatic dependency resolution, reactive dependencies, and full TypeScript support
- **Documentation**: [https://speajus.github.io/diblob/](https://speajus.github.io/diblob/)

### [@speajus/diblob-connect](./packages/diblob-connect)

Connect-based gRPC server implementation for diblob containers.

- **Description**: Connect/gRPC server integration using Connect-ES for modern gRPC/Connect/gRPC-Web services
- **Features**: Automatic dependency resolution, Connect-ES integration, gRPC service definitions

### [@speajus/diblob-logger](./packages/diblob-logger)

Winston-based logger integration for diblob containers.

- **Description**: Winston-based logger implementation that integrates with diblob's dependency injection system
- **Features**: Configurable logging levels, structured logging, diblob container integration

### [@speajus/diblob-mcp](./packages/diblob-mcp)

Model Context Protocol (MCP) server implementation for diblob containers.

- **Description**: MCP server that exposes diblob container functionality through the Model Context Protocol
- **Features**: Container introspection, dependency graph visualization, MCP tools for AI assistants

### [@speajus/diblob-svelte](./packages/diblob-svelte)

Svelte 5 integration helpers for diblob containers.

- **Description**: Utilities for using diblob containers in Svelte applications with context providers and hooks
- **Features**: Container context providers, reactive container access, Svelte 5 compatibility

### [@speajus/diblob-testing](./packages/diblob-testing)

Testing utilities for diblob dependency injection containers.

- **Description**: Comprehensive testing utilities including test container factories, blob override utilities, fake infrastructure implementations, and node:test integration
- **Features**: Test containers, blob overrides, in-memory logger, controllable clock, deterministic RNG, HTTP stubs

### [@speajus/diblob-visualizer](./packages/diblob-visualizer)

Interactive dependency injection graph visualization for diblob.

- **Description**: Svelte-based visualization tool for exploring diblob container dependency graphs
- **Features**: Real-time graph updates, lifecycle indicators, statistics dashboard

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 8.0.0 (for workspaces support)

### Installation

```bash
# Install all dependencies
pnpm install
```

### Building

```bash
# Build all packages
pnpm run build

# Build individual packages
pnpm run build:diblob
pnpm run build:mcp
pnpm run build:visualizer
```

### Testing

```bash
# Run tests for all packages
pnpm run test

# Run tests in watch mode
pnpm run test:watch
```

### Development

```bash
# Start visualizer in development mode
pnpm run dev:visualizer

# Start MCP server in development mode
pnpm run dev:mcp

# Start documentation site
pnpm run docs:dev
```

## Monorepo Structure

```
diblob/
├── packages/
│   ├── diblob/              # Core DI framework
│   │   ├── src/             # Source code
│   │   ├── test/            # Tests
│   │   ├── examples/        # Example code
│   │   └── dist/            # Build output
│   │
│   ├── diblob-connect/      # Connect/gRPC integration
│   │   ├── src/             # Source code
│   │   ├── test/            # Tests
│   │   └── dist/            # Build output
│   │
│   ├── diblob-logger/       # Winston-based logging
│   │   ├── src/             # Source code
│   │   ├── test/            # Tests
│   │   └── dist/            # Build output
│   │
│   ├── diblob-mcp/          # MCP server
│   │   ├── src/             # Source code
│   │   ├── example.ts       # Example usage
│   │   └── dist/            # Build output
│   │
│   ├── diblob-svelte/       # Svelte integration
│   │   ├── src/             # Source code
│   │   ├── test/            # Tests
│   │   └── dist/            # Build output
│   │
│   ├── diblob-testing/      # Testing utilities
│   │   ├── src/             # Source code
│   │   ├── test/            # Tests
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
```

## Publishing

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

**Fixed Versioning**: All packages in this monorepo are configured to publish at the same version. When you create a changeset, both packages will be bumped to the same version number, ensuring version consistency across the monorepo.

### Creating a Changeset

When you make changes that should be published:

```bash
pnpm run changeset
```

Follow the prompts to:
1. Select which packages have changed
2. Choose the version bump type (major, minor, patch)
3. Write a summary of the changes

### Versioning Packages

To update package versions based on changesets:

```bash
pnpm run version-packages
```

This will:
- Update package.json versions
- Update dependencies between packages
- Generate CHANGELOG.md files

### Publishing to npm

```bash
pnpm run release
```

This will:
1. Build all packages
2. Publish changed packages to npm
3. Create git tags for the releases

## Scripts Reference

| Script | Description |
|--------|-------------|
| \`pnpm run build\` | Build all packages |
| \`pnpm run build:diblob\` | Build diblob package only |
| \`pnpm run build:mcp\` | Build diblob-mcp package only |
| \`pnpm run build:visualizer\` | Build visualizer package only |
| \`pnpm test\` | Run tests for all packages |
| \`pnpm run test:watch\` | Run tests in watch mode |
| \`pnpm run dev:visualizer\` | Start visualizer dev server |
| \`pnpm run dev:mcp\` | Start MCP server in dev mode |
| \`pnpm run docs:dev\` | Start documentation dev server |
| \`pnpm run docs:build\` | Build documentation site |
| \`pnpm run docs:preview\` | Preview built documentation |
| \`pnpm run clean\` | Remove all build outputs and node_modules |
| \`pnpm run changeset\` | Create a new changeset |
| \`pnpm run version-packages\` | Update versions from changesets |
| \`pnpm run release\` | Build and publish packages |

## Contributing

1. Make your changes
2. Add tests if applicable
3. Run \`pnpm test\` to ensure tests pass
4. Run \`pnpm run build\` to ensure builds succeed
5. Create a changeset: \`pnpm run changeset\`
6. Commit your changes including the changeset file

## License

MIT - See LICENSE file in each package for details

## Links

- [diblob Documentation](https://speajus.github.io/diblob/)
- [GitHub Repository](https://github.com/speajus/diblob)
- [npm - @speajus/diblob](https://www.npmjs.com/package/@speajus/diblob)
- [npm - @speajus/diblob-connect](https://www.npmjs.com/package/@speajus/diblob-connect)
- [npm - @speajus/diblob-logger](https://www.npmjs.com/package/@speajus/diblob-logger)
- [npm - @speajus/diblob-mcp](https://www.npmjs.com/package/@speajus/diblob-mcp)
- [npm - @speajus/diblob-svelte](https://www.npmjs.com/package/@speajus/diblob-svelte)
- [npm - @speajus/diblob-testing](https://www.npmjs.com/package/@speajus/diblob-testing)
- [npm - @speajus/diblob-visualizer](https://www.npmjs.com/package/@speajus/diblob-visualizer)
