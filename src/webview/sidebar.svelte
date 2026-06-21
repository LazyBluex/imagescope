<script lang="ts">
  interface HistogramData {
    gray: Uint32Array;
    r: Uint32Array;
    g: Uint32Array;
    b: Uint32Array;
  }

  interface RoiStats {
    width: number;
    height: number;
    pixelCount: number;
    mean: { r: number; g: number; b: number; a: number };
    std: { r: number; g: number; b: number; a: number };
    min: { r: number; g: number; b: number; a: number };
    max: { r: number; g: number; b: number; a: number };
  }

  type HistChannel = "all" | "gray" | "r" | "g" | "b";

  let {
    histogramEnabled = false,
    histogramChannel = "all" as HistChannel,
    histogramData = null as HistogramData | null,
    roiStats = null as RoiStats | null,
    histCanvas = $bindable<HTMLCanvasElement | undefined>(undefined),
    onHistogramChannelChange = (ch: HistChannel) => {},
    onClearRoi = () => {},
    onCloseHistogram = () => {},
  } = $props();

  let histCanvasRef = $state<HTMLCanvasElement | undefined>(undefined);
  $effect(() => {
    if (histCanvasRef) {
      histCanvas = histCanvasRef;
    }
  });
</script>

{#if histogramEnabled || roiStats}
  <div class="sidebar">
    {#if roiStats}
      <div class="sidebar-panel">
        <div class="panel-header">
          <span>ROI Statistics</span>
          <button class="panel-close" onclick={() => onClearRoi()} title="Clear ROI"
            >×</button
          >
        </div>
        <div class="panel-body">
          <div class="roi-row">
            <span class="roi-label">Size</span><span
              >{roiStats.width} × {roiStats.height} px ({roiStats.pixelCount} px)</span
            >
          </div>
          <table class="roi-table">
            <thead>
              <tr
                ><th></th><th>Mean</th><th>Std</th><th>Min</th><th>Max</th
                ></tr
              >
            </thead>
            <tbody>
              <tr>
                <td class="ch-r">R</td>
                <td>{roiStats.mean.r.toFixed(1)}</td>
                <td>{roiStats.std.r.toFixed(1)}</td>
                <td>{roiStats.min.r}</td>
                <td>{roiStats.max.r}</td>
              </tr>
              <tr>
                <td class="ch-g">G</td>
                <td>{roiStats.mean.g.toFixed(1)}</td>
                <td>{roiStats.std.g.toFixed(1)}</td>
                <td>{roiStats.min.g}</td>
                <td>{roiStats.max.g}</td>
              </tr>
              <tr>
                <td class="ch-b">B</td>
                <td>{roiStats.mean.b.toFixed(1)}</td>
                <td>{roiStats.std.b.toFixed(1)}</td>
                <td>{roiStats.min.b}</td>
                <td>{roiStats.max.b}</td>
              </tr>
              <tr>
                <td class="ch-a">A</td>
                <td>{roiStats.mean.a.toFixed(1)}</td>
                <td>{roiStats.std.a.toFixed(1)}</td>
                <td>{roiStats.min.a}</td>
                <td>{roiStats.max.a}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    {#if histogramEnabled && histogramData}
      <div class="sidebar-panel">
        <div class="panel-header">
          <span>Histogram</span>
          <button
            class="panel-close"
            onclick={() => onCloseHistogram()}
            title="Close Histogram">×</button
          >
        </div>
        <div class="panel-body">
          <div class="hist-channels">
            {#each ["all", "gray", "r", "g", "b"] as ch}
              <button
                class:active={histogramChannel === ch}
                onclick={() => {
                  onHistogramChannelChange(ch as typeof histogramChannel);
                  requestAnimationFrame(() => {
                    if (histCanvasRef) {
                      // Trigger redraw via parent
                      histCanvas = histCanvasRef;
                    }
                  });
                }}>{ch === "all" ? "All" : ch.toUpperCase()}</button
              >
            {/each}
          </div>
          <canvas
            class="hist-canvas"
            width="256"
            height="120"
            bind:this={histCanvasRef}
          ></canvas>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .sidebar {
    grid-column: 2;
    width: 280px;
    background: var(--bg, #1e1e1e);
    border-left: 1px solid var(--border, #3c3c3c);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .sidebar-panel {
    border-bottom: 1px solid var(--border, #3c3c3c);
    color: var(--fg, #cccccc);
    font-size: 12px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: var(--sidebar-bg, #252526);
    font-weight: 600;
  }

  .panel-close {
    background: none;
    border: none;
    color: var(--fg, #cccccc);
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0 4px;
    border-radius: 3px;
  }

  .panel-close:hover {
    background: var(--hover-bg, #3c3c3c);
  }

  .panel-body {
    padding: 8px 10px;
  }

  .roi-row {
    margin-bottom: 4px;
  }

  .roi-label {
    color: var(--fg-muted, #999);
    margin-right: 4px;
  }

  .roi-table {
    width: 100%;
    border-collapse: collapse;
    text-align: right;
  }

  .roi-table th {
    font-weight: normal;
    color: var(--fg-muted, #999);
    padding: 2px 4px;
    border-bottom: 1px solid var(--border, #3c3c3c);
  }

  .roi-table td {
    padding: 2px 4px;
  }

  .roi-table td.ch-r {
    color: #f44336;
    text-align: left;
    font-weight: 600;
  }
  .roi-table td.ch-g {
    color: #4caf50;
    text-align: left;
    font-weight: 600;
  }
  .roi-table td.ch-b {
    color: #2196f3;
    text-align: left;
    font-weight: 600;
  }
  .roi-table td.ch-a {
    color: #9e9e9e;
    text-align: left;
    font-weight: 600;
  }

  .hist-channels {
    display: flex;
    gap: 2px;
    margin-bottom: 6px;
  }

  .hist-channels button {
    background: none;
    border: 1px solid transparent;
    color: var(--fg, #cccccc);
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    line-height: 1.4;
  }

  .hist-channels button:hover {
    background: var(--hover-bg, #3c3c3c);
  }

  .hist-channels button.active {
    background: var(--vscode-inputOption-activeBackground, #007acc);
    color: var(--vscode-inputOption-activeForeground, #ffffff);
    border-color: var(--vscode-inputOption-activeBorder, #007acc);
  }

  .hist-canvas {
    display: block;
    width: 100%;
    height: 120px;
  }
</style>
