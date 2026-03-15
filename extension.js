// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

//const vscode = require('vscode');

import * as vscode from "vscode";

import { Engine } from "./src/Engine.js";

import { DifficultyDecorationProvider } from "./src/LeetProblemBrowse.js";

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 *
 * @param {vscode.ExtensionContext} context
 */
export function activate(context) {
    console.log("extension active");

    const extRunner = new Engine(context.extensionUri, "solution");

	const tabChange = vscode.window.onDidChangeActiveTextEditor(editor => extRunner.tabChangeHandler(editor));
    vscode.window.registerFileDecorationProvider( 
        new DifficultyDecorationProvider()
    ),

    vscode.commands.registerCommand(
        "leet.import-problem",
		(p) => extRunner.importProblem(p)
    );

    vscode.commands.registerCommand(
        "leet.create-test-cases",
        () => extRunner.createTestCases(),
    );

    vscode.window.registerTreeDataProvider(
        "leet-browse-view",
        extRunner.getSidePanelProvider(),
    );

    vscode.window.registerWebviewViewProvider(
        "leet-run-view",
        extRunner.getPanelProvider(),
    );
	
	context.subscriptions.push(tabChange);
}

export function deactivate() {}
