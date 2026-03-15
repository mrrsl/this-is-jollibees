import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Connector class to make src/solution-runner/index.html visible to the extension.
 *
 * @implements {vscode.WebviewViewProvider}
 */
export class ProblemDescriptionProvider {
  /** @type {vscode.WebviewView} */
  view;

  /** @type {vscode.Uri} */
  extensionRoot;

  /** @type {((language: string) => void) | null} */
  onLanguageChange = null;

  /**
   * @param {vscode.Uri} extensionRoot Extension root path.
   */
  constructor(extensionRoot) {
    this.extensionRoot = extensionRoot;
    this.currentLanguage = "JavaScript";
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

    // checks for messages from the webview, and if its a setLanguage command, set the current language to the new language
    this.view.webview.onDidReceiveMessage((message) => {
      if (message.command === "setLanguage") {
        this.onLanguageChange?.(message.language);
      }
    });
  }

  /**
   * Generate HTML from hardcoded file.
   *
   * @param {vscode.Webview} view
   *
   */
  generateHtml(view) {
    const indexPath = vscode.Uri.joinPath(
      this.extensionRoot,
      "src",
      "problem-description",
      "index.html",
    );

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
    return vscode.Uri.joinPath(this.extensionRoot, "src", "problem-description", filename);
  }

  /**
   * Sends data to the panel webview so it can update its contents for a different problem.
   *
   * @param {import("@leetnotion/leetcode-api").Problem} problem the problem data being sent
   * @param {string} currentLanguage the current language of the problem
   */
  updateContents(problem, currentLanguage) {
    this.view.webview.postMessage({problem, currentLanguage});
  }
}
