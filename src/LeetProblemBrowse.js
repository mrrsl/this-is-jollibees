import * as vscode from 'vscode';
import {
    LeetCode
} from '@leetnotion/leetcode-api';


const batchSize = 100;

export const Difficulty = {
    EASY: 1,
    MEDIUM: 2,
    HARD: 3,
}

/**
 * Provider for the problem list view
 * 
 * @implements {vscode.TreeDataProvider<LeetItem>}
 */
export class LeetProblemProvider {

    /** @type {Array<Object>} */
    visibleProblemList;

    /** @type {Array<Object>} Cache of fetched questions. */
    cachedProblems;

    /** @type {LeetCode} */
    lcQuery;

    /** @type {{limit?: number, offset?:number, filters?: { difficulty?: "EASY" | "MEDIUM" | "HARD", tags?:string[]}}} */
    currentFilter;

    /** @type {vscode.EventEmitter} */
    changeEmitter;

    /** @type {vscode.Event} */
    onDidChangeTreeData;

    /** @type {number} Number of problems published to date. */
    maxCount;

    /**
     * API object for querying Leetcode.
     * 
     * @param {LeetCode} api 
     */
    constructor(api) {

        this.visibleProblemList = [];
        this.cachedProblems = []
        this.lcQuery = api;
        this.currentFilter = {
            filters: {
                difficulty: null
            },
            offset: 0
        };

        this.reversed = false;

        this.changeEmitter = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.changeEmitter.event;

        this.loadProblems();
    }

    /**
     * Required function.
     *
     * @param {LeetItem} element 
     * 
     * @returns {vscode.TreeItem}
     */
    getTreeItem(element) {
        return element;
    }

    /**
     * Required function.
     * 
     * @param {LeetItem | null} element 
     * 
     * @returns {Thenable<LeetItem[]>}
     */
    getChildren(element) {

        if (!element) {
            return Promise.resolve(this.visibleProblemList);
        }

        return Promise.resolve(element.children);
    }

    /**
     * Appends to the visible problem list.
     * 
     */
    setVisibleProblemList(pList) {

        this.visibleProblemList = pList.map(o => o);

        if (this.reversed) {
            this.visibleProblemList.reverse(); 
        }
        this.changeEmitter.fire();
    }

    /**
     * Loads the entire collection of problems.
     */
    async loadProblems() {
        if (this.cachedProblems.length > 0)
            return;

        let batch = await this.lcQuery.problems();

        const limit = batch.total;
        this.cachedProblems = batch.questions.map(p => new LeetHeading(p));
        
        // Display initial batch so user isn't left waiting
        this.setVisibleProblemList(this.cachedProblems);


        while (this.cachedProblems.length < limit) {

            batch = await this.lcQuery.problems({offset: this.cachedProblems.length});
            const batchHeadings = batch.questions.map(p => new LeetHeading(p));
            this.cachedProblems = [...this.cachedProblems, ...batchHeadings];

            if (this.currentFilter.filters.difficulty) {
                const workingList = this.cachedProblems.filter(q => q.problemData.difficulty.toUpperCase() == this.currentFilter.filters.difficulty);
                this.setVisibleProblemList(workingList);
            }
            else
                this.showAll();
        }
    }

    /**
     * Use {@link Difficulty} for acceptable values.
     * 
     * @param {"EASY" | "MEDIUM" | "HARD"} diff 
     */
    filterByDifficulty(diff) {

        // If the difficulty requested is the same as the one currently being filtered for, then we treat it like a toggle
        if (diff == this.currentFilter.filters.difficulty) {
            this.currentFilter.filters.difficulty = null;
            this.showAll();
            return;
        }

        switch(diff) {
            case "EASY":
                this.currentFilter.filters.difficulty = "EASY";
                this.showDifficulty("Easy");
                break;

            case "MEDIUM":
                this.currentFilter.filters.difficulty = "MEDIUM";
                this.showDifficulty("Medium");
                break;

            case "HARD":
                this.currentFilter.filters.difficulty = "HARD";
                this.showDifficulty("Hard");
                break;
        }
    }


