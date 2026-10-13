# Contributing to Hexal

Thank you for your interest in contributing to Hexal! This document provides guidelines and information for contributors.

## How to Contribute

### Reporting Bugs

Before submitting a bug report:
1. Check the [existing issues](https://github.com/ringo380/hexal/issues) to avoid duplicates
2. Use the bug report template when creating a new issue
3. Include as much detail as possible:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Your OS and Hexal version

### Suggesting Features

1. Check existing issues and discussions for similar suggestions
2. Use the feature request template
3. Clearly describe the use case and expected behavior

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes following the code style guidelines
4. Test your changes thoroughly
5. Commit with clear, descriptive messages
6. Push to your fork and submit a pull request

## Development Setup

Requires Node.js 22 or later. Development works on Windows, macOS, and Linux.

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/hexal.git
cd hexal

# Install dependencies
npm ci

# Start the Vite dev server and Electron
npm run dev
```

### Before opening a pull request

```bash
npx tsc --noEmit    # Type check
npm test            # Unit tests (Vitest)
npm run build       # Production build for your platform
```

If you change UI that appears on the website, regenerate the screenshots with
`npm run screenshots` while `npm run dev` is running. The script reports any
screen it could not open instead of capturing the wrong one.

## Code Style Guidelines

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components focused and modular

### File Organization

- Components go in `src/components/`, grouped by feature in subfolders
- State management in `src/stores/`
- Logic and utility functions in `src/services/`
- Type definitions in `src/types/`, one file per domain
- Styles in `src/styles/`
- Electron main process code in `electron/`; tests for its helpers sit beside them as `*.test.ts`

## Commit Messages

Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example: `feat: add weather simulation system`

## Questions?

Feel free to open an issue for any questions about contributing.
