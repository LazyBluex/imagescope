# ImageScope

**English** | [中文](#中文)

A lightweight VS Code extension for viewing and analyzing images with precision pixel-level inspection, zoom, pan, ROI selection, and histogram analysis.

## Features

### 🔍 Image Viewer
- Open local image files (PNG, JPEG, GIF, BMP, WebP, TIFF, ICO, SVG)
- **Default image viewer** for supported formats in VS Code
- Smooth zoom and pan with multiple zoom levels: 10%, 25%, 50%, 100%, 200%, 500%, 1000%

### 🎯 Pixel Inspector
- Real-time pixel information on mouse hover
- Display coordinates (X, Y) and pixel values (R, G, B, A)
- HEX color code conversion
- Works across all zoom levels

### 📐 Pixel Grid
- Automatic pixel grid overlay at high zoom levels (≥ 800%)
- View individual pixel coordinates and values in grid format
- Grid visibility automatically adapts to zoom level

### 📊 ROI & Histogram
- **ROI Selection**: Click and drag to select regions of interest
- **ROI Statistics**: Display width, height, pixel count, mean, and standard deviation
- **Histogram Analysis**: View RGB and grayscale histograms
- **Channel Viewer**: Switch between individual color channels (R, G, B, A)
- Adjustable ROI color and fill color

### ⌨️ Keyboard Shortcuts
- **Zoom**: `Ctrl + Wheel` (Windows/Linux) or `Cmd + Wheel` (macOS)
- **Pan**: Middle mouse button drag or `Space + Left mouse drag`
- **ROI Clear**: Click the clear button in the sidebar

## Getting Started

### Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "ImageScope"
4. Click Install

### Usage

**Open an image:**
- Right-click an image file in Explorer → "ImageScope: Open Image"
- Or use Command Palette: `Ctrl+Shift+P` → "ImageScope: Open Image"

**View pixel data:**
- Hover your mouse over the image to see real-time pixel coordinates and values

**Select a region:**
- Click and drag to create an ROI rectangle
- View statistics in the right sidebar

**Adjust settings:**
- Use VS Code Settings (`Ctrl+,`) to customize:
  - `imagescope.pixelGrid.maxVisiblePixels`: Toggle pixel grid visibility threshold
  - `imagescope.roi.color`: ROI border color (hex, e.g., `#4CAF50`)
  - `imagescope.roi.fillColor`: ROI fill color with transparency (e.g., `#4CAF5010`)

## Keyboard Shortcuts

### Navigation & Zoom
| Shortcut | Action |
|----------|--------|
| `Scroll Wheel` | Zoom in/out |
| `Ctrl + +` | Zoom in (center) |
| `Ctrl + -` | Zoom out (center) |
| `Ctrl + 0` | Fit to window |
| `Double Click` | Toggle 100% / Fit to window |
| `Left Mouse Drag` | Pan |
| `Middle Mouse Drag` | Pan |
| `Space + Left Drag` | Pan (even in ROI mode) |
| `Ctrl + Left Drag` | Box select & zoom to selection |

### Pixel & ROI
| Shortcut | Action |
|----------|--------|
| `Alt + Left Click` | Copy pixel color to clipboard |
| `R` / `r` | Toggle ROI mode |
| `G` / `g` | Toggle pixel grid (visible at ≥ 800% zoom) |

### Analysis & View
| Shortcut | Action |
|----------|--------|
| `H` / `h` | Toggle histogram |
| `1` | RGB channels |
| `2` | Red channel only |
| `3` | Green channel only |
| `4` | Blue channel only |
| `5` | Alpha channel only |

### Display Options
| Shortcut | Action |
|----------|--------|
| `D` / `d` | Toggle grayscale mode |
| `X` / `x` | Toggle crosshair |
| `B` / `b` | Cycle background (checkerboard/white/black/gray) |
| `M` / `m` | Toggle minimap |
| `L` / `l` | Toggle measurement tool |

### Transforms
| Shortcut | Action |
|----------|--------|
| `F` / `f` | Flip horizontal |
| `Shift + F` | Flip vertical |
| `N` / `n` | Rotate 90° clockwise |

## Configuration

```json
{
  "imagescope.pixelGrid.maxVisiblePixels": 32,
  "imagescope.roi.color": "#4CAF50",
  "imagescope.roi.fillColor": "#4CAF5010"
}
```

## Known Limitations

- **Multi-split viewing**: Opening the same image in multiple editor splits will show the image in only one split at a time. As a workaround, you can open the image in a separate window.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

---

## 中文

一个轻量级的 VS Code 扩展，用于查看和分析图像，提供精确的像素级检查、缩放、平移、ROI 选择和直方图分析功能。

## 功能

### 🔍 图像查看器
- 打开本地图像文件（PNG、JPEG、GIF、BMP、WebP、TIFF、ICO、SVG）
- **VS Code 默认图像查看器**
- 流畅的缩放和平移，支持多种缩放级别：10%、25%、50%、100%、200%、500%、1000%

### 🎯 像素检查器
- 鼠标悬停时实时显示像素信息
- 显示坐标（X、Y）和像素值（R、G、B、A）
- HEX 颜色代码转换
- 在所有缩放级别都可用

### 📐 像素网格
- 高缩放级别（≥ 800%）时自动显示像素网格
- 在网格中查看单个像素的坐标和数值
- 网格可见性自动适应缩放级别

### 📊 ROI & 直方图
- **ROI 选择**：点击并拖动来选择感兴趣区域
- **ROI 统计**：显示宽度、高度、像素数、均值和标准差
- **直方图分析**：查看 RGB 和灰度直方图
- **通道查看器**：在各个颜色通道（R、G、B、A）之间切换
- 可调整 ROI 边框颜色和填充颜色

### ⌨️ 快捷键
- **缩放**：`Ctrl + 滚轮` (Windows/Linux) 或 `Cmd + 滚轮` (macOS)
- **平移**：中键拖动或 `Space + 左键拖动`
- **清除 ROI**：点击侧边栏的清除按钮

## 快速开始

### 安装

1. 打开 VS Code
2. 进入扩展程序（`Ctrl+Shift+X` / `Cmd+Shift+X`）
3. 搜索 "ImageScope"
4. 点击安装

### 使用

**打开图像：**
- 在资源管理器中右键单击图像文件 → "ImageScope: Open Image"
- 或使用命令面板：`Ctrl+Shift+P` → "ImageScope: Open Image"

**查看像素数据：**
- 将鼠标悬停在图像上以实时查看像素坐标和数值

**选择区域：**
- 点击并拖动创建 ROI 矩形
- 在右侧边栏查看统计信息

**调整设置：**
- 使用 VS Code 设置（`Ctrl+,`）自定义：
  - `imagescope.pixelGrid.maxVisiblePixels`：像素网格可见性阈值
  - `imagescope.roi.color`：ROI 边框颜色（十六进制，例如 `#4CAF50`）
  - `imagescope.roi.fillColor`：ROI 填充颜色（例如 `#4CAF5010`）

## 快捷键

### 导航 & 缩放
| 快捷键 | 操作 |
|--------|------|
| `滚轮` | 放大/缩小 |
| `Ctrl + +` | 放大（中心） |
| `Ctrl + -` | 缩小（中心） |
| `Ctrl + 0` | 缩放到窗口 |
| `双击` | 切换 100% / 缩放到窗口 |
| `左键拖动` | 平移 |
| `中键拖动` | 平移 |
| `Space + 左键拖动` | 平移（在 ROI 模式下也可用） |
| `Ctrl + 左键拖动` | 框选放大 |

### 像素 & ROI
| 快捷键 | 操作 |
|--------|------|
| `Alt + 左键点击` | 复制像素颜色到剪贴板 |
| `R` / `r` | 切换 ROI 模式 |
| `G` / `g` | 切换像素网格（放大 ≥ 800% 时显示） |

### 分析 & 查看
| 快捷键 | 操作 |
|--------|------|
| `H` / `h` | 切换直方图 |
| `1` | RGB 通道 |
| `2` | 仅红色通道 |
| `3` | 仅绿色通道 |
| `4` | 仅蓝色通道 |
| `5` | 仅 Alpha 通道 |

### 显示选项
| 快捷键 | 操作 |
|--------|------|
| `D` / `d` | 切换灰度模式 |
| `X` / `x` | 切换十字线 |
| `B` / `b` | 循环背景（棋盘格/白色/黑色/灰色） |
| `M` / `m` | 切换小地图 |
| `L` / `l` | 切换测量工具 |

### 变换
| 快捷键 | 操作 |
|--------|------|
| `F` / `f` | 水平翻转 |
| `Shift + F` | 垂直翻转 |
| `N` / `n` | 顺时针旋转 90° |

## 配置

```json
{
  "imagescope.pixelGrid.maxVisiblePixels": 32,
  "imagescope.roi.color": "#4CAF50",
  "imagescope.roi.fillColor": "#4CAF5010"
}
```

## 已知限制

- **多窗口查看同一图像**：在多个编辑器分割中打开同一个图像时，图像只会显示在其中一个分割中。作为解决方案，您可以在单独的窗口中打开图像。

## 贡献

欢迎贡献！请随时提交问题和拉取请求。

## 许可证

MIT
