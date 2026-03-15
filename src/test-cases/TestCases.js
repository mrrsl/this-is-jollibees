import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Connector class to make src/test-cases/index.html visible to the extension
 *
 * @implements {vscode.WebviewViewProvider}
 */
export class TestCaseProvider {
  /** @type {vscode.WebviewView} */
  view;

  /** @type {vscode.Uri} */
  extensionRoot;

  /**
   * @param {vscode.Uri} extensionRoot Extension root path.
   */
  constructor(extensionRoot) {
    this.extensionRoot = extensionRoot;
  }

  /**
   * Required function from {@link vscode.WebviewViewProvider}
   *
   * @param {vscode.WebviewView} viewarg
   * @param {vscode.WebviewViewResolveContext} context
   * @param {vscode.CancellationToken} token
   */
  resolveWebviewView(viewarg, context, token) {
    this.view = viewarg;

    this.view.webview.options = {
      enableScripts: true,

      // Leaving this in case we want to use external css/js
      localResourceRoots: [this.makePath("index.css"), this.makePath("index.js")],
    };

    this.generateHtml(viewarg.webview);
  }

  /**
   * Generate HTML from hardcoded file.
   *
   * @param {vscode.Webview} view
   *
   */
  generateHtml(view) {
    const indexPath = vscode.Uri.joinPath(this.extensionRoot, "src", "test-cases", "index.html");

    fs.readFile(indexPath.fsPath, (err, data) => {
      if (!err) this.view.webview.html = data.toString();
      else console.error("Cannot read webview");
    });
  }
  /**
   * Utility function for making vscode Uris
   *
   * @param {string} filename Name of resource file to access within the ViewProvider's directory.
   */
  makePath(filename) {
    return vscode.Uri.joinPath(this.extensionRoot, "src", "test-cases", filename);
  }

  /**
   * Sends data to the panel webview so it can update its contents for the test cases of this problem
   *
   * @param {string} testCases
   */
  updateContents(testCases) {
    this.view.webview.postMessage(testCases);
  }
}
