<script lang="ts">
  import { onMount } from "svelte";
  import { imageInfo, vscode } from "./vscode";
  import Toolbar from "./Toolbar.svelte";
  import Sidebar from "./Sidebar.svelte";

  // --- Types ---
  interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
  }

  // --- Constants ---
  const ZOOM_FACTOR = 1.15;
  const BOUNDARY_MARGIN = 100;

  /** Dynamic zoom limits: min = image ~1px, max = viewport shows ~1 image pixel */
  function getMinScale(): number {
    if (!loaded || !container) return 0.01;
    return Math.min(1 / naturalWidth, 1 / naturalHeight, 0.001);
  }

  function getMaxScale(): number {
    if (!loaded || !container) return 1000;
    const rect = container.getBoundingClientRect();
    return Math.max(rect.width, rect.height) * 2;
  }

  /** Zoom presets adapt to the current image and viewport */
  function getZoomPresets(): number[] {
    if (!loaded) return [0.1, 0.25, 0.5, 1, 2, 5, 10];
    const min = getMinScale();
    const max = getMaxScale();
    const candidates = [
      0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 4, 5, 8, 10, 16,
      25, 50, 100, 200, 500, 1000,
    ];
    return candidates.filter((p: number) => p >= min * 0.9 && p <= max * 1.1);
  }

  // --- Reactive state ---
  let scale = $state(1);
  let offsetX = $state(0);
  let offsetY = $state(0);
  let naturalWidth = $state(0);
  let naturalHeight = $state(0);
  let isPanning = $state(false);
  let loaded = $state(false);
  let spaceHeld = $state(false);
  let pixelGridEnabled = $state(false);
  let grayscaleMode = $state(false);
  let crosshairEnabled = $state(false);
  let bgMode = $state<"checkerboard" | "white" | "black" | "gray">(
    "checkerboard",
  );
  let flipH = $state(false);
  let flipV = $state(false);
  let rotation = $state<0 | 90 | 180 | 270>(0);
  let minimapEnabled = $state(false);
  let copyFeedback = $state("");
  let measureEnabled = $state(false);
  let channelView = $state<"rgb" | "r" | "g" | "b" | "a">("rgb");

  // Measure tool (non-reactive coords, reactive trigger)
  let isMeasuring = false;
  let measStartX = 0;
  let measStartY = 0;
  let measEndX = 0;
  let measEndY = 0;
  let measureVersion = $state(0);

  // Pixel Inspector
  let pixelX = $state(-1);
  let pixelY = $state(-1);
  let pixelColor = $state<RGBA | null>(null);

  // Selection box zoom (non-reactive coords, reactive trigger)
  let isSelecting = false;
  let selStartX = 0;
  let selStartY = 0;
  let selEndX = 0;
  let selEndY = 0;
  let selectionVersion = $state(0);

  // ROI selection
  let roiEnabled = $state(false);
  let isRoiDragging = false;
  let roiStartX = 0;
  let roiStartY = 0;
  let roiEndX = 0;
  let roiEndY = 0;
  let roiVersion = $state(0);
  let roiHasSelection = $state(false);
  // Normalized image-pixel rect (set on mouseup)
  let roiImgX = 0;
  let roiImgY = 0;
  let roiImgW = 0;
  let roiImgH = 0;

  interface RoiStats {
    width: number;
    height: number;
    pixelCount: number;
    mean: { r: number; g: number; b: number; a: number };
    std: { r: number; g: number; b: number; a: number };
    min: { r: number; g: number; b: number; a: number };
    max: { r: number; g: number; b: number; a: number };
  }
  let roiStats = $state<RoiStats | null>(null);

  // Histogram
  type HistChannel = "all" | "gray" | "r" | "g" | "b";
  let histogramEnabled = $state(false);
  let histogramChannel = $state<HistChannel>("all");
  let histCanvas = $state<HTMLCanvasElement | undefined>();

  interface HistogramData {
    gray: Uint32Array;
    r: Uint32Array;
    g: Uint32Array;
    b: Uint32Array;
  }
  let histogramData = $state<HistogramData | null>(null);

  // --- Non-reactive refs ---
  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  let img: HTMLImageElement;
  let imageData: ImageData | null = null;
  let panStartX = 0;
  let panStartY = 0;

  // --- Derived ---
  let zoomPercent = $derived(Math.round(scale * 100));

  let isOnPreset = $derived(
    getZoomPresets().some((p: number) => Math.abs(p - scale) < 0.001),
  );

  let cursorStyle = $derived.by(() => {
    if (isSelecting || isRoiDragging) return "crosshair";
    if (isPanning) return "grabbing";
    if (spaceHeld) return "grab";
    return "crosshair";
  });

  let pixelHex = $derived.by(() => {
    if (!pixelColor) return "--";
    const hex = (v: number) => v.toString(16).padStart(2, "0").toUpperCase();
    const base = `#${hex(pixelColor.r)}${hex(pixelColor.g)}${hex(pixelColor.b)}`;
    return pixelColor.a === 255 ? base : `${base}${hex(pixelColor.a)}`;
  });

  let roiStrokeColor = $derived(imageInfo.roiColor || "#4CAF50");
  let roiFillColor = $derived(imageInfo.roiFillColor || "#4CAF5010");

  let statusText = $derived.by(() => {
    if (!loaded) return "";
    const parts: string[] = [];
    if (pixelX >= 0 && pixelY >= 0) {
      parts.push(`X: ${pixelX}  Y: ${pixelY}`);
      if (pixelColor) {
        parts.push(
          `R: ${pixelColor.r}  G: ${pixelColor.g}  B: ${pixelColor.b}  A: ${pixelColor.a}`,
        );
        parts.push(pixelHex);
      }
    }
    parts.push(`${naturalWidth} × ${naturalHeight} px`);
    if (imageInfo.format) parts.push(imageInfo.format.toUpperCase());
    if (imageInfo.fileSize > 0) parts.push(formatFileSize(imageInfo.fileSize));
    return parts.join("  |  ");
  });

  // --- Helpers ---
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  // --- Canvas rendering ---
  function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (bgMode === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    } else if (bgMode === "black") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
    } else if (bgMode === "gray") {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);
    } else {
      // checkerboard
      const tileSize = 10;
      for (let y = 0; y < h; y += tileSize) {
        for (let x = 0; x < w; x += tileSize) {
          const isEven =
            (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
          ctx.fillStyle = isEven ? "#2a2a2a" : "#333333";
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
  }

  // Copy pixel color to clipboard
  function copyPixelColor() {
    if (!loaded || !pixelColor) return;
    const hex = pixelHex;
    const rgb = `rgb(${pixelColor.r}, ${pixelColor.g}, ${pixelColor.b})`;
    const text = `${hex}  ${rgb}`;
    navigator.clipboard.writeText(text).then(() => {
      copyFeedback = `Copied: ${text}`;
      setTimeout(() => {
        copyFeedback = "";
      }, 1500);
    });
  }

  // Draw crosshair lines at mouse position
  function drawCrosshair(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
  ) {
    if (!crosshairEnabled || pixelX < 0 || pixelY < 0) return;
    const sx = Math.round(pixelX * scale + offsetX + scale / 2) + 0.5;
    const sy = Math.round(pixelY * scale + offsetY + scale / 2) + 0.5;
    if (sx < 0 || sx > cw || sy < 0 || sy > ch) return;

    // Shadow layer (dark, visible on bright images)
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, ch);
    ctx.moveTo(0, sy);
    ctx.lineTo(cw, sy);
    ctx.stroke();

    // Foreground layer (white, visible on dark images)
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, ch);
    ctx.moveTo(0, sy);
    ctx.lineTo(cw, sy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw minimap overview
  function drawMinimap(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    if (!minimapEnabled || !loaded) return;
    const mmW = 120;
    const mmH = Math.round(mmW * (naturalHeight / naturalWidth));
    const mmX = cw - mmW - 8;
    const mmY = ch - mmH - 8;

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(mmX - 1, mmY - 1, mmW + 2, mmH + 2);
    ctx.drawImage(img, mmX, mmY, mmW, mmH);

    // Viewport rectangle
    const vx = mmX + (-offsetX / scale) * (mmW / naturalWidth);
    const vy = mmY + (-offsetY / scale) * (mmH / naturalHeight);
    const vw = (cw / scale) * (mmW / naturalWidth);
    const vh = (ch / scale) * (mmH / naturalHeight);
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      Math.max(mmX, vx),
      Math.max(mmY, vy),
      Math.min(vw, mmW),
      Math.min(vh, mmH),
    );
  }

  /**
   * Pick black or white text for maximum readability on the given background.
   * Uses YIQ perceptual brightness with threshold 150 (biased toward white).
   */
  function contrastTextColor(r: number, g: number, b: number): string {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150 ? "#000000" : "#ffffff";
  }

  // Draw measurement line with distance and angle
  function drawMeasure(ctx: CanvasRenderingContext2D) {
    if (!isMeasuring && measureVersion === 0) return;
    if (!isMeasuring && !measureEnabled) return;
    const dx = measEndX - measStartX;
    const dy = measEndY - measStartY;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
    const midX = (measStartX + measEndX) / 2;
    const midY = (measStartY + measEndY) / 2;

    // Line
    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(measStartX, measStartY);
    ctx.lineTo(measEndX, measEndY);
    ctx.stroke();

    // Endpoints
    ctx.fillStyle = "#ff9800";
    ctx.beginPath();
    ctx.arc(measStartX, measStartY, 4, 0, Math.PI * 2);
    ctx.arc(measEndX, measEndY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Distance label
    const imgDist = dist / scale;
    const label = `${imgDist.toFixed(1)}px  ${angle.toFixed(1)}°`;
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(midX - tw / 2 - 4, midY - 20, tw + 8, 18);
    ctx.fillStyle = "#ff9800";
    ctx.fillText(label, midX, midY - 4);
  }

  // Apply single channel view filter
  function applyChannelFilter(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
  ) {
    if (channelView === "rgb") return;
    const imgData = ctx.getImageData(
      0,
      0,
      cw * (window.devicePixelRatio || 1),
      ch * (window.devicePixelRatio || 1),
    );
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (channelView === "r") {
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 255;
      } else if (channelView === "g") {
        d[i] = 0;
        d[i + 2] = 0;
        d[i + 3] = 255;
      } else if (channelView === "b") {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 3] = 255;
      } else if (channelView === "a") {
        const a = d[i + 3];
        d[i] = a;
        d[i + 1] = a;
        d[i + 2] = a;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function drawPixelGrid(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
  ) {
    if (!pixelGridEnabled || !imageData) return;

    // Visible image pixel range
    const ixStart = Math.max(0, Math.floor(-offsetX / scale));
    const iyStart = Math.max(0, Math.floor(-offsetY / scale));
    const ixEnd = Math.min(naturalWidth, Math.ceil((cw - offsetX) / scale));
    const iyEnd = Math.min(naturalHeight, Math.ceil((ch - offsetY) / scale));

    const visW = ixEnd - ixStart;
    const visH = iyEnd - iyStart;
    if (visW <= 0 || visH <= 0) return;

    // Threshold: only draw when visible pixels <= maxVisiblePixels per axis
    const maxPx = imageInfo.maxVisiblePixels || 32;
    if (visW > maxPx || visH > maxPx) return;

    // --- Grid lines ---
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let ix = ixStart; ix <= ixEnd; ix++) {
      const sx = Math.round(ix * scale + offsetX) + 0.5;
      ctx.moveTo(sx, iyStart * scale + offsetY);
      ctx.lineTo(sx, iyEnd * scale + offsetY);
    }
    for (let iy = iyStart; iy <= iyEnd; iy++) {
      const sy = Math.round(iy * scale + offsetY) + 0.5;
      ctx.moveTo(ixStart * scale + offsetX, sy);
      ctx.lineTo(ixEnd * scale + offsetX, sy);
    }
    ctx.stroke();

    // --- Pixel annotations ---
    const pxSize = scale; // screen pixels per image pixel

    // Decide layout: "full" (coord + R/G/B/A = 5 lines) or "compact" (coord + hex = 2 lines)
    // Font fits in cell: fontSize * lines <= pxSize → fontSize <= pxSize / lines
    const fullFontSize = Math.floor(pxSize / 5.5); // 5 lines + gaps
    const compactFontSize = Math.floor(pxSize / 2.5); // 2 lines + gaps

    const isFull = fullFontSize >= 4 && pxSize >= 22;
    const isCompact = !isFull && compactFontSize >= 4 && pxSize >= 8;
    if (!isFull && !isCompact) return;

    const fontSize = isFull ? fullFontSize : compactFontSize;
    const lineH = fontSize + 1;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let iy = iyStart; iy < iyEnd; iy++) {
      for (let ix = ixStart; ix < ixEnd; ix++) {
        const c = getPixelColor(ix, iy);
        if (!c) continue;

        const cx = ix * scale + offsetX + scale / 2;
        const cy = iy * scale + offsetY + scale / 2;
        const tc = contrastTextColor(c.r, c.g, c.b);

        ctx.fillStyle = tc;
        ctx.shadowColor =
          tc === "#000000" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 2;

        if (isFull) {
          // Full: coordinate + R/G/B/A (5 lines, centered in cell)
          ctx.fillText(`${ix},${iy}`, cx, cy - lineH * 2);
          ctx.fillText(`R:${c.r}`, cx, cy - lineH);
          ctx.fillText(`G:${c.g}`, cx, cy);
          ctx.fillText(`B:${c.b}`, cx, cy + lineH);
          ctx.fillText(`A:${c.a}`, cx, cy + lineH * 2);
        } else {
          // Compact: coordinate + hex
          ctx.fillText(`${ix},${iy}`, cx, cy - lineH * 0.5);
          const hex =
            `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`.toUpperCase();
          ctx.fillText(hex, cx, cy + lineH * 0.5);
        }
      }
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }

  function render() {
    if (!canvas || !loaded) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, cw, ch);
    drawBackground(ctx, cw, ch);

    const drawW = naturalWidth * scale;
    const drawH = naturalHeight * scale;
    ctx.imageSmoothingEnabled = scale < 4;
    ctx.filter = grayscaleMode ? "grayscale(1)" : "none";

    // Apply flip/rotate transforms
    ctx.save();
    const imgCX = offsetX + drawW / 2;
    const imgCY = offsetY + drawH / 2;
    ctx.translate(imgCX, imgCY);
    if (rotation === 90) ctx.rotate(Math.PI / 2);
    else if (rotation === 180) ctx.rotate(Math.PI);
    else if (rotation === 270) ctx.rotate(-Math.PI / 2);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    ctx.filter = "none";

    applyChannelFilter(ctx, cw, ch);
    drawPixelGrid(ctx, cw, ch);
    drawCrosshair(ctx, cw, ch);

    // Draw selection rectangle overlay
    if (isSelecting) {
      const x = Math.min(selStartX, selEndX);
      const y = Math.min(selStartY, selEndY);
      const w = Math.abs(selEndX - selStartX);
      const h = Math.abs(selEndY - selStartY);
      if (w > 2 && h > 2) {
        ctx.fillStyle = "rgba(30, 144, 255, 0.15)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.setLineDash([]);
      }
    }

    // Draw ROI drag preview
    if (isRoiDragging) {
      const x = Math.min(roiStartX, roiEndX);
      const y = Math.min(roiStartY, roiEndY);
      const w = Math.abs(roiEndX - roiStartX);
      const h = Math.abs(roiEndY - roiStartY);
      if (w > 2 && h > 2) {
        ctx.fillStyle = roiFillColor;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = roiStrokeColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
        ctx.setLineDash([]);
      }
    }

    // Draw committed ROI rectangle
    if (roiHasSelection && !isRoiDragging) {
      const sx = roiImgX * scale + offsetX;
      const sy = roiImgY * scale + offsetY;
      const sw = roiImgW * scale;
      const sh = roiImgH * scale;
      ctx.fillStyle = roiFillColor;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = roiStrokeColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(sx + 0.75, sy + 0.75, sw - 1.5, sh - 1.5);
      ctx.setLineDash([]);
    }

    drawMinimap(ctx, cw, ch);
    drawMeasure(ctx);

    // Copy feedback toast
    if (copyFeedback) {
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tw = ctx.measureText(copyFeedback).width;
      const pad = 12;
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(cw / 2 - tw / 2 - pad, ch / 2 - 14, tw + pad * 2, 28);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(copyFeedback, cw / 2, ch / 2);
    }
  }

  // --- Pixel reading ---
  function preparePixelData() {
    if (!img || !loaded) return;
    const offscreen = document.createElement("canvas");
    offscreen.width = naturalWidth;
    offscreen.height = naturalHeight;
    const offCtx = offscreen.getContext("2d")!;
    offCtx.drawImage(img, 0, 0);
    imageData = offCtx.getImageData(0, 0, naturalWidth, naturalHeight);
  }

  function getPixelColor(x: number, y: number): RGBA | null {
    if (
      !imageData ||
      x < 0 ||
      x >= naturalWidth ||
      y < 0 ||
      y >= naturalHeight
    ) {
      return null;
    }
    const i = (y * naturalWidth + x) * 4;
    return {
      r: imageData.data[i],
      g: imageData.data[i + 1],
      b: imageData.data[i + 2],
      a: imageData.data[i + 3],
    };
  }

  // --- ROI statistics ---
  function computeRoiStats(
    x: number,
    y: number,
    w: number,
    h: number,
  ): RoiStats | null {
    if (!imageData || w <= 0 || h <= 0) return null;
    const count = w * h;
    const sum = { r: 0, g: 0, b: 0, a: 0 };
    const sumSq = { r: 0, g: 0, b: 0, a: 0 };
    const mn = { r: 255, g: 255, b: 255, a: 255 };
    const mx = { r: 0, g: 0, b: 0, a: 0 };

    for (let iy = y; iy < y + h; iy++) {
      for (let ix = x; ix < x + w; ix++) {
        const i = (iy * naturalWidth + ix) * 4;
        const rv = imageData.data[i];
        const gv = imageData.data[i + 1];
        const bv = imageData.data[i + 2];
        const av = imageData.data[i + 3];
        sum.r += rv;
        sumSq.r += rv * rv;
        mn.r = Math.min(mn.r, rv);
        mx.r = Math.max(mx.r, rv);
        sum.g += gv;
        sumSq.g += gv * gv;
        mn.g = Math.min(mn.g, gv);
        mx.g = Math.max(mx.g, gv);
        sum.b += bv;
        sumSq.b += bv * bv;
        mn.b = Math.min(mn.b, bv);
        mx.b = Math.max(mx.b, bv);
        sum.a += av;
        sumSq.a += av * av;
        mn.a = Math.min(mn.a, av);
        mx.a = Math.max(mx.a, av);
      }
    }

    const mean = {
      r: sum.r / count,
      g: sum.g / count,
      b: sum.b / count,
      a: sum.a / count,
    };
    const std = {
      r: Math.sqrt(sumSq.r / count - mean.r * mean.r),
      g: Math.sqrt(sumSq.g / count - mean.g * mean.g),
      b: Math.sqrt(sumSq.b / count - mean.b * mean.b),
      a: Math.sqrt(sumSq.a / count - mean.a * mean.a),
    };

    return {
      width: w,
      height: h,
      pixelCount: count,
      mean,
      std,
      min: mn,
      max: mx,
    };
  }

  // --- Histogram ---
  function computeHistogram(): HistogramData | null {
    if (!imageData) return null;
    const gray = new Uint32Array(256);
    const r = new Uint32Array(256);
    const g = new Uint32Array(256);
    const b = new Uint32Array(256);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      r[d[i]]++;
      g[d[i + 1]]++;
      b[d[i + 2]]++;
      gray[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++;
    }
    return { gray, r, g, b };
  }

  function drawHistogram() {
    if (!histCanvas || !histogramData) return;
    const ctx = histCanvas.getContext("2d")!;
    const W = histCanvas.width;
    const H = histCanvas.height;
    ctx.clearRect(0, 0, W, H);

    const channel = histogramChannel;
    const datasets: { data: Uint32Array; color: string }[] = [];

    if (channel === "all") {
      datasets.push(
        { data: histogramData.r, color: "rgba(244,67,54,0.5)" },
        { data: histogramData.g, color: "rgba(76,175,80,0.5)" },
        { data: histogramData.b, color: "rgba(33,150,243,0.5)" },
      );
    } else if (channel === "gray") {
      datasets.push({
        data: histogramData.gray,
        color: "rgba(180,180,180,0.7)",
      });
    } else if (channel === "r") {
      datasets.push({ data: histogramData.r, color: "rgba(244,67,54,0.7)" });
    } else if (channel === "g") {
      datasets.push({ data: histogramData.g, color: "rgba(76,175,80,0.7)" });
    } else {
      datasets.push({ data: histogramData.b, color: "rgba(33,150,243,0.7)" });
    }

    // Find global max for normalization
    let globalMax = 1;
    for (const ds of datasets) {
      for (let i = 1; i < 256; i++) {
        if (ds.data[i] > globalMax) globalMax = ds.data[i];
      }
    }

    const barW = W / 256;
    for (const ds of datasets) {
      ctx.fillStyle = ds.color;
      for (let i = 0; i < 256; i++) {
        const h = (ds.data[i] / globalMax) * H;
        ctx.fillRect(i * barW, H - h, barW + 0.5, h);
      }
    }
  }

  // --- Coordinate conversion ---
  function screenToImage(sx: number, sy: number): [number, number] {
    const ix = Math.floor((sx - offsetX) / scale);
    const iy = Math.floor((sy - offsetY) / scale);
    return [ix, iy];
  }

  // --- Boundary clamping ---
  function clampOffset() {
    if (!loaded || !container) return;
    const rect = container.getBoundingClientRect();
    const imgW = naturalWidth * scale;
    const imgH = naturalHeight * scale;

    if (imgW > rect.width + BOUNDARY_MARGIN * 2) {
      offsetX = Math.max(
        rect.width - imgW - BOUNDARY_MARGIN,
        Math.min(BOUNDARY_MARGIN, offsetX),
      );
    }
    if (imgH > rect.height + BOUNDARY_MARGIN * 2) {
      offsetY = Math.max(
        rect.height - imgH - BOUNDARY_MARGIN,
        Math.min(BOUNDARY_MARGIN, offsetY),
      );
    }
  }

  // --- Zoom / Pan actions ---
  function zoomAt(newScale: number, cx: number, cy: number) {
    newScale = Math.max(getMinScale(), Math.min(getMaxScale(), newScale));
    offsetX = cx - ((cx - offsetX) / scale) * newScale;
    offsetY = cy - ((cy - offsetY) / scale) * newScale;
    scale = newScale;
  }

  function zoomToPreset(targetScale: number) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    zoomAt(targetScale, rect.width / 2, rect.height / 2);
  }

  function fitToWindow() {
    if (!loaded || !container) return;
    const rect = container.getBoundingClientRect();
    const scaleX = rect.width / naturalWidth;
    const scaleY = rect.height / naturalHeight;
    scale = Math.min(scaleX, scaleY);
    offsetX = (rect.width - naturalWidth * scale) / 2;
    offsetY = (rect.height - naturalHeight * scale) / 2;
  }

  function resetToOne() {
    if (!loaded || !container) return;
    scale = 1;
    const rect = container.getBoundingClientRect();
    offsetX = (rect.width - naturalWidth) / 2;
    offsetY = (rect.height - naturalHeight) / 2;
  }

  // --- Selection box zoom ---
  function applySelectionZoom() {
    const x = Math.min(selStartX, selEndX);
    const y = Math.min(selStartY, selEndY);
    const w = Math.abs(selEndX - selStartX);
    const h = Math.abs(selEndY - selStartY);
    if (w < 5 || h < 5) return;

    const rect = container.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;

    const [imgX1, imgY1] = screenToImage(x, y);
    const [imgX2, imgY2] = screenToImage(x + w, y + h);
    const selImgW = Math.abs(imgX2 - imgX1);
    const selImgH = Math.abs(imgY2 - imgY1);
    if (selImgW < 1 || selImgH < 1) return;

    const scaleX = cw / selImgW;
    const scaleY = ch / selImgH;
    const newScale = Math.min(scaleX, scaleY, getMaxScale());
    const clampedScale = Math.max(getMinScale(), newScale);

    const imgCenterX = (imgX1 + imgX2) / 2;
    const imgCenterY = (imgY1 + imgY2) / 2;
    scale = clampedScale;
    offsetX = cw / 2 - imgCenterX * scale;
    offsetY = ch / 2 - imgCenterY * scale;
    clampOffset();
  }

  // --- Event handlers ---
  function onWheel(e: WheelEvent) {
    if (!loaded) return;
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    zoomAt(scale * factor, mx, my);
    clampOffset();
  }

  function onMouseDown(e: MouseEvent) {
    // Measure tool → start measurement
    if (e.button === 0 && measureEnabled && !spaceHeld) {
      e.preventDefault();
      isMeasuring = true;
      const rect = container.getBoundingClientRect();
      measStartX = e.clientX - rect.left;
      measStartY = e.clientY - rect.top;
      measEndX = measStartX;
      measEndY = measStartY;
      return;
    }
    // Ctrl + Left Mouse → selection box zoom (only when ROI mode is off)
    if (e.button === 0 && e.ctrlKey && !roiEnabled) {
      e.preventDefault();
      isSelecting = true;
      const rect = container.getBoundingClientRect();
      selStartX = e.clientX - rect.left;
      selStartY = e.clientY - rect.top;
      selEndX = selStartX;
      selEndY = selStartY;
      return;
    }
    // Middle mouse button → pan
    if (e.button === 1) {
      e.preventDefault();
      isPanning = true;
      panStartX = e.clientX - offsetX;
      panStartY = e.clientY - offsetY;
      return;
    }
    // Left mouse button
    if (e.button === 0) {
      // Space held → always pan (even in ROI mode)
      if (spaceHeld) {
        isPanning = true;
        panStartX = e.clientX - offsetX;
        panStartY = e.clientY - offsetY;
        return;
      }
      // ROI mode → start ROI drag
      if (roiEnabled && loaded) {
        const rect = container.getBoundingClientRect();
        isRoiDragging = true;
        roiStartX = e.clientX - rect.left;
        roiStartY = e.clientY - rect.top;
        roiEndX = roiStartX;
        roiEndY = roiStartY;
        return;
      }
      // Default → pan
      isPanning = true;
      panStartX = e.clientX - offsetX;
      panStartY = e.clientY - offsetY;
    }
  }

  function onMouseMove(e: MouseEvent) {
    // Update pixel inspector
    if (container && loaded) {
      const rect = container.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const [ix, iy] = screenToImage(sx, sy);
      pixelX = ix;
      pixelY = iy;
      pixelColor = getPixelColor(ix, iy);
    }

    // Handle measure drag
    if (isMeasuring && container) {
      const rect = container.getBoundingClientRect();
      measEndX = e.clientX - rect.left;
      measEndY = e.clientY - rect.top;
      measureVersion++;
      render();
      return;
    }

    // Handle selection box drag
    if (isSelecting && container) {
      const rect = container.getBoundingClientRect();
      selEndX = e.clientX - rect.left;
      selEndY = e.clientY - rect.top;
      selectionVersion++;
      render();
      return;
    }

    // Handle ROI drag
    if (isRoiDragging && container) {
      const rect = container.getBoundingClientRect();
      roiEndX = e.clientX - rect.left;
      roiEndY = e.clientY - rect.top;
      roiVersion++;
      render();
      return;
    }

    // Handle panning
    if (!isPanning) return;
    offsetX = e.clientX - panStartX;
    offsetY = e.clientY - panStartY;
    clampOffset();
  }

  function onMouseUp(e: MouseEvent) {
    // Finish measure
    if (isMeasuring && e.button === 0) {
      isMeasuring = false;
      measureVersion++;
      render();
      return;
    }
    // Finish selection
    if (isSelecting && e.button === 0) {
      isSelecting = false;
      selectionVersion++;
      applySelectionZoom();
      return;
    }
    // Finish ROI selection
    if (isRoiDragging && e.button === 0) {
      isRoiDragging = false;
      // Compute normalized image-pixel rect
      const [ix1, iy1] = screenToImage(
        Math.min(roiStartX, roiEndX),
        Math.min(roiStartY, roiEndY),
      );
      const [ix2, iy2] = screenToImage(
        Math.max(roiStartX, roiEndX),
        Math.max(roiStartY, roiEndY),
      );
      // Clamp to image bounds
      const cx1 = Math.max(0, Math.min(ix1, naturalWidth));
      const cy1 = Math.max(0, Math.min(iy1, naturalHeight));
      const cx2 = Math.max(0, Math.min(ix2, naturalWidth));
      const cy2 = Math.max(0, Math.min(iy2, naturalHeight));
      const w = cx2 - cx1;
      const h = cy2 - cy1;
      if (w >= 1 && h >= 1) {
        roiImgX = cx1;
        roiImgY = cy1;
        roiImgW = w;
        roiImgH = h;
        roiHasSelection = true;
        roiStats = computeRoiStats(cx1, cy1, w, h);
      } else {
        roiHasSelection = false;
        roiStats = null;
      }
      roiVersion++;
      render();
      return;
    }
    if (e.button === 0 || e.button === 1) {
      isPanning = false;
    }
  }

  function onMouseLeave() {
    pixelX = -1;
    pixelY = -1;
    pixelColor = null;
  }

  function onDblClick(e: MouseEvent) {
    if (!loaded || !container) return;
    // If already at ~100%, fit to window. Otherwise zoom to 100% at click point.
    if (Math.abs(scale - 1) < 0.01) {
      fitToWindow();
    } else {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      zoomAt(1, mx, my);
      clampOffset();
    }
  }

  function onClick(e: MouseEvent) {
    // Alt + Left click → copy pixel color
    if (e.altKey && loaded && pixelColor) {
      copyPixelColor();
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === "Space" && !e.repeat) {
      e.preventDefault();
      spaceHeld = true;
      return;
    }
    if (e.key === "g" || e.key === "G") {
      pixelGridEnabled = !pixelGridEnabled;
      return;
    }
    if (e.key === "r" || e.key === "R") {
      roiEnabled = !roiEnabled;
      if (!roiEnabled) {
        roiHasSelection = false;
        roiStats = null;
        roiVersion++;
        render();
      }
      return;
    }
    if (e.key === "h" || e.key === "H") {
      if (!histogramEnabled) {
        histogramData = computeHistogram();
      }
      histogramEnabled = !histogramEnabled;
      return;
    }
    if (e.key === "d" || e.key === "D") {
      grayscaleMode = !grayscaleMode;
      return;
    }
    if (e.key === "x" || e.key === "X") {
      crosshairEnabled = !crosshairEnabled;
      return;
    }
    if (e.key === "f" || e.key === "F") {
      if (e.shiftKey) flipV = !flipV;
      else flipH = !flipH;
      return;
    }
    if (e.key === "n" || e.key === "N") {
      rotation = ((rotation + 90) % 360) as 0 | 90 | 180 | 270;
      return;
    }
    if (e.key === "b" || e.key === "B") {
      const modes = ["checkerboard", "white", "black", "gray"] as const;
      bgMode = modes[(modes.indexOf(bgMode) + 1) % modes.length];
      return;
    }
    if (e.key === "m" || e.key === "M") {
      minimapEnabled = !minimapEnabled;
      return;
    }
    if (e.key === "l" || e.key === "L") {
      measureEnabled = !measureEnabled;
      if (!measureEnabled) {
        measureVersion = 0;
      }
      return;
    }
    // Channel view: 1=RGB, 2=R, 3=G, 4=B, 5=A
    if (e.key === "1") {
      channelView = "rgb";
      return;
    }
    if (e.key === "2") {
      channelView = "r";
      return;
    }
    if (e.key === "3") {
      channelView = "g";
      return;
    }
    if (e.key === "4") {
      channelView = "b";
      return;
    }
    if (e.key === "5") {
      channelView = "a";
      return;
    }

    if (!loaded || !container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      zoomAt(scale * ZOOM_FACTOR, cx, cy);
      clampOffset();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
      e.preventDefault();
      zoomAt(scale / ZOOM_FACTOR, cx, cy);
      clampOffset();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
      e.preventDefault();
      fitToWindow();
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.code === "Space") {
      spaceHeld = false;
      if (isPanning) isPanning = false;
    }
  }

  // --- Effects ---
  $effect(() => {
    void histogramChannel;
    void histCanvas;
    if (histogramEnabled && histCanvas && histogramData) {
      drawHistogram();
    }
  });

  $effect(() => {
    void scale;
    void offsetX;
    void offsetY;
    void loaded;
    void selectionVersion;
    void pixelGridEnabled;
    void grayscaleMode;
    void crosshairEnabled;
    void bgMode;
    void flipH;
    void flipV;
    void rotation;
    void minimapEnabled;
    void copyFeedback;
    void measureVersion;
    void channelView;
    void roiVersion;
    render();
  });

  // --- Lifecycle ---
  onMount(() => {
    img = new Image();
    img.onload = () => {
      naturalWidth = img.naturalWidth;
      naturalHeight = img.naturalHeight;
      loaded = true;
      preparePixelData();
      fitToWindow();
    };
    img.onerror = () => {};
    img.src = imageInfo.imageSrc;

    const onResize = () => render();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  });
</script>

<svelte:window
  onmousemove={onMouseMove}
  onmouseup={onMouseUp}
  onkeydown={onKeyDown}
  onkeyup={onKeyUp}
/>

<div class="viewer">
  <Toolbar
    {scale}
    {zoomPercent}
    {isOnPreset}
    {grayscaleMode}
    {bgMode}
    {crosshairEnabled}
    {minimapEnabled}
    {flipH}
    {flipV}
    {rotation}
    {pixelGridEnabled}
    {roiEnabled}
    {measureEnabled}
    {histogramEnabled}
    {channelView}
    zoomPresets={getZoomPresets()}
    onZoomIn={() => {
      const r = container.getBoundingClientRect();
      zoomAt(scale * ZOOM_FACTOR, r.width / 2, r.height / 2);
      clampOffset();
    }}
    onZoomOut={() => {
      const r = container.getBoundingClientRect();
      zoomAt(scale / ZOOM_FACTOR, r.width / 2, r.height / 2);
      clampOffset();
    }}
    onZoomPresetChange={zoomToPreset}
    onResetZoom={resetToOne}
    onFitWindow={fitToWindow}
    onToggleGrayscale={() => {
      grayscaleMode = !grayscaleMode;
    }}
    onCycleBg={() => {
      const modes = ["checkerboard", "white", "black", "gray"] as const;
      bgMode = modes[(modes.indexOf(bgMode) + 1) % modes.length];
    }}
    onToggleCrosshair={() => {
      crosshairEnabled = !crosshairEnabled;
    }}
    onToggleMinimap={() => {
      minimapEnabled = !minimapEnabled;
    }}
    onToggleFlipH={() => {
      flipH = !flipH;
    }}
    onToggleFlipV={() => {
      flipV = !flipV;
    }}
    onRotate={() => {
      rotation = ((rotation + 90) % 360) as 0 | 90 | 180 | 270;
    }}
    onTogglePixelGrid={() => {
      pixelGridEnabled = !pixelGridEnabled;
    }}
    onToggleRoi={() => {
      roiEnabled = !roiEnabled;
      if (!roiEnabled) {
        roiHasSelection = false;
        roiStats = null;
        roiVersion++;
        render();
      }
    }}
    onToggleMeasure={() => {
      measureEnabled = !measureEnabled;
      if (!measureEnabled) {
        measureVersion = 0;
      }
    }}
    onToggleHistogram={() => {
      if (!histogramEnabled) {
        histogramData = computeHistogram();
      }
      histogramEnabled = !histogramEnabled;
    }}
    onChannelChange={(ch: typeof channelView) => {
      channelView = ch;
    }}
  />

  <!-- Canvas Area -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
  <div
    class="canvas-container"
    style="cursor: {cursorStyle}"
    bind:this={container}
    onwheel={onWheel}
    onmousedown={onMouseDown}
    onclick={onClick}
    ondblclick={onDblClick}
    onmouseleave={onMouseLeave}
    onkeydown={() => {}}
    ondragover={(e: DragEvent) => {
      e.preventDefault();
    }}
    ondrop={(e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file && /\.(png|jpe?g|gif|bmp|webp|tiff?|ico)$/i.test(file.name)) {
        // Webview File object has a webkitRelativePath-like path
        // Use the file name to find via VSCode's open command
        vscode.postMessage({ type: "openDroppedFile", fileName: file.name });
      }
    }}
    role="application"
    aria-label="Image viewer"
    tabindex="-1"
  >
    <canvas bind:this={canvas}></canvas>
  </div>

  <!-- Right Sidebar -->
  <Sidebar
    {histogramEnabled}
    {histogramChannel}
    {histogramData}
    {roiStats}
    bind:histCanvas
    onHistogramChannelChange={(ch: "all" | "gray" | "r" | "g" | "b") => {
      histogramChannel = ch;
      requestAnimationFrame(drawHistogram);
    }}
    onClearRoi={() => {
      roiHasSelection = false;
      roiStats = null;
      roiVersion++;
      render();
    }}
    onCloseHistogram={() => {
      histogramEnabled = false;
    }}
  />

  <!-- Status Bar -->
  <div class="statusbar">
    <span class="left">{statusText}</span>
    <span class="right">{imageInfo.fileName}</span>
  </div>
</div>

<style>
  /* === Workspace Grid Layout === */
  .viewer {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr auto;
    width: 100vw;
    height: 100vh;
  }

  /* === Canvas (main workspace) === */
  .canvas-container {
    grid-column: 1;
    overflow: hidden;
    position: relative;
  }

  .canvas-container canvas {
    position: absolute;
    top: 0;
    left: 0;
    image-rendering: pixelated;
  }

  /* === Status Bar === */
  .statusbar {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 8px;
    background: var(--status-bg, #007acc);
    color: var(--status-fg, #ffffff);
    font-size: 12px;
    user-select: none;
    min-height: 22px;
    gap: 12px;
  }

  .statusbar .left {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .statusbar .right {
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
