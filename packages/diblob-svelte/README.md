# @speajus/diblob-svelte

Svelte 5 integration helpers for [diblob](https://github.com/speajus/diblob).

This package provides small utilities to make it easy to use a diblob
`Container` in a Svelte application:

- `provideContainerContext(container)` – store a diblob container in Svelte
  context from a top-level component.
- `useContainer()` – access the current container from within a component.
- `useBlob(blob)` – resolve a blob from the current container.
- `attachContainerDisposal(container)` – dispose the container when the
  component owning it is destroyed.

These helpers are designed to follow existing diblob patterns (blob
registration functions, explicit container lifetimes) while fitting into the
Svelte 5 component model.

