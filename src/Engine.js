import {
    LeetCode,
    Credential
} from '@leetnotion/leetcode-api';

import * as vscode from 'vscode';

import {
    LeetProblemProvider,
    LeetHeading
} from './LeetProblemBrowse.js'

/**
 * State manager for the extension. Determines if user is logged in and can access features like submitting runnable solutions
 */
export class Engine {

    /** @type {LeetCode} */
    apiEntry;

    /** @type {boolean} Set to true if there are valid credentials for authenticated access. */
    authenticated;

    /** @type {vscode.TreeDataProvider} */
    sidePanelProvider

    /**
     * 
     * Construct an engine with optional sign-in credentials
     * 
     * @param {string} [session] Optional LeetCode session id.
     * @param {string} [csrf] Optional LeetCode csrf token.
     */
    constructor(session, csrf) {

        this.authenticated = false;

        this.sidePanelProvider = new LeetProblemProvider();

        if (session && csrf) {

            const cred = new Credential({csrf: csrf, session: session});
            this.apiEntry = new LeetCode(cred);
            this.apiEntry.whoami().then(wai => this.authenticated = wai.isSignedIn);

        }
        else {
            this.apiEntry = new LeetCode();
        }
    }

    /**
     * Command handler for importing problems
     * 
     * @param {LeetHeading} heading 
     */
    importProblem(heading) {
        
        const slug = heading.getSlug();
        console.log("import commanded for", slug);

        // Use entryApi to retrieve problem data using problem(slug), remember it is async
    }

    getSidePanelProvider() {
        return this.sidePanelProvider;
    }
}