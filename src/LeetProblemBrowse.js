import * as vscode from 'vscode';
import {
    LeetCode
} from '@leetnotion/leetcode-api';

const sampleProblemQueryFilters = {
    filters: {
    },
    limit: 20
};

/**
 * Provider for the problem list view
 * 
 * @implements {vscode.TreeDataProvider<LeetItem>}
 */
export class LeetProblemProvider {

    /** @type {Array<Object>} */
    visibleProblemList;

    /** @type {LeetCode} */
    lcQuery;

    constructor() {
        this.visibleProblemList = [];
        this.lcQuery = new LeetCode();
    }

    /**
     * 
     * 
     * @param {LeetItem} element 
     * 
     * @returns {vscode.TreeItem}
     */
    getTreeItem(element) {
        return element;
        
    }

    /**
     * 
     * @param {LeetItem | null} element 
     * 
     * @returns {Thenable<LeetItem[]>}
     */
    getChildren(element) {

        if (!element) {
            return this.lcQuery.problems(sampleProblemQueryFilters).then(this.processProblemList.bind(this));
        }

        return Promise.resolve(element.children);
    }

    /**
     * Process problem data for the displayed list.
     * 
     * @param {import("@leetnotion/leetcode-api").ProblemList} pList Problem list returned by the `problems` function.
     * 
     * @return {Thenable<vscode.TreeItem[]>} Array of generated tree items.
     */
    processProblemList(pList) {

        for (const prob of pList.questions) {
            this.visibleProblemList.push(new LeetHeading(prob.questionFrontendId, prob.title, prob));
        }

        return Promise.resolve(this.visibleProblemList);
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

class LeetHeading extends LeetItem {

    /** @type {import("@leetnotion/leetcode-api").Problem}*/
    problemData


    /**
     * 
     * @param {string | number} num 
     * @param {string} title 
     * @param {any} data 
     */
    constructor(num, title, data) {
        super(`${num}. ${title}`, vscode.TreeItemCollapsibleState.Collapsed);

        this.children = [];
        this.problemData = data;

        const percentFormat = /\d{1,2}.\d\d/;
        
        let acRateFormatted = new String(data.acRate);
        acRateFormatted = acRateFormatted.match(percentFormat)[0];

        this.children.push(new LeetColoredText(`Difficulty: ${data.difficulty}`, null));
        this.children.push(new LeetColoredText(`Acceptance Rate: ${acRateFormatted}%`, new vscode.ThemeColor("leet.lowacceptance")));
        this.children.push(new LeetImportButton(data.questionFrontendId));
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
       
        if (color)
            this.color = color;

    }
}

/**
 * Import button to set up the local dev environment
 */
export class LeetImportButton extends LeetItem {

    problemNumber;

    /**
     * @param {any} problemNumber 
     */
    constructor(problemNumber) {
        super("Import", vscode.TreeItemCollapsibleState.None);

        this.problemNumber = problemNumber;
    }
}