const { useState, useMemo, useEffect } = React;

function matchesBlockStructure(wordLengths, blockLengths) {
  let wIndex = 0;
  for (let b = 0; b < blockLengths.length; b++) {
    let currentSum = 0;
    let foundMatch = false;
    while (wIndex < wordLengths.length) {
      currentSum += wordLengths[wIndex];
      wIndex++;
      if (currentSum === blockLengths[b]) {
        foundMatch = true;
        break;
      } else if (currentSum > blockLengths[b]) {
        return false;
      }
    }
    if (!foundMatch) return false;
  }
  return wIndex === wordLengths.length;
}

function matchRowToCity(row, cityObj) {
  const blockLengths = row.blocks.map(block => {
    let count = 0;
    block.forEach(item => {
      if (item.type === 'square' || item.type === 'icon') count++;
    });
    return count;
  });

  return matchesBlockStructure(cityObj.wordLetterCounts, blockLengths);
}

function getVehicleInfo(row, cityObj) {
  if (!cityObj) return null;
  let letterIdx = 0;
  for (let b = 0; b < row.blocks.length; b++) {
    for (let c = 0; c < row.blocks[b].length; c++) {
      const item = row.blocks[b][c];
      if (item.type === 'icon') {
        return {
          type: item.name,
          letter: cityObj.lettersFull[letterIdx] || ''
        };
      }
      if (item.type === 'square' || item.type === 'icon') {
        letterIdx++;
      }
    }
  }
  return null;
}

function VehicleSquare({ type, letter, options = [], onSelect }) {
  if (!letter) {
    if (options.length > 0) {
      return (
        <div className="relative w-10 h-10 mt-1 mb-1 mx-1 bg-beast-800 border-[1.5px] border-beast-button/60 hover:border-beast-button rounded-md flex shrink-0 items-center justify-center text-beast-200 font-extrabold text-xl shadow-lg transition-colors" title={`Select letter for ${type}`}>
          <select
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={(e) => onSelect(e.target.value)}
            value=""
          >
            <option value="" disabled>_</option>
            {options.map((opt, i) => (
              <option key={i} value={opt.cityId}>{opt.letter} ({opt.cityName})</option>
            ))}
          </select>
          <span className="pointer-events-none text-beast-button/70 text-lg">_</span>
        </div>
      );
    }

    return (
      <div className="relative w-10 h-10 mt-1 mb-1 mx-1 bg-gray-600/50 border-2 border-gray-600 rounded-md flex shrink-0 items-center justify-center text-gray-500 font-extrabold text-xl cursor-default" title={`Unsolved - ${type}`}>

      </div>
    );
  }

  return (
    <div className="relative w-10 h-10 mt-1 mb-1 mx-1 bg-yellow-100 border-2 border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.5)] rounded-md flex shrink-0 items-center justify-center text-beast-900 font-extrabold text-xl cursor-default" title={type}>
      {letter}
    </div>
  );
}

