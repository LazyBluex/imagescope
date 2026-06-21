# Changelog

All notable changes to the ImageScope extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-21

### Added

- Initial release of ImageScope
- Support for opening local image files (PNG, JPEG, GIF, BMP, WebP, TIFF, ICO, SVG)
- Image viewer as default handler for supported image formats
- Zoom functionality with multiple preset levels (10%, 25%, 50%, 100%, 200%, 500%, 1000%)
- Mouse wheel zoom (`Ctrl + Wheel`)
- Pan functionality with middle mouse button drag or `Space + Left mouse drag`
- Pixel Inspector showing real-time pixel coordinates and values (R, G, B, A, HEX)
- Pixel Grid overlay at high zoom levels (≥ 800%)
- ROI (Region of Interest) selection with statistics (width, height, mean, std)
- Histogram analysis with RGB and grayscale channels
- Channel viewer for individual color channels
- Configurable ROI colors and pixel grid thresholds via settings
- Toolbar with zoom controls and color customization
- Right sidebar with ROI statistics and histogram panels

### Known Limitations

- Cannot open the same image in multiple editor splits simultaneously (VS Code CustomReadonlyEditorProvider API limitation)

### Technologies Used

- TypeScript
- VS Code Extension API
- Svelte 5
- Vite
- Canvas 2D API
