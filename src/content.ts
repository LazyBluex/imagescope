import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

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

/**
 * Generate webview HTML by reading the Vite-built JS/CSS bundles
 * and assembling a complete HTML document with proper CSP.
 */
export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  imageInfo: ImageInfo,
): string {
  const distDir = path.join(extensionUri.fsPath, "dist", "webview");
  const nonce = getNonce();

  let scriptContent: string;
  try {
    scriptContent = fs.readFileSync(path.join(distDir, "main.mjs"), "utf-8");
  } catch (err) {
    scriptContent = `document.getElementById("app").innerHTML='<p style="color:red">Failed to load: ${String(err)}</p>'`;
  }

  let cssContent: string;
  try {
    cssContent = fs.readFileSync(path.join(distDir, "main.css"), "utf-8");
  } catch {
    cssContent = "";
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 img-src ${webview.cspSource} data: blob:;
                 style-src ${webview.cspSource} 'unsafe-inline';
                 script-src 'nonce-${nonce}';">
  <title>ImageScope</title>
  <style>html,body,#app{height:100%;margin:0;padding:0;overflow:hidden}</style>
  <style nonce="${nonce}">${cssContent}</style>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}">window.__IMAGE_INFO__=${JSON.stringify(imageInfo)};</script>
  <script nonce="${nonce}">${scriptContent}</script>
</body>
</html>`;
}

function getNonce(): string {
  let text = "";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
