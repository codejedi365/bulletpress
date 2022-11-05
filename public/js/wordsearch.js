
(function (factory) {
    this.Dictionary = factory();
}.bind(window, function () {

    const wordTypeRegex = RegExp(/\btype:(verb)?\b/i);
    const lenRegex = RegExp(/\blen(?:gth)?:([0-9][0-9]?)?\b/i);
    const leaderRegex = RegExp(/\b(?:led|(?:lead(?:er(?:ship)?)?)):(true|y(?:es?)?|false|n(?:o)?)?\b/i);

    let words = null;
    let prevSearchTokens = null;
    let prevResults = null;

    /**
     * 
     * @returns {{ word: string, type: string, strength: number, leadership: boolean }[]}
     */
    function getWordList() {
        if (words === null) {
            words = [];
            if (VerbsList) {
                words = [
                    ...VerbsList["verbs"]
                ];
            } else {
                console.error("VerbsList does not exist.")
            }
        }
        return words;
    }

    /**
     * 
     * @param {string} searchstr 
     * @returns {{ word: string, type: string, strength: number, leadership: boolean }[]}
     */
    function cachedSearch(searchstr) {
        let results = prevResults;
        let searchTokens = preprocess_search_args(searchstr);
        if (searchTokens.join(' ') === prevSearchTokens) {
            return results;
        }
        let searchTokenDef = process_cmd_args(searchTokens);
        if (searchTokenDef['searchstr'] !== prevSearchTokens) {
            results = search(searchTokenDef['cmds'], searchTokenDef['plain']);
            prevResults = results; // save off results
            prevSearchTokens = searchTokenDef['searchstr']; // save off terms that created results
        }
        return results;
    }

    /**
     * 
     * @param {string} searchstr 
     * @returns {string[]}
     */
    function preprocess_search_args(searchstr) {
        if (searchstr === undefined || searchstr === null) {
            return [];
        } else if (typeof searchstr !== "string") {
            throw TypeError("Invalid parameter type.");
        } else if (searchstr.trim().length === 0) {
            return [];
        }
        return searchstr.trim().replace(/\s*:\s*/g, ':').split(/\s+/);
    }

    /**
     * 
     * @param {string[]} tokens 
     * @returns {{ cmds: string[], plain: string[], searchstr: string }}
     */
    function process_cmd_args(tokens) {
        let tokenDef = { 'cmds': [], 'plain': [], 'searchstr': "" };
        if (Array.prototype !== Object.getPrototypeOf(tokens)) {
            throw TypeError("Invalid parameter type.");
        } else if (tokens.length === 0) {
            return tokenDef;
        }
        // Parse user input for search commands/filters
        let regex_match = null;
        let first_group_matching_regexes = [
            lenRegex,
            wordTypeRegex,
            leaderRegex
        ];
        tokens.forEach((token) => {
            if (token.includes(":")) {
                cmd_parts = token.split(":")
                if (cmd_parts[cmd_parts.length - 1].length === 0) {
                    // Detected an incomplete command, ignore token
                    return;
                }
                for (let i = 0; i < first_group_matching_regexes.length; i++) {
                    if (!(regex_match = first_group_matching_regexes[i].exec(token))) {
                        continue;
                    }
                    if (regex_match[1] !== undefined || regex_match[1]) {
                        break;
                    }
                    regex_match = null;
                }
                if (!regex_match) return; // Unknown or incomplete command so ignore/drop
                tokenDef['cmds'].push(token);
                return;
            }
            tokenDef['plain'].push(token.toLowerCase());
        });
        tokenDef['searchstr'] = [...tokenDef['cmds'], ...tokenDef['plain']].join(' ');
        return tokenDef;
    }

    /**
     * 
     * @param {string[]} cmdTokens
     * @param {string[]} spellingTokens
     * @returns {{ word: string, type: string, strength: number, leadership: boolean }[]}
     */
    function search(cmdTokens, spellingTokens) {
        if (Array.prototype !== Object.getPrototypeOf(cmdTokens)) {
            throw TypeError("Invalid parameter type for cmdTokens.");
        } else if (Array.prototype !== Object.getPrototypeOf(spellingTokens)) {
            throw TypeError("Invalid parameter type for spellingTokens.");
        } else if ((cmdTokens.length + spellingTokens.length) === 0) {
            return getWordList();
        }
        
        // Determine filters from commands (since preprocessed, cmds should be valid)
        let maxLen = null;
        let filter4Verbs = false;
        let filter4leadership = null; // type: null | true | false
        let lenMatch = null;
        let wordTypeMatch = null;
        let leaderMatch = null;
        cmdTokens.forEach((token) => {
            if (lenMatch = lenRegex.exec(token)) {
                if (!lenMatch[1] || false) return;
                maxLen = Number.parseInt(lenMatch[1]); // Group 1 = number value
                return;
            }
            if (wordTypeMatch = wordTypeRegex.exec(token)) {
                let desiredType = wordTypeMatch[1];
                if (!desiredType) return;
                let typeMatch = RegExp(/^(verb)$/i).exec(desiredType);
                let group2index = {
                    "verb": 1
                }
                // Iterate through groups (which start at index 1)
                for (let i = 1, matchGrp = typeMatch[i]; i < typeMatch.length; i++) {
                    if (matchGrp === undefined) {
                        continue; // undefined means the group was not found
                    }
                    switch (i) {
                        case group2index["verb"]: // group 1 == verb
                            filter4Verbs = true;
                            break;
                        default:
                            break;
                    }
                }
                return;
            }
            if (leaderMatch = leaderRegex.exec(token)) {
                let answer = leaderMatch[1];
                if (!answer) return;
                filter4leadership = RegExp(/y(?:es?)?|true/i).test(answer);
                return;
            }
        });

        // Determine filters from basic spelling/regex tokens
        let spellingFilters = [];
        spellingTokens.forEach((token) => {
            try {
                let filter4spelling = RegExp(token.toLowerCase());
                spellingFilters.push(filter4spelling);
            } catch (err) {} // Ignore filter if regexp parsing fails
        });
    
        const activeFilterFns = [
            (spellingFilters.length === 0) ? null : (wordSpec) => {
                return spellingFilters.reduce((prev, thisRegex) => {
                    return (!prev)  // already false, don't test
                        ? prev      // just return false
                        : thisRegex.test(wordSpec["word"])
                }, true) // assume true at first
            },
            (!filter4Verbs) ? null : (wordSpec) => wordSpec["type"] === "verb",
            (filter4leadership === null) ? null : (wordSpec) => wordSpec["leadership"] === filter4leadership,
            (maxLen === null) ? null : (wordSpec) => wordSpec["word"].length === maxLen
        ].filter((func) => func !== null);
    
        // generate resulting filtered wordlist definitions
        return getWordList().filter((wordDef) => {
            let allowed;
            let filterFn;
            for (let i = 0; i < activeFilterFns.length; i++) {
                filterFn = activeFilterFns[i];
                allowed = filterFn(wordDef);
                if (!allowed) return false;
            }
            return true;
        });
    }

    return Object.freeze({
        get wordList() { return getWordList(); },
        search(searchstr) { return cachedSearch(searchstr); }
    });

}))();
