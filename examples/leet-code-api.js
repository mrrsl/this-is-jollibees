import { LeetCode } from '@leetnotion/leetcode-api';

const entrypoint = new LeetCode();

/** 
 * Example filter, everything is optional
 * 
 * @type {import("@leetnotion/leetcode-api").QueryParams}
 */ 
const problemFilter = {
    filters: {

        // "EASY" | "MEDIUM" | "HARD"
        difficulty: null,
        tags: ["Dynamic Programming"]
    },
    limit: 10
}

// Get problems
const p = entrypoint.problems(problemFilter);

p.then((plist) => {
    for (const prob of plist.questions) {
        console.log(`Problem title: ${prob.title}, AC rate: ${prob.acRate}, tagID: ${prob.questionFrontendId}`);
    }
});