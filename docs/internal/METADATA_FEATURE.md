# Metadata Feature

## Overview

Added optional metadata support to both `createBlob` and `createContainer` functions in the diblob package. This feature allows developers to attach custom metadata (like descriptions, tags, creation timestamps, or other contextual information) to blobs and containers for debugging and visualization purposes.

## Changes Made

### 1. Core Types (`packages/diblob/src/types.ts`)
- Added `BlobMetadata` interface with optional `name`, `description`, and custom properties

### 2. Blob Module (`packages/diblob/src/blob.ts`)
- Renamed `blobMetadata` WeakMap to `blobIds` for clarity
- Added new `blobMetadataStore` WeakMap to store blob metadata
- Updated `createBlob` function signature to accept optional `metadata` parameter
- Added `getBlobMetadata` function to retrieve metadata for a blob

### 3. Container Module (`packages/diblob/src/container.ts`)
- Added `containerMetadataStore` WeakMap to store container metadata
- Updated `Container` constructor to accept optional `metadata` parameter
- Updated `createContainer` function with overloaded signatures to support metadata as first parameter
- Added `getContainerMetadata` function to retrieve metadata for a container

### 4. Exports (`packages/diblob/src/index.ts`)
- Exported `getBlobMetadata` and `getContainerMetadata` functions
- Exported `BlobMetadata` type

### 5. Visualizer (`packages/diblob-visualizer/src/lib/container-introspection.ts`)
- Updated `BlobNode` interface to include optional `metadata` field
- Updated `extractDependencyGraph` to extract and include blob metadata
- Updated `createBlobLabel` to use metadata name if available

## API Usage

### Creating Blobs with Metadata

```typescript
import { createBlob, getBlobMetadata } from '@speajus/diblob';

// Without metadata (backward compatible)
const logger = createBlob<Logger>();

// With metadata
const userService = createBlob<UserService>('userService', {
  name: 'User Service',
  description: 'Handles user-related operations',
  version: '1.0.0',
  tags: ['business', 'core']
});

// Retrieve metadata
const metadata = getBlobMetadata(userService);
console.log(metadata?.name); // "User Service"
```

### Creating Containers with Metadata

```typescript
import { createContainer, getContainerMetadata } from '@speajus/diblob';

// Without metadata (backward compatible)
const container = createContainer();

// With metadata
const appContainer = createContainer({
  name: 'Application Container',
  description: 'Main DI container',
  environment: 'production'
});

// With metadata and parents
const childContainer = createContainer(
  { name: 'Child Container' },
  parentContainer
);

// Retrieve metadata
const metadata = getContainerMetadata(appContainer);
console.log(metadata?.name); // "Application Container"
```

## Backward Compatibility

✅ **Fully backward compatible** - All existing code continues to work without modification:
- The `metadata` parameter is completely optional
- All existing function signatures remain valid
- No breaking changes to the API
- All 90 existing tests pass without modification

## Testing

Added comprehensive test suite (`packages/diblob/test/metadata.test.ts`) with 9 new tests:
- Blob metadata creation and retrieval
- Container metadata creation and retrieval
- Custom metadata properties
- Metadata with parent containers
- Backward compatibility verification

**Test Results:** 99/99 tests passing (90 original + 9 new)

## Example

See `packages/diblob/examples/metadata-demo.ts` for a complete working example demonstrating:
- Creating blobs with rich metadata
- Creating containers with metadata
- Retrieving and displaying metadata
- Using metadata for debugging and documentation

## Benefits

1. **Better Debugging**: Attach descriptive names and information to blobs for easier identification
2. **Visualization**: The diblob-visualizer can now display meaningful names and descriptions
3. **Documentation**: Metadata serves as inline documentation for your DI setup
4. **Flexibility**: Store any custom properties you need (version, tags, author, etc.)
5. **Zero Breaking Changes**: Completely optional and backward compatible

## Implementation Details

- Metadata is stored in WeakMaps, ensuring no memory leaks
- Metadata is associated with the blob/container instance, not the registration
- Metadata persists throughout the blob/container lifecycle
- The visualizer can access metadata through the public `getBlobMetadata` function

