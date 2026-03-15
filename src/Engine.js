import { LeetCode, Credential } from "@leetnotion/leetcode-api";

import * as vscode from "vscode";

import fs from "fs";
import path from "path";

import { LeetProblemProvider, LeetHeading, Difficulty } from "./LeetProblemBrowse.js";

import { ProblemDescriptionProvider } from "./problem-description/ProblemDescription.js";

import { SlugMap } from "./SlugMap.js";

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

	/** @type {ProblemDescriptionProvider} Data provider for the bottom panel view. */
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
		this.panelDataProvider = new ProblemDescriptionProvider(extensionRootUri);
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
    		const problemPath = path.join(workspacePath, clampFileName(this.problemData));

        try {
            if (!fs.existsSync(problemPath)) {
                fs.mkdirSync(problemPath);
            }
            else {
                vscode.window.showInformationMessage("Problem has already been imported!");
            }
        } catch (error) {
            vscode.window.showErrorMessage(
                `Error creating ${clampFileName(this.problemData)} folder: ${error.message},`,
            );
        }
        
        const solutionPath = path.join(problemPath, "solution.js");
        const selectedLanguage = this.problemData.codeSnippets.filter((cs) => cs.lang == "JavaScript");
        const content = selectedLanguage[0].code;

        //create solution file
        try {
            if (!fs.existsSync(solutionPath)) {
                await fs.promises.writeFile(solutionPath, content);
                vscode.window.showInformationMessage("Solution file created");
            }

            const fileUri = vscode.Uri.file(solutionPath);
            const doc = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(doc, { 
            viewColumn: vscode.ViewColumn.Active,
            preview: false  // forces a permanent tab, not a preview tab
            });
						
        } catch (error) {
            vscode.window.showErrorMessage(`Error creating solution file: ${error.message}`);
        }
				
				//create file with test cases
				const testCasesPath = path.join(problemPath, "tests.js");
				try {
					const testContent = (await this.generateTests())?.text || "//LLM failed to respond.";
					if (!fs.existsSync(testCasesPath)) {
                await fs.promises.writeFile(testCasesPath, testContent);
                vscode.window.showInformationMessage("tests file created");
          }						
				} catch (e) {
					vscode.window.showErrorMessage(`lowkey i have no clue what the problem is. ${e.message}`)
				}

        //update panel data
        this.sendPanelData(this.problemData);
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
	 * @returns the test cases generated by Copilot
	 */
	async generateTests() {
		const models = await vscode.lm.selectChatModels({
			vendor: 'copilot',
			family: 'gpt-4o'
			});

		const model = models[0];
		if (!model) {
			vscode.window.showErrorMessage('No Copilot model available, unable to generate test cases.')
			return;
		}

		const messages = [
			vscode.LanguageModelChatMessage.User(`You are a software engineer trying to create test cases in` + this.currentLanguage + ` for a leetcode problem to test all general and edge cases.`),
			vscode.LanguageModelChatMessage.User(`This is the problem description, generate me test cases for the following problem: ` + this.problemData.content)
		];
			
		const tokenSource = new vscode.CancellationTokenSource();
		const response = await model.sendRequest(messages, {}, tokenSource.token);

		return response;
	}

	/**
	 * Handles tab change events so we know what we're working on
	 * @param {vscode.TextEditor} editor 
	 */
	async tabChangeHandler(editor) {
		const filename = editor.document.uri.fsPath;
		const directoryname = path.dirname(filename);

		const matches = directoryname.match(/\d+$/);
		const index = parseInt(matches[0]);
		const updatedSlug = SlugMap[index - 1];
		
		this.problemData = await this.apiEntry.problem(updatedSlug);
		this.sendPanelData(this.problemData);
	}

	/** Filter for only hard problems. */
	filterHard() {
		this.sidePanelProvider.filterByDifficulty("HARD");
	}

	/** Filter for only medium problems. */
	filterMedium() {
		this.sidePanelProvider.filterByDifficulty("MEDIUM");
	}

	/** Filter for only easy problems. */
	filterEasy() {
		this.sidePanelProvider.filterByDifficulty("EASY");
	}
}

function clampFileName(problem) {
	return problem.title.replaceAll(" ", "") + ("-") + problem.questionFrontendId;
}
