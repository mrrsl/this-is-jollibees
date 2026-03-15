import { LeetCode, Credential } from "@leetnotion/leetcode-api";

import * as vscode from "vscode";

import fs from "fs";
import path from "path";

import { LeetProblemProvider, LeetHeading, Difficulty } from "./LeetProblemBrowse.js";

import { ProblemDescriptionProvider } from "./problem-description/ProblemDescription.js";

import { SlugMap } from "./SlugMap.js";

import { languages } from "./languages.js";

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
		this.currentLanguage = "JavaScript";

		if (session && csrf) {
			const cred = new Credential({ csrf: csrf, session: session });
			this.apiEntry = new LeetCode(cred);
			this.apiEntry.whoami().then((wai) => (this.authenticated = wai.isSignedIn));
		} else {
			this.apiEntry = new LeetCode();
		}

		this.sidePanelProvider = new LeetProblemProvider(this.apiEntry);
		this.panelDataProvider = new ProblemDescriptionProvider(extensionRootUri);

		this.setupLanguageChange();
	}

	/**
	 * Sets up the handler for when user changes the language they're working in.
	 */
	setupLanguageChange() {
		this.panelDataProvider.onLanguageChange = async (newLanguage) => {
		this.currentLanguage = newLanguage;

			if (this.problemData) {
				const problemPath = await this.createProblemFolder();

				if (problemPath) {
					await this.createSolutionFile(problemPath);
				}

				this.sendPanelData(this.problemData);
				vscode.window.showInformationMessage(`Language changed to ${newLanguage}`);
			}
		};
	}

	/**
	 * Calls the functions to import the current problem folder and solution file into the user workspace.
	 * @returns false if the problem folder could not be created, otherwise no return value
	 */
	async importProblemFiles() {
		const problemPath = await this.createProblemFolder();
		if (!problemPath) return;

		await this.createSolutionFile(problemPath);
		this.sendPanelData(this.problemData);
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
			.then(this.importProblemFiles.bind(this));
	}

	/**
	 * Getter for the main panel provider.
	 * 
	 * @returns the main panel provider
	 */
	getPanelProvider() {
		return this.panelDataProvider;
	}

	/**
	 * Getter for side panel data provider.
	 * 
	 * @returns the side panel provider
	 */
	getSidePanelProvider() {
		return this.sidePanelProvider;
	}

	/**
	 * Attempts to create a folder for the current problem and returns the path to that folder.
	 * @returns the path to the problem folder as a string
	 */
	async createProblemFolder() {
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
        } catch (error) {
            vscode.window.showErrorMessage(
                `Error creating ${clampFileName(this.problemData)} folder: ${error.message},`,
            );
        }

		return problemPath;
	}

	/**
	 * Creates a solution file with the code snippet from the Leetcode problem data and saves it in problemPath.
	 * 
	 * @param {string} problemPath the path to the problem folder of that specific question, where the solution file should be created.
	 */
	async createSolutionFile(problemPath) {
		const langConfig = languages[this.currentLanguage];
		const fileType = typeof langConfig === 'object' ? langConfig.extension : "js";
		const solutionPath = path.join(problemPath, `solution.${fileType}`);
        const selectedLanguage = this.problemData.codeSnippets.filter((cs) => cs.lang == this.currentLanguage);
        const content = selectedLanguage[0].code;

        try {
            if (!fs.existsSync(solutionPath)) {
                await fs.promises.writeFile(solutionPath, content);
                vscode.window.showInformationMessage("Solution file created");
            } else {
				vscode.window.showInformationMessage("Solution file already exists.");
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
	}

	/**
	 * Creates a test case file with the response generated by Copilot and saves it in problemPath.
	 * 
	 * @param {string} problemPath the path to the problem folder of that specific question, where the tests file should be created.
	 */
	async createTestsFile(problemPath) {
		const langConfig = languages[this.currentLanguage];
		const fileType = typeof langConfig === 'object' ? langConfig.extension : "js";
		const testCasesPath = path.join(problemPath, `tests.${fileType}`);
		try {
			const testContent = (await this.generateTests()) || "//LLM failed to respond.";
			if (!fs.existsSync(testCasesPath)) {
				await fs.promises.writeFile(testCasesPath, testContent);
				vscode.window.showInformationMessage("Tests file created");
			}	
		} catch (e) {
			vscode.window.showErrorMessage(`Problem folder does not exist! Somehow? ${e.message}`)
		}

        //update panel data
        this.sendPanelData(this.problemData);
	} 

	/**
	 * Tells the vscode panel to update the content in the solution runner.
	 *
	 * @param {import("@leetnotion/leetcode-api").Problem} problem Problem data queried from Leetcode
	 */
	sendPanelData(problem) {
		this.panelDataProvider.updateContents(problem, this.currentLanguage);
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

		// to parse the response stream into a string
		let result = ``;
		for await (const part of response.text) {
			result += part;
		}

		return result;
	}

	/**
	 * Handles tab change events so we know what we're working on
	 * @param {vscode.TextEditor} editor 
	 */
	async tabChangeHandler(editor) {
		const filename = editor.document.uri.fsPath;
		const directoryname = path.dirname(filename);

		// detects the new file type and updates current language
		const ext = path.extname(filename).slice(1); // e.g. "java", "py"
		const detectedLang = Object.keys(languages).find(k => languages[k].extension === ext);
		if (detectedLang) {
			this.currentLanguage = detectedLang;
		}

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
