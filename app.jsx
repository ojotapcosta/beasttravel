const { useState, useMemo } = React;

function matchRowToCity(row, cityObj) {
  if (row.blocks.length !== cityObj.words.length) return false;

  for (let b = 0; b < row.blocks.length; b++) {
    const block = row.blocks[b];
    const word = cityObj.words[b];
    if (block.length !== word.length) return false;

    for (let c = 0; c < block.length; c++) {
      const item = block[c];
      const char = word[c];
      if (item.type === 'literal') {
        if (char !== item.value) return false;
      } else {
        if (!/^[A-Z]$/.test(char)) return false;
      }
    }
  }
  return true;
}

function getVehicleInfo(row, cityObj) {
  let charIndex = 0;
  for (let b = 0; b < row.blocks.length; b++) {
    for (let c = 0; c < row.blocks[b].length; c++) {
      const item = row.blocks[b][c];
      if (item.type === 'icon') {
        return {
          type: item.name,
          letter: cityObj ? cityObj.chars[charIndex] : ''
        };
      }
      charIndex++;
    }
  }
  return null;
}

function VehicleSquare({ type, letter }) {
  const path = `https://beast.travel/wp-content/uploads/2026/02/${type}-Small.png`;
  return (
    <div className="relative w-10 h-10 mt-1 mb-1 mx-1 bg-yellow-100 border-2 border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.5)] rounded-md flex shrink-0 items-center justify-center text-beast-900 font-extrabold text-xl cursor-default">
      {letter}
      <img
        src={path}
        className="absolute -top-3 -right-3 w-8 h-8 object-contain drop-shadow bg-beast-900/80 rounded border border-gray-600 p-0.5 backdrop-blur-sm"
        alt={type}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
  );
}

function App() {
  const processedCities = useMemo(() => {
    return cities.map(city => {
      const normalized = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const noCommas = normalized.replace(/,/g, ' ');
      const words = noCommas.trim().split(/\s+/);
      const chars = words.join('');
      return { id: city, name: city, words, chars };
    });
  }, []);

  const [selections, setSelections] = useState(() => {
    const init = {};
    puzzleRows.forEach((row, index) => {
      const initialMatches = processedCities.filter(c => matchRowToCity(row, c));
      if (initialMatches.length === 1) {
        init[index] = initialMatches[0].id;
      }
    });
    return init;
  });

  const vehicles = useMemo(() => {
    return puzzleRows.map((row, index) => {
      const selectedId = selections[index];
      const cityObj = selectedId ? processedCities.find(c => c.id === selectedId) : null;
      return getVehicleInfo(row, cityObj);
    }).filter(Boolean);
  }, [selections, processedCities]);

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
    return processedCities.filter(c => !matchedCityIds.has(c.id));
  }, [processedCities, matchedCityIds]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
      </header>

      {/* Decoded Phrases Section */}
      <div className="mb-12 space-y-8 bg-beast-800 p-8 rounded-xl border border-gray-700 shadow-2xl">
        <div>
          <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
            <span>✨</span> All Vehicles (Full Phrase)
          </h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {vehicles.map((v, i) => <VehicleSquare key={i} type={v.type} letter={v.letter} />)}
          </div>
        </div>

        <div>
          <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
            <span>🚗</span> Cars Only
          </h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {vehicles.filter(v => v.type === 'Car').map((v, i) => <VehicleSquare key={i} type={v.type} letter={v.letter} />)}
          </div>
        </div>

        <div>
          <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
            <span>🐎</span> Horses Only
          </h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {vehicles.filter(v => v.type === 'Horse').map((v, i) => <VehicleSquare key={i} type={v.type} letter={v.letter} />)}
          </div>
        </div>

        <div>
          <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
            <span>✈️</span> Planes Only
          </h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {vehicles.filter(v => v.type === 'Plane').map((v, i) => <VehicleSquare key={i} type={v.type} letter={v.letter} />)}
          </div>
        </div>

        <div>
          <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
            <span>⛴️</span> Boats Only
          </h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {vehicles.filter(v => v.type === 'Boat').map((v, i) => <VehicleSquare key={i} type={v.type} letter={v.letter} />)}
          </div>
        </div>
      </div>

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

function PuzzleRow({ row, index, processedCities, selected, selections, onSelect }) {
  const matches = useMemo(() => {
    // A city is a match if it fits the row AND (it is the current selection OR it hasn't been selected anywhere else)
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

  return (
    <div className="bg-beast-800 border border-gray-700 rounded-xl p-6 shadow-xl hover:border-beast-button/50 transition duration-300 group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

        {/* Left Side: The Puzzle Visual */}
        <div className="flex-1">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-400 mb-4">
            <span className="bg-gray-700 px-2 py-1 rounded text-white shadow">Row {index + 1}</span>
            <div className="flex gap-2 text-gray-400 font-mono bg-gray-900/50 px-3 py-1 rounded">
              Structure: {row.blocks.map(b => b.length).join(' • ')}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xl relative">
            {row.blocks.map((block, bIdx) => (
              <div key={bIdx} className="flex gap-1 items-end">
                {block.map((item, cIdx) => {
                  let charIndex = 0;
                  let currentB = 0;
                  let currentC = 0;
                  let found = false;
                  while (!found && currentB < row.blocks.length) {
                    if (currentB === bIdx && currentC === cIdx) {
                      found = true;
                      break;
                    }
                    charIndex++;
                    currentC++;
                    if (currentC >= row.blocks[currentB].length) {
                      currentC = 0;
                      currentB++;
                    }
                  }

                  const char = selectedCityObj ? selectedCityObj.chars[charIndex] : '';

                  if (item.type === 'literal') {
                    return (
                      <span key={cIdx} className="text-gray-400 font-bold px-1 mb-1">{item.value}</span>
                    );
                  }
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
            ))}
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
