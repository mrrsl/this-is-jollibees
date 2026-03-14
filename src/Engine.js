import { LeetCode, Credential } from "@leetnotion/leetcode-api";

import * as vscode from "vscode";

import fs from "fs";
import path from "path";

import { LeetProblemProvider, LeetHeading } from "./LeetProblemBrowse.js";

import { SolutionRunnerProvider } from "./solution-runner/SolutionRunner.js";

const fileNameLength = 20;

/**
 * State manager for the extension. Determines if user is logged in and can access features like submitting runnable solutions
 */
export class Engine {

	/** @type {LeetCode} */
	apiEntry;

	/** @type {boolean} Set to true if there are valid credentials for authenticated access. */
	authenticated;

	/** @type {LeetProblemProvider} */
	sidePanelProvider;

	/** @type {string} Base name of solution source code file. */
	solutionFile;

	/** @type {import("@leetnotion/leetcode-api").Problem} Queried data for the current problem. */
	problemData;

	/** @type {SolutionRunnerProvider} Data provider for the bottom panel view. */
	panelDataProvider;

	/** @type {string} Current language being worked in. */
	currentLanguage;
  

	/**
	 *
	 * Construct an engine with optional sign-in credentials
	 *
	 * @param {vscode.Uri} extensionRootUri Root path of the extension.
	 * @param {string} solutionfilename Name of the solution file to look for.
	 * @param {string} [session] Optional LeetCode session id.
	 * @param {string} [csrf] Optional LeetCode csrf token.
	 */
	constructor(extensionRootUri, solutionfilename, session, csrf) {
		this.authenticated = false;
		this.solutionFile = solutionfilename;
		this.language = "JavaScript";

		if (session && csrf) {
			const cred = new Credential({ csrf: csrf, session: session });
			this.apiEntry = new LeetCode(cred);
			this.apiEntry.whoami().then((wai) => (this.authenticated = wai.isSignedIn));
		} else {
			this.apiEntry = new LeetCode();
		}

		this.sidePanelProvider = new LeetProblemProvider(this.apiEntry);
		this.panelDataProvider = new SolutionRunnerProvider(extensionRootUri);

  }

	/**
	 * Command handler for importing problems
	 *
	 * @param {LeetHeading} heading
	 */
	importProblem(heading) {
		const slug = heading.getSlug();
		console.log("import commanded for", slug);

		this.apiEntry
			.problem(slug)
			.then((p) => (this.problemData = p))
			.catch((err) =>
				vscode.window.showErrorMessage(
				`Error while loading '${heading.problemData.title}': ${err}`,
				),
			)
			.then(this.createSolutionFile.bind(this));
	}

	/**
	 * Getter for side panel data provider.
	 */
	getSidePanelProvider() {
		return this.sidePanelProvider;
	}

	/**
	 * Attempt to create a solution file in the current workspace folder.
	 *
	 * @return {Promise<void>}
	 */
	async createSolutionFile() {
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			vscode.window.showErrorMessage("No workspace is open");
			return;
		}

		// per language configuration can be done here
		const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
		const solutionPath = path.join(workspacePath, `${clampFileName(this.problemData)}.js`);
		const selectedLanguage = this.problemData.codeSnippets.filter((cs) => cs.lang == "JavaScript");
		const content = selectedLanguage[0].code;

		try {
			await fs.promises.writeFile(solutionPath, content);
			vscode.window.showInformationMessage("Solution file created");
		} catch (error) {
			vscode.window.showErrorMessage(`Error creating solution file: ${error.message}`);
		}
	}

	getPanelProvider() {
		return this.panelDataProvider;
	}

	/**
	 * Set the environment language
	 * 
	 * @param {string} language Expect proper name here
	 */
	selectLanguage(language) {

		this.currentLanguage = language;
	}

	/**
	 * Tells the vscode panel to update the content in the solution runner.
	 *
	 * @param {import("@leetnotion/leetcode-api").Problem} problem Problem data queried from Leetcode
	 */
	sendPanelData(problem) {
		this.panelDataProvider.updateContents(problem);
	}

	/**
	 * 
	 * @param {boolean} pageup Set true to get next batch of problems, false to get previous batch
	 */
	pageProblems(pageup) {
		
		const side = this.sidePanelProvider;

		if (pageup)
			side.prevProblemBatch();
		else
			side.nextProblemBatch();
	}
}

function clampFileName(problem) {
	return problem.title.slice(0, fileNameLength).replace(" ", "") + problem.questionFrontendId;
}
