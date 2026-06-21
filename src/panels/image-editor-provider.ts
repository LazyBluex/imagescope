import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getWebviewContent } from "../content";

/**
 * Custom Editor Provider — makes ImageScope the default image viewer.
 * VSCode manages the panel lifecycle (create, split, dispose).
 * We only fill in the HTML content.
 */
export class ImageEditorProvider implements vscode.CustomReadonlyEditorProvider {
  public static readonly viewType = "imagescope.imageViewer";

  constructor(private readonly extensionUri: vscode.Uri) {}

  openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
    return { uri, dispose: () => {} };
  }

  resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
  ): void {
    this.renderWebview(document.uri, webviewPanel);
  }

  private renderWebview(imageUri: vscode.Uri, webviewPanel: vscode.WebviewPanel): void {
    const webview = webviewPanel.webview;

    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this.extensionUri,
        vscode.Uri.joinPath(this.extensionUri, "dist", "webview"),
        vscode.Uri.file(path.dirname(imageUri.fsPath)),
      ],
    };

    const filePath = imageUri.fsPath;
    let fileSize = 0;
    try {
      fileSize = fs.statSync(filePath).size;
    } catch {
      // ignore
    }

    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    const imageWebviewUri = webview.asWebviewUri(imageUri);

    const config = vscode.workspace.getConfiguration("imagescope");
    const maxVisiblePixels = config.get<number>("pixelGrid.maxVisiblePixels", 32);
    const roiColor = config.get<string>("roi.color", "#4CAF50");
    const roiFillColor = config.get<string>("roi.fillColor", "#4CAF5010");

    webview.html = getWebviewContent(webview, this.extensionUri, {
      imageSrc: imageWebviewUri.toString(),
      fileName: path.basename(filePath),
      filePath: filePath,
      format: ext,
      fileSize: fileSize,
      maxVisiblePixels: maxVisiblePixels,
      roiColor: roiColor,
      roiFillColor: roiFillColor,
    });
  }
}