    /**
     * Set the visible items to all the items in the cached problems collection
     */
    showAll() {
        this.setVisibleProblemList(this.cachedProblems);
    }

    /**
     * 
     * @param {"Easy" | "Medium" | "Hard"} diffString 
     */
    showDifficulty(diffString) {
        const filtered = this.cachedProblems.filter(q => q.problemData.difficulty == diffString);
        this.setVisibleProblemList(filtered);
    }

    /**
     * Sort order toggle.
     */
    toggleSortOrder() {
    this.reversed = !this.reversed;
    this.visibleProblemList.reverse();
    this.changeEmitter.fire(null);
    }
}

/**
 * Tree item showing individual problem details.
 * 
 * @extends vscode.TreeItem
 */
export class LeetItem extends vscode.TreeItem {

    /** @type {LeetItem[]} */
    children;

    /**
     * Construct a tree item with a visible label.
     * 
     * @param {string} text Visible text.
     * @param {vscode.TreeItemCollapsibleState} collapse Set to true if item should be expaneded
     */
    constructor(text, collapse) {
        super(text, collapse);
    }
}

export class LeetHeading extends LeetItem {

    /** @type {import("@leetnotion/leetcode-api").Problem}*/
    problemData

    /**
     * @param {any} data Individual element from the {@link ProblemList} `questions` array
     */
    constructor(data) {
        super(`${data.questionFrontendId}. ${data.title}`, vscode.TreeItemCollapsibleState.Collapsed);

        this.children = [];
        this.problemData = data;
        this.tooltip = (data.topicTags[0]) ? data.topicTags[0].name : null;

        this.contextValue = "importable";

           this.resourceUri = vscode.Uri.parse(
            `leet-difficulty:/${encodeURIComponent(data.difficulty)}`
        );
    

        const percentFormat = /\d{1,2}.\d\d/;
        
        let acRateFormatted = new String(data.acRate);
        let acRateMatches = acRateFormatted.match(percentFormat);
        if(acRateMatches != null){
            acRateFormatted = acRateMatches[0];
        }
    

        const difficultyItem = new LeetColoredText(`Difficulty: ${data.difficulty}`, undefined);
        difficultyItem.resourceUri = vscode.Uri.parse(`leet-difficulty:/${encodeURIComponent(data.difficulty)}`);
        this.children.push(difficultyItem);
        this.children.push(new LeetColoredText(`Acceptance Rate: ${acRateFormatted}%`, new vscode.ThemeColor("leet.lowacceptance")));
    }

    /**
     * Retrieve the slug used for the Leetcode problem URL.
     */
    getSlug() {
        if (this.problemData == null)
            return "";
        else {
            return this.problemData.titleSlug;
        }
    }
}

/**
 * Colored text for the LeetItem collapsible sections.
 * 
 */
export class LeetColoredText extends LeetItem {

    /**
     * 
     * @param {string} text Text to display
     * @param {vscode.ThemeColor?} color
     */
    constructor(text, color) {
        super(text, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon('blank');
       
        if (color)
            this.color = color;

    }
}

export class DifficultyDecorationProvider {
    constructor() {
        this._onDidChangeFileDecorations = new vscode.EventEmitter();
        this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
    }

    provideFileDecoration(uri) {
        if (uri.scheme !== 'leet-difficulty') return undefined;

        const difficulty = decodeURIComponent(uri.path.slice(1));

        if (/easy/i.test(difficulty)) {
            return { color: new vscode.ThemeColor('testing.iconPassed') };   // green
        }
        if (/medium/i.test(difficulty)) {
            return { color: new vscode.ThemeColor('list.warningForeground') }; // yellow
        }
        if (/hard/i.test(difficulty)) {
            return { color: new vscode.ThemeColor('testing.iconFailed') };   // red
        }

        return undefined;
    }
}