import * as vscode from 'vscode';

/**
 * Provider for the problem list view
 * 
 * @implements vscode.TreeDataProvider<LeetItem>
 */
export class LeetProblemProvider {

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
            return Promise.resolve([
                new LeetItem("Two Sum"),
                new LeetItem("Add Two Numbers"),
                new LeetItem("Longest Substring")
            ]);
        }

        return Promise.resolve([]);
    }
}

/**
 * @extends vscode.TreeItem
 */
export class LeetItem extends vscode.TreeItem {

    /**
     * Construct a tree item with a visible label.
     * 
     * @param {string} label Text shown by the tree item.
     */
    constructor(label) {
        super(label, vscode.TreeItemCollapsibleState.None);
    }
}