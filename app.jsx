const { useState, useMemo, useEffect } = React;

function matchRowToCity(row, cityObj) {
  let letterCount = 0;
  for (let b = 0; b < row.blocks.length; b++) {
    for (let c = 0; c < row.blocks[b].length; c++) {
      if (row.blocks[b][c].type === 'square' || row.blocks[b][c].type === 'icon') {
        letterCount++;
      }
    }
  }

  return letterCount === cityObj.cityOnly.length || letterCount === cityObj.lettersFull.length;
}

function getVehicleInfo(row, cityObj) {
  if (!cityObj) return null;
  let letterCount = 0;
  for (let b = 0; b < row.blocks.length; b++) {
    for (let c = 0; c < row.blocks[b].length; c++) {
      if (row.blocks[b][c].type === 'square' || row.blocks[b][c].type === 'icon') {
        letterCount++;
      }
    }
  }

  const targetLetters = (letterCount === cityObj.cityOnly.length) ? cityObj.cityOnly : cityObj.lettersFull;

  let letterIdx = 0;
  for (let b = 0; b < row.blocks.length; b++) {
    for (let c = 0; c < row.blocks[b].length; c++) {
      const item = row.blocks[b][c];
      if (item.type === 'icon') {
        return {
          type: item.name,
          letter: targetLetters[letterIdx] || ''
        };
      }
      if (item.type === 'square' || item.type === 'icon') {
        letterIdx++;
      }
    }
  }
  return null;
}

function VehicleSquare({ type, letter }) {
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
      const parts = normalized.split(',');
      const cityOnly = parts[0].replace(/[^A-Z]/g, '');
      const lettersFull = normalized.replace(/[^A-Z]/g, '');
      return { id: city, name: city, cityOnly, lettersFull };
    });
  }, []);

  const [selections, setSelections] = useState(() => {
    const init = {};
    puzzleRows.forEach((row, index) => {
      const initialMatches = processedCities.filter(c => matchRowToCity(row, c));
      if (initialMatches.length === 1) {
        init[index] = initialMatches[0].id; // Auto-select single matches
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

  const targetLetters = useMemo(() => {
    if (!selectedCityObj) return '';
    let rowLetterCount = 0;
    row.blocks.forEach(b => b.forEach(i => {
      if (i.type === 'square' || i.type === 'icon') rowLetterCount++;
    }));
    return (rowLetterCount === selectedCityObj.cityOnly.length) ? selectedCityObj.cityOnly : selectedCityObj.lettersFull;
  }, [selectedCityObj, row]);

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
                    letterIdx++; // Only increment for letters

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
