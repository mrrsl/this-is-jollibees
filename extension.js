// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

//const vscode = require('vscode');

import * as vscode from 'vscode';

import {
	LeetProblemProvider
} from './src/LeetProblemBrowse.js'

import {
	SolutionRunnerProvider
} from './src/solution-runner/SolutionRunner.js'

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 * 
 * @param {vscode.ExtensionContext} context
 */
export function activate(context) {

	console.log('extension active');

	vscode.commands.registerCommand('leet.import-problem', (heading) => {
		// Code for importing the detailed problem info
		console.log("import commanded for", heading.problemData.titleSlug);
	});

	const treeProvider = new LeetProblemProvider();
	vscode.window.registerTreeDataProvider(
        'leet-browse-view',
        treeProvider
    );

	const runnerProvider = new SolutionRunnerProvider(context.extensionUri);
	vscode.window.registerWebviewViewProvider("leet-run-view", runnerProvider);
}

export function deactivate() {}
