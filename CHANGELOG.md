# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-14

### Added
- Initial RuleFlow Editor with Preact + LogicFlow
- TypeScript strict mode with comprehensive type declarations
- Runtime validation utilities (safeJsonParse, safeReadStorage, etc.)
- i18n support (zh/en)
- Theme system (light/dark/system)
- Debug simulation panel
- Canvas with drag-drop node creation
- Sidebar with categorized node palette
- Properties panel with node configuration
- CI/CD pipeline (GitHub Actions, Node 18/20/22)
- ESLint + Prettier + Vitest configuration
- Library public API entry (src/index.ts) with CJS + ESM dual output
- Event type interfaces for LogicFlow callbacks (NodeClickEvent, EdgeAddEvent, etc.)
- @changesets/cli for version management
- Husky + lint-staged pre-commit hooks
- RuleFlowError standard error class used in critical failure paths

### Changed
- Framework dependencies (preact, @preact/signals, @logicflow/core, @logicflow/extension, lucide-preact) moved to peerDependencies only
- Event handlers in useLogicFlowEvents.ts now use typed event interfaces instead of `any`
- Drag-drop logic extracted from CanvasViewport into useDragDrop hook
- Edge relations extracted from PropertiesTab into EdgeRelations component
- All JSDoc comments unified to English
- Canvas internal UI control functions consolidated into canvasActions.ts

### Fixed
- `react-hot-toast` depends on React and requires `resolve.alias` mapping to preact/compat.
  This is acceptable for the current package. If publishing as a public library,
  consider replacing with a preact-native toast solution to eliminate the React dependency.
