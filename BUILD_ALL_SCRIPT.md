# Build All Script

## Overview

A `build:all` script has been added to all packages in the monorepo. This script builds all packages in the correct dependency order, regardless of which package you're currently in.

## Usage

### From the root directory:
```bash
pnpm run build:all
```

### From any package directory:
```bash
cd packages/diblob-connect
pnpm run build:all
```

Both commands will build all packages in the following order:
1. `@speajus/diblob` (core package)
2. `@speajus/diblob-mcp`
 3. `@speajus/diblob-connect`
4. `@speajus/diblob-drizzle`
5. `@speajus/diblob-visualizer`

## Benefits

- **Consistency**: Same command works from any location in the monorepo
- **Dependency Order**: Builds packages in the correct order to ensure dependencies are available
- **Convenience**: No need to remember which package you're in or navigate to the root
- **CI/CD Ready**: Can be used in continuous integration pipelines

## Implementation

The script is defined in each package's `package.json`:

```json
{
  "scripts": {
    "build:all": "pnpm --filter @speajus/diblob build && pnpm --filter @speajus/diblob-mcp build && pnpm --filter @speajus/diblob-connect build && pnpm --filter @speajus/diblob-drizzle build && pnpm --filter @speajus/diblob-visualizer build"
  }
}
```

## Packages Updated

- ✅ Root `package.json`
- ✅ `packages/diblob/package.json`
- ✅ `packages/diblob-mcp/package.json`
- ✅ `packages/diblob-connect/package.json`
- ✅ `packages/diblob-drizzle/package.json`
- ✅ `packages/diblob-visualizer/package.json`

## Related Scripts

- `pnpm run build` - Build all packages (root only)
- `pnpm run build:diblob` - Build only the core package
- `pnpm run build:mcp` - Build only the MCP package
- `pnpm run build:grpc` - Build only the gRPC package
- `pnpm run build:drizzle` - Build only the Drizzle package
- `pnpm run build:visualizer` - Build only the visualizer package

