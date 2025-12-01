# @speajus/diblob-logger

## 2.0.0

### Patch Changes

- f252d82: Mad oauth more good, and workie
- Updated dependencies [cfc4b57]
- Updated dependencies [f252d82]
  - @speajus/diblob-config@2.0.0
  - @speajus/diblob@2.0.0

## 1.0.1

### Patch Changes

- 121a43b: added telemetry
  - @speajus/diblob@1.0.1

## 1.0.0

### Minor Changes

- abc91a9: refactored fixed linted and removed @speajus/diblob-drizzle

### Patch Changes

- e0c6720: added stuff
- 3b52ef8: Added dispose for container
- d313a61: fix version
- Updated dependencies [abc91a9]
- Updated dependencies [4a8e069]
- Updated dependencies [3b52ef8]
- Updated dependencies [182cdac]
- Updated dependencies [d313a61]
  - @speajus/diblob@1.0.0

## Unreleased

- Add a separate `loggerLokiConfig` blob and make `registerLoggerBlobs` accept an optional Loki config argument. The logger now reads Loki settings from this blob instead of the main `LoggerConfig`, allowing Loki configuration to be provided independently (no coupling to telemetry).

### Added

- Optional Loki transport via `winston-loki` when `loggerConfig.loki.host` is set.
