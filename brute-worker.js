/**
 * Web Worker for Brute Force Phrase Solver
 * Generates Cartesian product of letters across puzzle lines,
 * filters by keywords, and reports progress back to the main thread.
 */

self.onmessage = function (e) {
    const { lines, keywords, maxIterations } = e.data;
    const upperKeywords = (keywords || []).map(k => k.toUpperCase().trim()).filter(Boolean);
    const limit = maxIterations || 1000000;

    const results = [];
    let count = 0;
    let stoppedByLimit = false;

    // Pre-compute: for each line, extract just the letter arrays
    const letterArrays = lines.map(line => {
        if (!line || line.length === 0) return ['?'];
        // Deduplicate letters per line
        const unique = [...new Set(line.map(opt => opt.letter))];
        return unique.length > 0 ? unique : ['?'];
    });

    // Calculate total combinations for progress reporting
    let totalCombinations = 1n;
    for (const arr of letterArrays) {
        totalCombinations *= BigInt(arr.length);
        if (totalCombinations > BigInt(limit) * 2n) {
            totalCombinations = BigInt(limit) * 2n; // cap for display
            break;
        }
    }
    const totalFloat = Number(totalCombinations > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(limit) : totalCombinations);

    // Iterative Cartesian product using index tracking (no recursion, no stack overflow)
    const numLines = letterArrays.length;
    const indices = new Array(numLines).fill(0);
    const progressInterval = Math.max(1, Math.floor(totalFloat / 200)); // report ~200 times

    while (true) {
        // Build the current string
        let str = '';
        for (let i = 0; i < numLines; i++) {
            str += letterArrays[i][indices[i]];
        }

        count++;

        // Filter by keywords
        if (upperKeywords.length === 0 || upperKeywords.some(kw => str.includes(kw))) {
            results.push(str);
            // Safety: cap results array too
            if (results.length >= 10000) {
                stoppedByLimit = true;
                break;
            }
        }

        // Progress report every N iterations
        if (count % progressInterval === 0) {
            self.postMessage({
                type: 'progress',
                count,
                total: totalFloat,
                resultsFound: results.length
            });
        }

        // Safety limit
        if (count >= limit) {
            stoppedByLimit = true;
            break;
        }

        // Increment indices (rightmost first, like an odometer)
        let carry = true;
        for (let i = numLines - 1; i >= 0 && carry; i--) {
            indices[i]++;
            if (indices[i] < letterArrays[i].length) {
                carry = false;
            } else {
                indices[i] = 0;
            }
        }

        // If carry is still true, we've exhausted all combinations
        if (carry) break;
    }

    self.postMessage({
        type: 'done',
        validResults: results,
        totalProcessed: count,
        stoppedByLimit
    });
};
