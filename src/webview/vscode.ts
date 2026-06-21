/**
 * VSCode webview API wrapper and image info from extension.
 */

export interface ImageInfo {
  imageSrc: string;
  fileName: string;
  filePath: string;
  format: string;
  fileSize: number;
  maxVisiblePixels: number;
  roiColor: string;
  roiFillColor: string;
}

interface VsCodeApi {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

export const vscode: VsCodeApi = acquireVsCodeApi();

// Image info injected by the extension via <script> tag
export const imageInfo: ImageInfo = (window as unknown as { __IMAGE_INFO__: ImageInfo }).__IMAGE_INFO__;