function App() {
  const processedCities = useMemo(() => {
    return cities.map(city => {
      const normalized = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const wordsRaw = normalized.split(/[^A-Z]+/);
      const wordLetterCounts = wordsRaw.filter(w => w.length > 0).map(w => w.length);
      const lettersFull = wordsRaw.filter(w => w.length > 0).join('');
      return { id: city, name: city, wordLetterCounts, lettersFull };
    });
  }, []);

  const [selections, setSelections] = useState(() => {
    const init = {};

    // ===== Hardcoded solutions from decoded answer table =====
    // Row numbers are 1-indexed in comments, 0-indexed as keys
    const knownSolutions = {
      0: 'Mosul, Iraq',                   // Row 1 → I
      1: 'Charlotte, North Carolina',     // Row 2 → N
      2: 'Ambanja, Madagascar',           // Row 3 → J
      3: 'Arzamas, Russia',               // Row 4 → I
      4: 'Casper, Wyoming',               // Row 5 → M
      // Row 6: unknown → M
      6: 'Genoa, Italy',                  // Row 7 → Y
      7: 'Gaborone, Botswana',            // Row 8 → S
      8: 'Nova Russas, Brazil',           // Row 9 → V
      9: 'Kabul, Afghanistan',            // Row 10 → A
      // Row 11: unknown → U
      11: 'San Miguel de Tucumán, Argentina', // Row 12 → L
      12: 'Lower Hutt, New Zealand',       // Row 13 → T
      13: 'Natif Waterfalls, Oman',        // Row 14 → F
      14: 'Baku, Azerbaijan',              // Row 15 → I
      // Row 16: unknown → R
      // Row 17: unknown → S
      17: 'Cairo, Egypt',                  // Row 18 → T
      18: 'Pune, India',                   // Row 19 → P
      19: 'Buffalo, New York',             // Row 20 → A
      20: 'Tierra del Fuego',              // Row 21 → R
      21: "Divo, Côte d'Ivoire",           // Row 22 → T
      22: 'Nome, Alaska',                  // Row 23 → S
      23: 'Tallinn, Estonia',              // Row 24 → T
      24: 'Surat, India',                  // Row 25 → I
      25: "L'Ascension, Québec",           // Row 26 → C
      26: 'Antalya, Turkey',               // Row 27 → K
      // Row 28: unknown → S
      28: 'Heard Island, Australia',       // Row 29 → R
      29: 'Krasnodar, Russia',             // Row 30 → O
      30: 'Eyjafjallajökull, Iceland',     // Row 31 → A
      // Row 32: unknown → M (Derby is WRONG, skip it)
      32: 'Beatty, Nevada',               // Row 33 → Y
      33: 'Lima, Peru',                    // Row 34 → R
      34: 'Copenhagen, Denmark',           // Row 35 → E
      35: 'Algiers, Algeria',             // Row 36 → S
      // Rows 37-38: unknown
      38: 'Quito, Ecuador',               // Row 39 → T
      39: 'Arles, France',                // Row 40 → S
      40: 'Istanbul, Turkey',             // Row 41 → I
      41: 'Manaus, Brazil',               // Row 42 → N
      42: 'Visby, Sweden',                 // Row 43 → B
      43: 'Ascension Island',               // Row 44 → E
      44: 'Iturup, Russia',                 // Row 45 → T
      45: 'Christchurch, New Zealand',    // Row 46 → H
      // Row 47: unknown
      47: 'Male, Maldives',                // Row 48 → M
      48: 'Velingrad, Bulgaria',           // Row 49 → N
      49: 'Casablanca, Morocco',           // Row 50 → A
      50: 'Maputo, Mozambique',            // Row 51 → T
      51: 'Ankara, Turkey',               // Row 52 → G
      52: 'Castelo Branco, Portugal',      // Row 53 → G
      // Row 54: unknown
      54: 'Marrakesh, Morocco',            // Row 55 → O
      55: 'Edmonton, Alberta',             // Row 56 → E
      // Row 57: unknown
      57: 'Kupang, Indonesia',             // Row 58 → N
      58: 'Orlando, Florida',              // Row 59 → S
      59: 'Lahore, Pakistan',              // Row 60 → W
      60: 'Monkey Bay, Malawi',            // Row 61 → W
      61: 'Île de la Possession',            // Row 62 → E
      62: 'Tampa Bay, Florida',            // Row 63 → T
      // Row 64: unknown
      64: 'Thane, India',                  // Row 65 → E
      65: 'Marondera, Zimbabwe',           // Row 66 → R
      66: 'Campia Turzi, Romania',         // Row 67 → R
      68: 'Vladivostok, Russia',           // Row 69 → T
      69: 'DeKalb, Illinois',              // Row 70 → A
      70: 'Toad Suck, Arkansas',           // Row 71 → S
      // Row 72: unknown
      72: 'Saint-Pierre',                  // Row 73 → P
      // Row 74: unknown → A
      // Row 75: unknown → R
      75: 'Doha, Qatar',                   // Row 76 → T
      76: 'České Budějovice, Czechia',     // Row 77 → H
      77: 'Yellowknife, Northwest Territories', // Row 78 → E
      78: 'Moscow, Russia',                // Row 79 → S
      79: 'Curicó, Chile',                 // Row 80 → H
      80: 'Cochabamba, Bolivia',            // Row 81 → O
      81: 'Okato, New Zealand',            // Row 82 → W
      // Row 83: unknown → E
      83: 'Sokodé, Togo',                  // Row 84 → D
      84: 'Accra, Ghana',                  // Row 85 → A
      // Row 86: unknown → T
      86: 'Tashkent, Uzbekistan',          // Row 87 → S
      87: 'Dimtu, Ethiopia',               // Row 88 → T
      88: 'Tijuana, Mexico',               // Row 89 → A
      89: 'Montreal, Quebec',              // Row 90 → R
      90: 'Wichita, Kansas',               // Row 91 → T
    };

    // Apply known solutions
    Object.entries(knownSolutions).forEach(([idx, cityName]) => {
      init[Number(idx)] = cityName;
    });

    // Merge accepted matches from Match Helper (localStorage)
    try {
      const accepted = JSON.parse(localStorage.getItem('beastAccepted') || '{}');
      Object.entries(accepted).forEach(([idx, cityName]) => {
        if (!init[Number(idx)]) init[Number(idx)] = cityName;
      });
    } catch (e) { }

    // Rows where auto-match is known to be wrong — do NOT auto-select
    const skipRows = new Set([31, 62, 65, 75, 85]); // Row 32 (Derby), 63 (Okato), 66 (Velingrad), 76 (Pune), 86 (Christchurch)

    // Cities to completely exclude from auto-matching (they match wrong rows)
    const excludedCities = new Set(['Derby, Australia', 'Okato, New Zealand']);

    // For remaining rows, auto-select if there's exactly one match (excluding bad cities)
    puzzleRows.forEach((row, index) => {
      if (init[index] || skipRows.has(index)) return;
      const initialMatches = processedCities.filter(c => matchRowToCity(row, c) && !excludedCities.has(c.id));
      if (initialMatches.length === 1) {
        init[index] = initialMatches[0].id;
      }
    });

    return init;
  });

  // Cities that are explicitly excluded from dropdowns (wrong auto-matches)
  const excludedFromDropdowns = useMemo(() => new Set([
    'Derby, Australia',           // Not row 32
    'Okato, New Zealand',         // Not row 63
    // Velingrad → now locked to row 49
    // Christchurch → now locked to row 46
  ]), []);

  const vehicles = useMemo(() => {
    const selectedValues = Object.values(selections);

    return puzzleRows.map((row, index) => {
      const selectedId = selections[index];
      const cityObj = selectedId ? processedCities.find(c => c.id === selectedId) : null;

      let type = "Unknown";
      row.blocks.forEach(b => b.forEach(i => {
        if (i.type === 'icon') type = i.name;
      }));

      const info = selectedId ? getVehicleInfo(row, cityObj) : null;

      let options = [];
      if (!selectedId && type !== "Unknown") {
        // Find possible valid matches — exclude already-taken AND excluded cities
        const validCitiesForRow = processedCities.filter(c => {
          const fitsFormat = matchRowToCity(row, c);
          const isAlreadyTaken = selectedValues.includes(c.id);
          const isExcluded = excludedFromDropdowns.has(c.id);
          return fitsFormat && !isAlreadyTaken && !isExcluded;
        });

        // Extract the letter each valid city would produce
        const letterMap = new Map();
        validCitiesForRow.forEach(c => {
          const inf = getVehicleInfo(row, c);
          if (inf && inf.letter) {
            if (!letterMap.has(inf.letter)) {
              letterMap.set(inf.letter, c); // Just keep the first city that produces this letter for simplicity in the dropdown
            }
          }
        });

        options = Array.from(letterMap.entries()).map(([letter, city]) => ({
          letter,
          cityId: city.id,
          cityName: city.name
        })).sort((a, b) => a.letter.localeCompare(b.letter));
      }

      return {
        index,
        type: type,
        letter: info ? info.letter : '',
        options
      };
    }).filter(v => v.type !== "Unknown");
  }, [selections, processedCities, excludedFromDropdowns]);

  const matchedCityIds = useMemo(() => {
    const matched = new Set();
    puzzleRows.forEach(row => {
      processedCities.forEach(city => {
        if (matchRowToCity(row, city)) {
          matched.add(city.id);
        }
      });
    });
    return matched;
  }, [processedCities]);

  const unmatchedCities = useMemo(() => {
    const selectedSet = new Set(Object.values(selections));
    return processedCities.filter(c =>
      !selectedSet.has(c.id) && (!matchedCityIds.has(c.id) || excludedFromDropdowns.has(c.id))
    );
  }, [processedCities, matchedCityIds, selections, excludedFromDropdowns]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
      </header>

      {/* ====== ANSWER PHRASE DISPLAY ====== */}
      {(() => {
        const ANSWER_PHRASE = "IN JIMMYS VAULT FIRST PART STICKS ROAMY RESULTS IN BETWEEN STAGE ONE ANSWER PAIRS LAST PART HE SHOWED AT START";
        const answerLetters = ANSWER_PHRASE.replace(/ /g, '').split('');
        const answerWords = ANSWER_PHRASE.split(' ');

        // Build word-boundary map
        let letterIdx = 0;
        const wordBoundaries = [];
        answerWords.forEach(word => {
          wordBoundaries.push(letterIdx);
          letterIdx += word.length;
        });

        // For each row, compute what letter the current selection produces
        const rowLetters = puzzleRows.map((row, index) => {
          const selectedId = selections[index];
          if (!selectedId) return '';
          const cityObj = processedCities.find(c => c.id === selectedId);
          if (!cityObj) return '';
          const info = getVehicleInfo(row, cityObj);
          return info ? info.letter.toUpperCase() : '';
        });

        // Count matches
        const matchCount = answerLetters.reduce((count, expected, i) => {
          return count + (rowLetters[i] === expected ? 1 : 0);
        }, 0);

        return (
          <div className="mb-12 bg-beast-800 p-8 rounded-xl border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
              <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <span>🔑</span> Decoded Answer
              </h2>
              <span className="text-xs font-mono text-gray-500">
                {matchCount}/{answerLetters.length} matched
              </span>
            </div>

            {/* Render word by word */}
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3 mt-4">
              {answerWords.map((word, wIdx) => {
                const startIdx = wordBoundaries[wIdx];
                return (
                  <div key={wIdx} className="flex gap-0.5 items-end">
                    {word.split('').map((expectedLetter, charIdx) => {
                      const rowIdx = startIdx + charIdx;
                      const actualLetter = rowLetters[rowIdx] || '';
                      const isMatch = actualLetter === expectedLetter;
                      const hasSelection = !!selections[rowIdx];

                      return (
                        <div
                          key={charIdx}
                          className={`w-8 h-8 rounded-sm flex items-center justify-center font-bold text-sm transition-all ${isMatch
                            ? 'bg-green-500/20 border border-green-500/60 text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                            : hasSelection
                              ? 'bg-red-500/20 border border-red-500/60 text-red-400'
                              : 'bg-gray-700/40 border border-gray-600/50 text-gray-500'
                            }`}
                          title={`Row ${rowIdx + 1}: expects "${expectedLetter}"${hasSelection ? `, got="${actualLetter || '?'}"` : ' (no selection)'}`}
                        >
                          {isMatch ? actualLetter : expectedLetter}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Full phrase as text */}
            <div className="mt-6 p-4 bg-gray-900/60 rounded-lg border border-gray-700/50">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Full Phrase:</p>
              <p className="text-sm font-mono text-gray-300 leading-relaxed tracking-wide">
                {ANSWER_PHRASE}
              </p>
            </div>
          </div>
        );
      })()}

      <div className="space-y-6">
        {puzzleRows.map((row, index) => (
          <PuzzleRow
            key={index}
            row={row}
            index={index}
            processedCities={processedCities}
            selected={selections[index] || ''}
            selections={selections}
            onSelect={(val) => setSelections(s => ({ ...s, [index]: val }))}
          />
        ))}
      </div>

      {/* ====== BRUTE FORCE SOLVER ====== */}
      <BruteForceSolver
        puzzleRows={puzzleRows}
        processedCities={processedCities}
        selections={selections}
      />

      {unmatchedCities.length > 0 && (
        <div className="mt-12 p-8 bg-beast-800 border border-gray-700 rounded-xl shadow-xl">
          <h2 className="text-2xl font-bold text-gray-200 mb-2 flex items-center gap-2">
            ⚠️ Unmatched Cities ({unmatchedCities.length})
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            These cities do not fit any of the puzzle formats exactly.
          </p>
          <div className="flex flex-wrap gap-2">
            {unmatchedCities.map(c => (
              <span key={c.id} className="bg-gray-900 border border-gray-700 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-medium">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BruteForceSolver({ puzzleRows, processedCities, selections }) {
  const [keywords, setKeywords] = useState('');
  const [maxIter, setMaxIter] = useState(1000000);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [workerRef, setWorkerRef] = useState(null);

  // Build the puzzle data: for each of the 91 rows, compute the available options (city + letter)
  const puzzleData = useMemo(() => {
    const selectedValues = Object.values(selections);

    return puzzleRows.map((row, index) => {
      const selectedId = selections[index];

      // If already selected, lock to that one city
      if (selectedId) {
        const cityObj = processedCities.find(c => c.id === selectedId);
        if (cityObj) {
          const info = getVehicleInfo(row, cityObj);
          const letter = info ? info.letter : cityObj.lettersFull[0] || '?';
          return [{ id: cityObj.id, cityName: cityObj.name, letter }];
        }
      }

      // Otherwise find all valid matches excluding already-taken cities
      const validCities = processedCities.filter(c => {
        const fits = matchRowToCity(row, c);
        const taken = selectedValues.includes(c.id);
        return fits && !taken;
      });

      if (validCities.length === 0) return [{ id: 'none', cityName: '?', letter: '?' }];

      // For vehicle rows, extract the vehicle letter; for non-vehicle rows use first letter
      return validCities.map(c => {
        const info = getVehicleInfo(row, c);
        const letter = info ? info.letter : c.lettersFull[0] || '?';
        return { id: c.id, cityName: c.name, letter };
      });
    });
  }, [puzzleRows, processedCities, selections]);

  // Compute stats
  const stats = useMemo(() => {
    let total = 1n;
    let multiMatchRows = 0;
    let singleMatchRows = 0;
    puzzleData.forEach(line => {
      const uniqueLetters = [...new Set(line.map(o => o.letter))].length;
      if (uniqueLetters > 1) multiMatchRows++;
      else singleMatchRows++;
      total *= BigInt(uniqueLetters);
    });
    return {
      totalCombinations: total.toString(),
      multiMatchRows,
      singleMatchRows,
      feasible: total <= BigInt(maxIter)
    };
  }, [puzzleData, maxIter]);

  const handleRun = () => {
    setIsRunning(true);
    setResults(null);
    setProgress({ count: 0, total: 1, resultsFound: 0 });

    const kws = keywords.split(',').map(k => k.trim()).filter(Boolean);

    const worker = new Worker('brute-worker.js');
    setWorkerRef(worker);

    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        setProgress({
          count: e.data.count,
          total: e.data.total,
          resultsFound: e.data.resultsFound
        });
      } else if (e.data.type === 'done') {
        setResults(e.data);
        setProgress(null);
        setIsRunning(false);
        worker.terminate();
        setWorkerRef(null);
      }
    };

    worker.postMessage({
      lines: puzzleData,
      keywords: kws,
      maxIterations: maxIter
    });
  };

  const handleStop = () => {
    if (workerRef) {
      workerRef.terminate();
      setWorkerRef(null);
    }
    setIsRunning(false);
    setProgress(null);
  };

  const progressPct = progress ? Math.min(100, (progress.count / Math.max(1, progress.total)) * 100) : 0;

  return (
    <div className="mt-12 p-8 bg-beast-800 border border-gray-700 rounded-xl shadow-2xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-2 flex items-center gap-3">
        🔓 Brute Force Phrase Solver
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Generates all possible 91-character phrases from the remaining city options and filters by keywords.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900/60 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Combos</div>
          <div className={`text-lg font-bold mt-1 ${stats.feasible ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalCombinations.length > 15 ? '∞ (too many)' : Number(stats.totalCombinations).toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-900/60 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Locked Rows</div>
          <div className="text-lg font-bold text-green-400 mt-1">{stats.singleMatchRows}</div>
        </div>
        <div className="bg-gray-900/60 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Multi-Match</div>
          <div className="text-lg font-bold text-yellow-400 mt-1">{stats.multiMatchRows}</div>
        </div>
        <div className="bg-gray-900/60 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Safety Limit</div>
          <div className="text-lg font-bold text-blue-400 mt-1">{(maxIter / 1000000).toFixed(1)}M</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Keywords (comma-separated)</label>
          <input
            type="text"
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-beast-button focus:border-transparent placeholder-gray-600"
            placeholder="THE, SECRET, BEAST, WIN, PRIZE"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            disabled={isRunning}
          />
        </div>
        <div className="w-32">
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Max Iterations</label>
          <select
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-beast-button"
            value={maxIter}
            onChange={(e) => setMaxIter(Number(e.target.value))}
            disabled={isRunning}
          >
            <option value={100000}>100K</option>
            <option value={500000}>500K</option>
            <option value={1000000}>1M</option>
            <option value={5000000}>5M</option>
            <option value={10000000}>10M</option>
          </select>
        </div>
        <div className="flex items-end">
          {!isRunning ? (
            <button
              onClick={handleRun}
              className="bg-beast-button hover:bg-beast-button/80 text-black font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-beast-button/30 flex items-center gap-2"
            >
              🚀 Run Brute Force
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg flex items-center gap-2"
            >
              ⏹ Stop
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && progress && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Processing... {progress.count.toLocaleString()} / {progress.total.toLocaleString()}</span>
            <span>{progress.resultsFound} matches found</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-beast-button to-yellow-300 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-200">
              ✅ Results ({results.validResults.length.toLocaleString()} matches)
            </h3>
            <span className="text-xs text-gray-500">
              Processed {results.totalProcessed.toLocaleString()} combos
              {results.stoppedByLimit && ' ⚠️ (hit safety limit)'}
            </span>
          </div>

          {results.stoppedByLimit && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 mb-3 text-sm text-yellow-400 flex items-center gap-2">
              ⚠️ Safety limit reached! Lock more rows with known cities to reduce combinations.
            </div>
          )}

          {results.validResults.length === 0 ? (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center text-gray-500">
              No phrases matched your keywords. Try different keywords or lock more rows.
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-700 rounded-lg max-h-96 overflow-y-auto">
              {results.validResults.slice(0, 500).map((phrase, i) => (
                <div
                  key={i}
                  className="px-4 py-2 border-b border-gray-800 font-mono text-sm text-green-300 hover:bg-gray-800/50 transition-colors flex items-center gap-3"
                >
                  <span className="text-xs text-gray-600 w-8 shrink-0">#{i + 1}</span>
                  <span className="break-all">{phrase}</span>
                </div>
              ))}
              {results.validResults.length > 500 && (
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  ... and {(results.validResults.length - 500).toLocaleString()} more
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PuzzleRow({ row, index, processedCities, selected, selections, onSelect }) {
  const matches = useMemo(() => {
    const selectedValues = Object.values(selections);
    return processedCities.filter(c => {
      const fitsFormat = matchRowToCity(row, c);
      const isAlreadyTaken = selectedValues.includes(c.id) && c.id !== selected;
      return fitsFormat && !isAlreadyTaken;
    });
  }, [processedCities, row, selections, selected]);

  const selectedCityObj = useMemo(() => {
    return processedCities.find(c => c.id === selected);
  }, [selected, processedCities]);

  const targetLetters = selectedCityObj ? selectedCityObj.lettersFull : '';

  return (
    <div className="bg-beast-800 border border-gray-700 rounded-xl p-6 shadow-xl hover:border-beast-button/50 transition duration-300 group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

        {/* Left Side: The Puzzle Visual */}
        <div className="flex-1">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-400 mb-4">
            <span className="bg-gray-700 px-2 py-1 rounded text-white shadow">Row {index + 1}</span>
            <div className="flex gap-2 text-gray-400 font-mono bg-gray-900/50 px-3 py-1 rounded">
              Structure: {row.blocks.map(b => {
                let count = 0;
                b.forEach(i => { if (i.type === 'square' || i.type === 'icon') count++; });
                return count;
              }).join(' • ')} letters
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xl relative">
            {(() => {
              let letterIdx = 0;
              return row.blocks.map((block, bIdx) => (
                <div key={bIdx} className="flex gap-1 items-end">
                  {block.map((item, cIdx) => {
                    if (item.type === 'literal') {
                      return (
                        <span key={cIdx} className="text-gray-400 font-bold px-1 mb-1">{item.value}</span>
                      );
                    }

                    const char = targetLetters ? targetLetters[letterIdx] : '';
                    letterIdx++;

                    if (item.type === 'square') {
                      return (
                        <div key={cIdx} className="w-8 h-8 bg-gray-200 border-b-2 border-gray-400 shadow-sm rounded-sm flex items-center justify-center text-beast-900 font-bold text-lg">
                          {char}
                        </div>
                      );
                    }
                    if (item.type === 'icon') {
                      return <VehicleSquare key={cIdx} type={item.name} letter={char} />;
                    }
                    return null;
                  })}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Right Side: The Matches */}
        <div className="w-full md:w-72 flex flex-col gap-2">
          {matches.length === 0 ? (
            <div className="bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg p-3 text-sm flex items-center gap-2">
              ⚠️ {selected ? "Selected city is no longer a valid option." : "No available matching cities found."}
            </div>
          ) : (
            <div className="relative">
              <select
                className="w-full appearance-none bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-beast-button focus:border-transparent transition shadow-inner"
                value={selected}
                onChange={(e) => onSelect(e.target.value)}
              >
                <option value="" disabled>Select a perfect match ({matches.length})</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                ▼
              </div>
            </div>
          )}

          {selected && (
            <div className="text-xs text-green-400 font-medium flex items-center gap-1.5 px-1 mt-1">
              ✅ Selected Solution Saved
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
