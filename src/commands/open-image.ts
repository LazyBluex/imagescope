import * as vscode from "vscode";

const SUPPORTED_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "bmp",
  "webp",
  "tiff",
  "tif",
  "ico",
  "svg",
];

/**
 * Register the `imagescope.openImage` command.
 * Can be invoked from the command palette (with file picker) or from explorer context menu (with URI).
 */
export function registerOpenImageCommand(
  context: vscode.ExtensionContext,
): vscode.Disposable {
  return vscode.commands.registerCommand(
    "imagescope.openImage",
    async (uri?: vscode.Uri) => {
      let imageUri: vscode.Uri | undefined = uri;

      // If no URI provided (command palette), show file picker
      if (!imageUri) {
        const uris = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          filters: {
            Images: Array.from(SUPPORTED_EXTENSIONS).map((ext) =>
              ext.replace(".", ""),
            ),
          },
          title: "Open Image with ImageScope",
        });

        if (!uris || uris.length === 0) {
          return; // User cancelled
        }
        imageUri = uris[0];
      }

      // Validate extension
      const ext = getExtension(imageUri.fsPath);
      if (!SUPPORTED_EXTENSIONS.includes(ext.replace(".", ""))) {
        vscode.window.showErrorMessage(
          `ImageScope: Unsupported image format "${ext}". Supported: ${SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(", ")}`,
        );
        return;
      }

      // Open in the active column
      const doc = await vscode.workspace.openTextDocument(imageUri);
      await vscode.window.showTextDocument(doc, {
        viewColumn: vscode.ViewColumn.Active,
        preview: false,
      });
    },
  );
}

function getExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf(".");
  if (lastDot === -1) {
    return "";
  }
  return filePath.substring(lastDot).toLowerCase();
}
