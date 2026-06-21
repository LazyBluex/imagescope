<script lang="ts">
  const ZOOM_FACTOR = 1.15;

  let {
    scale = 1,
    zoomPercent = 100,
    isOnPreset = false,
    grayscaleMode = false,
    bgMode = "checkerboard" as "checkerboard" | "white" | "black" | "gray",
    crosshairEnabled = false,
    minimapEnabled = false,
    flipH = false,
    flipV = false,
    rotation = 0 as 0 | 90 | 180 | 270,
    pixelGridEnabled = false,
    roiEnabled = false,
    measureEnabled = false,
    histogramEnabled = false,
    channelView = "rgb" as "rgb" | "r" | "g" | "b" | "a",
    zoomPresets = [] as number[],
    onZoomIn = () => {},
    onZoomOut = () => {},
    onZoomPresetChange = (value: number) => {},
    onResetZoom = () => {},
    onFitWindow = () => {},
    onToggleGrayscale = () => {},
    onCycleBg = () => {},
    onToggleCrosshair = () => {},
    onToggleMinimap = () => {},
    onToggleFlipH = () => {},
    onToggleFlipV = () => {},
    onRotate = () => {},
    onTogglePixelGrid = () => {},
    onToggleRoi = () => {},
    onToggleMeasure = () => {},
    onToggleHistogram = () => {},
    onChannelChange = (channel: typeof channelView) => {},
  } = $props();
</script>

<div class="toolbar">
  <button onclick={() => onZoomIn()} title="Zoom In">+</button>
  <button onclick={() => onZoomOut()} title="Zoom Out">−</button>
  <select
    class="zoom-select"
    value={isOnPreset ? String(scale) : ""}
    onchange={(e) => {
      const val = parseFloat(e.currentTarget.value);
      if (!isNaN(val)) onZoomPresetChange(val);
    }}
    title="Zoom Preset"
  >
    {#if !isOnPreset}
      <option value="" disabled>{zoomPercent}%</option>
    {/if}
    {#each zoomPresets as preset}
      <option value={preset}>{Math.round(preset * 100)}%</option>
    {/each}
  </select>
  <button onclick={() => onResetZoom()} title="Reset to 1:1">1:1</button>
  <button onclick={() => onFitWindow()} title="Fit to Window (Ctrl+0)">Fit</button>

  <div class="separator"></div>

  <button
    class:active={grayscaleMode}
    onclick={() => onToggleGrayscale()}
    title="Toggle Grayscale (D)">Gray</button
  >
  <button
    onclick={() => onCycleBg()}
    title="Cycle Background (B)">BG</button
  >
  <button
    class:active={crosshairEnabled}
    onclick={() => onToggleCrosshair()}
    title="Toggle Crosshair (X)">+</button
  >
  <button
    class:active={minimapEnabled}
    onclick={() => onToggleMinimap()}
    title="Toggle Minimap (M)">Map</button
  >

  <div class="separator"></div>

  <button
    onclick={() => onToggleFlipH()}
    title="Flip Horizontal (F)">⇔</button
  >
  <button
    onclick={() => onToggleFlipV()}
    title="Flip Vertical (Shift+F)">⇕</button
  >
  <button
    onclick={() => onRotate()}
    title="Rotate 90° (N)">↻</button
  >

  <div class="separator"></div>

  <button
    class:active={pixelGridEnabled}
    onclick={() => onTogglePixelGrid()}
    title="Toggle Pixel Grid (G)">Grid</button
  >
  <button
    class:active={roiEnabled}
    onclick={() => onToggleRoi()}
    title="Toggle ROI Selection (R)">ROI</button
  >
  <button
    class:active={measureEnabled}
    onclick={() => onToggleMeasure()}
    title="Toggle Measure Tool (L)">Meas</button
  >
  <button
    class:active={histogramEnabled}
    onclick={() => onToggleHistogram()}
    title="Toggle Histogram (H)">Hist</button
  >
  <select
    class="zoom-select"
    value={channelView}
    onchange={(e) => {
      onChannelChange(e.currentTarget.value as typeof channelView);
    }}
    title="Channel View (1-5)"
  >
    <option value="rgb">RGB</option>
    <option value="r">R</option>
    <option value="g">G</option>
    <option value="b">B</option>
    <option value="a">A</option>
  </select>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--sidebar-bg, #252526);
    border-bottom: 1px solid var(--border, #3c3c3c);
    user-select: none;
  }

  .toolbar button {
    background: none;
    border: 1px solid transparent;
    color: var(--fg, #cccccc);
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 14px;
    line-height: 1;
    min-width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toolbar button:hover {
    background: var(--hover-bg, #3c3c3c);
  }

  .toolbar button.active {
    background: var(--vscode-inputOption-activeBackground, #007acc);
    color: var(--vscode-inputOption-activeForeground, #ffffff);
    border-color: var(--vscode-inputOption-activeBorder, #007acc);
  }

  .zoom-select {
    background: var(--sidebar-bg, #252526);
    color: var(--fg, #cccccc);
    border: 1px solid var(--border, #3c3c3c);
    border-radius: 3px;
    padding: 2px 4px;
    font-size: 12px;
    height: 26px;
    cursor: pointer;
    outline: none;
  }

  .zoom-select:focus {
    border-color: var(--fg, #cccccc);
  }

  .separator {
    width: 1px;
    height: 18px;
    background: var(--border, #3c3c3c);
    margin: 0 4px;
  }
</style>
