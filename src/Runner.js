/**
 * Runs a solution against some given inputs and expected values
 */

export class Runner {
    /**
     * 
     * @param {string} problemMetaData Object string with the following structure
     * ```ts
     * {
     *      name: string,
     *      params: {
     *          name: string,
     *          type: string
     *      }[],
     *      return: {
     *          type: string
     *      }
     * }
     * ``` 
     * @param {string} sampleCases Text containing sample cases with the following structure
     * ```
     * case1_arg1
     * case1_arg2
     * ...
     * case1_expected
     * case2_arg1
     * case2_arg2
     * ...
     * case2_expected
     * ...
     * ```
     * @param {string} solutionText Raw text of the solution to be submitted.
     */
    constructor(problemMetaData, sampleCases, solutionText) {

    }
}