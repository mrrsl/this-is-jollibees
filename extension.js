// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

//const vscode = require('vscode');

import * as vscode from 'vscode';

import {
	LeetProblemProvider
} from './src/LeetProblemBrowse.js'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context) {

	console.log('extension active');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('htb-lc.helloWorld', function () {
		// The code you place here will be executed every time your command is executed
		vscode.window.showInformationMessage('Hello World from htb-lc!');
	});

	const treeProvider = new LeetProblemProvider();

	vscode.window.registerTreeDataProvider(
        'leet-browse-view',
        treeProvider
    );

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
