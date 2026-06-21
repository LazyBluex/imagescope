# Contributing to ImageScope

Thank you for your interest in contributing to ImageScope! Here's how you can help.

## Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/imagescope.git
   cd imagescope
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Open in VS Code and start developing
   ```bash
   code .
   ```

## Development

### Running the Extension

1. Press `F5` in VS Code to launch the Extension Development Host
2. Open an image file to test the extension

### Building

```bash
# Development build with type checking and linting
npm run compile

# Watch mode for active development
npm run watch

# Production build
npm run package
```

### Testing

Currently, manual testing is performed. To test the extension:

1. Open various image formats (PNG, JPEG, GIF, BMP, WebP, TIFF, ICO, SVG)
2. Test zoom and pan functionality
3. Test pixel inspector with hover
4. Test ROI selection and statistics
5. Test histogram viewing with different channels

## Code Structure

```
imagescope/
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── commands/             # Command handlers
│   ├── panels/               # Webview panel management
│   ├── webview/              # Svelte components
│   └── content.ts            # Webview content generation
├── webview/
│   ├── app.svelte            # Main viewer component
│   ├── toolbar.svelte        # Toolbar component
│   └── sidebar.svelte        # Sidebar component
└── package.json              # Extension manifest
```

## Making Changes

1. Create a new branch for your feature or fix
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test thoroughly

3. Commit with clear, descriptive messages
   ```bash
   git commit -m "feat: add your feature description"
   ```

4. Push to your fork and create a Pull Request

## Reporting Issues

When reporting issues, please include:

- VS Code version
- Extension version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable

## Style Guide

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components focused and single-responsibility

## Licensing

By contributing to ImageScope, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing!
