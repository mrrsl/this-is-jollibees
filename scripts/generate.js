/*
Generate an array mapping problem front-end ids to problem slugs
*/

import { LeetCode } from "@leetnotion/leetcode-api";
import * as fs from "fs";
import * as path from "path";

const lc = new LeetCode();
const slugArray = [];

const targetPath = path.join(process.cwd(), "src", "SlugMap.js");

lc.problems().then(async pset => {

    let remaining = pset.total - pset.questions.length;

    pset.questions.forEach(q => {
        slugArray.push(q.titleSlug);
    });



    while (remaining > 0) {
        console.log(`${pset.total} Questions Total - ${remaining} Questions remaining`);
        const problems = await lc.problems({offset: pset.total - remaining});
        remaining -= problems.questions.length;

        problems.questions.forEach(q => {
            slugArray.push(q.titleSlug);
        }); 
    }

    const mapFile = fs.createWriteStream(targetPath);
    mapFile.write(`// Generated on ${new Date().toLocaleDateString()}\n`)
    mapFile.write("export const SlugMap = [");
    
    for (let a = 0; a < slugArray.length - 1; a++) {
        mapFile.write(`'${slugArray[a]}'` + ',');
    }
    mapFile.write(`'${slugArray[slugArray.length - 1]}'` + '];');
});