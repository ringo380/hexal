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

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/hexal.git
cd hexal/hexal-electron

# Install dependencies
npm install

# Start development server
npm run dev
```

## Code Style Guidelines

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components focused and modular

### File Organization

- Components go in `src/components/`
- State management in `src/stores/`
- Utility functions in `src/services/`
- Type definitions in `src/types/`
- Styles in `src/styles/`

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
