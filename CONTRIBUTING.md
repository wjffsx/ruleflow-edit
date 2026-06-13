# Contributing to RuleFlow Editor

Thank you for your interest in contributing to RuleFlow Editor! This guide will help you get started.

## Development Setup

### Prerequisites

- **Node.js** >= 18.0
- **npm** >= 9.0

### Getting Started

1. **Fork & Clone** — Fork this repository to your account, then clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ruleflow-edit.git
   cd ruleflow-edit
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the dev server**:
   ```bash
   npm run dev
   ```

4. **Open** `http://localhost:5173` in your browser.

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and ensure they pass all checks:
   ```bash
   npm run typecheck   # TypeScript type checking
   npm run lint        # ESLint
   npm run test        # Vitest
   npm run build       # Production build
   ```

3. **Commit** following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add xxx node type
   fix: resolve edge drag offset issue
   docs: update README
   refactor: extract shared logic from BaseNode
   test: add validation for node registry
   chore: update dependencies
   ```

4. **Push** and open a Pull Request against `main`.

## Code Style

- **Components**: One component per file, export named function components
- **Styling**: Use Design Tokens (CSS custom properties), avoid hardcoded colors and values
- **State management**: Global state via `@preact/signals`, local state via Preact hooks
- **Internationalization**: All user-visible text must go through the `t()` function, with entries in `src/i18n/index.ts`
- **TypeScript**: Strict mode enabled, avoid `any` where possible
- **Accessibility**: Add `aria-label` and `role` attributes to interactive elements

## Adding a New Node Type

1. Add the node entry to the appropriate category in `src/data/nodeData.ts` (`NODE_CATEGORIES`)
2. Add the type-to-visual mapping in `src/data/nodeMappings.ts` (`NODE_VISUAL_MAP`)
3. Import and register the Lucide icon in `src/data/iconRegistry.ts`
4. If a new visual style is needed, add color and icon mapping in `src/components/nodes/BaseNode.ts`

## Reporting Issues

- Use the [Bug Report](https://github.com/wjffsx/ruleflow-edit/issues/new?template=bug_report.yml) template
- Describe reproduction steps, expected behavior, and actual behavior
- Include browser version and OS information
- Attach screenshots or recordings if possible

## Pull Request Guidelines

- Keep PRs focused on a single concern
- Include a clear description of the change and motivation
- Reference related issues (e.g., `Closes #123`)
- Ensure all CI checks pass before requesting review

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
