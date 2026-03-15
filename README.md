# PLPYF (Practice LeetCode Problems You Freak)

This is a Visual Studio Code Extension that exports all LeetCode problems into Visual Studio for easier ease of access and practicing purposes. You can then import them from our extensio into your own workspace and generate test cases that will check all the edge cases for the problem.

## How to Use
* Install extension in Visual Studio Code
* Open extension
* Browse problems and click "Import this problem"
* Start Practicing
* Click the icon on the top right of the bottom panel view to generate test cases that you can copy in
* Change the language you're working with in the Problem Description tab on the bottom panel to generate a new file with the new extension. 
* Any test case files generated will take on the file type of the language you generated it from

## We used
* Javascript for all the backend of the extension
* Leetcode API to get all the leetcode problems
* Gemini API to generate test cases based on the problem prompt

## Features
* In the extension view, all 3000+ LeetCode problems are available to be imported and worked on
* They are colour coded green, yellow, and red, to display the difficulties easy, medium, and hard respectively
* The bottom panel has a new tab called "Problem Views" where the problem's description will be displayed when imported or switched to
* There is a dropdown menu at the very top of the "Problem Views" panel for you to select your language, but it sits at Javascript as a default
* When changing languages, it creates a new file with the new langauge's extension, and the starting code of that language. The previous file is still kept
* To generate test cases, click the icon on the top right of the panel to generate tests. This may take a moment as the extension prompts the Gemini AI with the problem and waiting for the response
* The test case file generates as the extension type of the solution file you prompted it from
* The test cases generated are formatted with a new parameter on each line, the same way Leetcode has their test cases
* Our test cases are generated to test edge cases and any other hyper-specific scenario to test all extremities

## Notes
* Language support is limited due to the many other dependencies you have to install with specific languages, ex. C++

## Members :
Ryan Guan<br/>
Morris Li<br/>
Grace Yang<br/>
Julia Ziebart
