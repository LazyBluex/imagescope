import * as vscode from "vscode";
import { registerOpenImageCommand } from "./commands/open-image";
import { ImageEditorProvider } from "./panels/image-editor-provider";

export function activate(context: vscode.ExtensionContext) {
  console.log("ImageScope is now active!");

  // Register custom editor provider (default image viewer)
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      ImageEditorProvider.viewType,
      new ImageEditorProvider(context.extensionUri),
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  // Register open command (command palette / right-click)
  context.subscriptions.push(registerOpenImageCommand(context));
}

export function deactivate() {}
