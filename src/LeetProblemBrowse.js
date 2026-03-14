import * as vscode from 'vscode';
import {
    LeetCode
} from '@leetnotion/leetcode-api';


const batchSize = 100;

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

    /** @type {number} Number for paging problem queries. */
    problemListOffset;

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
        this.lcQuery = api;
        this.problemListOffset = 0;
        this.changeEmitter = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.changeEmitter.event;

        this.getProblems(this.problemListOffset).then(

        );
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
     * @param {import("@leetnotion/leetcode-api").ProblemList} pList Problem list returned by the `problems` function.
     */
    processProblemList(pList) {
        
        const additions = pList.questions.map(p => new LeetHeading(p.questionFrontendId, p.title, p));

        this.visibleProblemList = additions;

        return Promise.resolve(this.visibleProblemList);
    }

    /**
     * Progressively retrieve the entire Leetcodep problem set.
     * 
     * @param {number} [offset]
     * 
     * @returns {Promise<LeetItem[]>}
     */
    async getProblems(offset) {

        this.problemListOffset = (offset) ? offset : 0;
        const filter = {
            offset: this.problemListOffset
        }
        let plist = await this.lcQuery.problems(filter);
        this.processProblemList(plist);
        this.maxCount = plist.total;

        // notify consumers that the tree data changed (root refreshed)
        this.changeEmitter.fire(null);

        return this.visibleProblemList;
    }

    /**
     * Get the next batch of problems to display.
     */
    nextProblemBatch() {
        
        const nextOffset = this.problemListOffset + batchSize;

        if (nextOffset >= this.maxCount)
            return

        return this.getProblems(nextOffset);
    }

    /**
     * Get the previous batch of problems to display.
     */
    prevProblemBatch() {

        let prevOffset = this.problemListOffset - batchSize;

        if (prevOffset < 0)
            prevOffset = 0;

        return this.getProblems(prevOffset)
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
     * 
     * @param {string | number} num 
     * @param {string} title 
     * @param {any} data Individual element from the {@link ProblemList} `questions` array
     */
    constructor(num, title, data) {
        super(`${num}. ${title}`, vscode.TreeItemCollapsibleState.Collapsed);

        this.children = [];
        this.problemData = data;;

        this.contextValue = "importable";

        

        const percentFormat = /\d{1,2}.\d\d/;
        
        let acRateFormatted = new String(data.acRate);
        acRateFormatted = acRateFormatted.match(percentFormat)[0];

        this.children.push(new LeetColoredText(`Difficulty: ${data.difficulty}`, new vscode.ThemeColor("leet.lowacceptance")));
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
       
        if (color)
            this.color = color;

    }
}