import * as assert from "assert";
import * as vscode from "vscode";
import { LeetCode } from "@leetnotion/leetcode-api";

import { SampleRunner } from "../src/SampleRunner.js";

// const myExtension = require('../extension');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample Runner Test', async () => {
		
		const sampleSolution = `var mostCommonWord = function(paragraph, banned) {
			paragraph = paragraph.toLowerCase();
			const bannedMap = {};
			const freqMap = {};

			for (const bword of banned)
				bannedMap[bword] = true;

			const words = paragraph.match(/\w+/);

			words.forEach((matchedWord) => {
				if (bannedMap[matchedWord])
					return;
				if (freqMap[matchedWord])
					freqMap[matchedWord] = freqMap[matchedWord] + 1;
				else
					freqMap[matchedWord] = 1;
			});

			let commonWord;
			let highestCount = -1;

			for (const word of Object.keys(freqMap)) {
				if (freqMap[word] > highestCount) {
					commonWord = word;
					highestCount = freqMap[word];
				}
			}

			return commonWord;

		};`;

		const sampleTestCase = `"Bob hit a ball, the hit BALL flew far after it was hit."\n["hit"]\n"a."\n[]`;

		const pdata = await (new LeetCode().problem("most-common-word"));
		const runner = new SampleRunner(pdata, sampleSolution);

		const results = runner.run(pdata.sampleTestCase);
		assert.equal(results.passedTests, results.totalTests);
	});
});
