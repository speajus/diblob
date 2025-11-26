# `@speajus/diblob-svelte`

Svelte 5 integration helpers for diblob containers.

`@speajus/diblob-svelte` makes it easy to use a diblob `Container` inside a
Svelte application by wiring the container through Svelte context.

## Installation

```bash
pnpm add @speajus/diblob-svelte @speajus/diblob svelte
```

Requires Svelte 5 and Node.js >= 22.

## Core helpers

- `provideContainerContext(container)` – store a diblob container in Svelte
  context from a top-level component.
- `useContainer()` – retrieve the current container from context.
- `useBlob(blob)` – resolve a blob from the current container.
- `attachContainerDisposal(container)` – ensure the container is disposed when
  the owning component is destroyed.

## Basic usage

In a root layout or top-level component:

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createContainer } from '@speajus/diblob';
  import {
    provideContainerContext,
    attachContainerDisposal,
  } from '@speajus/diblob-svelte';

  const container = createContainer();

  provideContainerContext(container);
  attachContainerDisposal(container);
</script>

<slot />
```

In a child component that needs a blob:

```svelte
<script lang="ts">
  import { useBlob } from '@speajus/diblob-svelte';
  import { userGateway } from '../diblob/blobs.js';

  const gateway = useBlob(userGateway);

  $: usersPromise = gateway.fetchUsers();
</script>

{#await usersPromise}
  <p>Loading...</p>
{:then users}
  <ul>
    {#each users as user}
      <li>{user.name}</li>
    {/each}
  </ul>
{:catch error}
  <p class="error">{String(error)}</p>
{/await}
```

## Patterns

- Keep blob definitions and registration functions in separate modules
  (`diblob/blobs.ts`, `diblob/register.ts`).
- Create the container at the application boundary (layout, root component).
- Use `attachContainerDisposal` so long-lived resources are cleaned up when
  navigation or hot-reload tears down the root component.

For more complex setups, combine this with `@speajus/diblob-config` for typed
configuration and `@speajus/diblob-telemetry` for telemetry.

