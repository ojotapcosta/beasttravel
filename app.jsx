const { useState, useMemo } = React;

function App() {
  // Precompute city lengths
  const processedCities = useMemo(() => {
    return cities.map(city => {
      const parts = city.split(',');
      const leftRaw = parts[0].trim();
      const rightRaw = parts.slice(1).join(',').trim();
      const leftLetters = leftRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z]/g, '').toUpperCase();
      const rightLetters = rightRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z]/g, '').toUpperCase();
      const leftLen = leftLetters.length;
      const rightLen = rightLetters.length;
      return { id: city, name: city, leftLen, rightLen, leftLetters, rightLetters };
    });
  }, []);

  // Precompute valid square combinations
  const validSquareCombos = useMemo(() => {
    const combos = new Set();
    puzzleRows.forEach(row => {
      let left = 0, right = 0;
      let iconFound = false;
      row.forEach(item => {
        if (item.type === 'icon') iconFound = true;
        else if (item.type === 'squares') {
          if (!iconFound) left += item.count;
          else right += item.count;
        }
      });
      combos.add(`${left},${right}`);
    });
    return combos;
  }, []);

  const unmatchedCities = useMemo(() => {
    return processedCities.filter(c => !validSquareCombos.has(`${c.leftLen},${c.rightLen}`));
  }, [processedCities, validSquareCombos]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
      </header>

      <div className="space-y-6">
        {puzzleRows.map((row, index) => (
          <PuzzleRow
            key={index}
            row={row}
            index={index}
            processedCities={processedCities}
          />
        ))}
      </div>

      {unmatchedCities.length > 0 && (
        <div className="mt-12 p-8 bg-beast-800 border border-gray-700 rounded-xl shadow-xl">
          <h2 className="text-2xl font-bold text-gray-200 mb-2 flex items-center gap-2">
            ⚠️ Unmatched Cities ({unmatchedCities.length})
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            These cities have letter counts that do not match the required square formats of any puzzle row.
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

function PuzzleRow({ row, index, processedCities }) {
  const [selected, setSelected] = useState('');

  // Calculate required blank counts
  let leftSquares = 0;
  let rightSquares = 0;
  let iconName = '';
  let iconFound = false;

  row.forEach(item => {
    if (item.type === 'icon') {
      iconFound = true;
      iconName = item.name;
    } else if (item.type === 'squares') {
      if (!iconFound) leftSquares += item.count;
      else rightSquares += item.count;
    }
  });

  // Find exact matches
  const matches = useMemo(() => {
    return processedCities.filter(c => c.leftLen === leftSquares && c.rightLen === rightSquares);
  }, [processedCities, leftSquares, rightSquares]);

  const selectedCityObj = useMemo(() => {
    return processedCities.find(c => c.id === selected);
  }, [selected, processedCities]);

  return (
    <div className="bg-beast-800 border border-gray-700 rounded-xl p-6 shadow-xl hover:border-beast-button/50 transition duration-300 group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

        {/* Left Side: The Puzzle Visual */}
        <div className="flex-1">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-400 mb-3">
            <span className="bg-gray-700 px-2 py-1 rounded text-white shadow">Row {index + 1}</span>
            <span>{leftSquares} squares</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span className="text-gray-300">{iconName || 'Unknown Transport'}</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span>{rightSquares} squares</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xl relative">
            {row.map((item, i) => {
              if (item.type === 'squares') {
                const iconIndex = row.findIndex(r => r.type === 'icon');
                const isLeft = i < iconIndex;
                let startingIndex = 0;
                for (let k = 0; k < i; k++) {
                  if (row[k].type === 'squares') {
                    if (isLeft && k < iconIndex) startingIndex += row[k].count;
                    if (!isLeft && k > iconIndex) startingIndex += row[k].count;
                  }
                }

                return (
                  <div key={i} className="flex gap-1">
                    {Array.from({ length: item.count }).map((_, j) => {
                      const charIndex = startingIndex + j;
                      const letters = isLeft ? selectedCityObj?.leftLetters : selectedCityObj?.rightLetters;
                      const char = letters ? letters[charIndex] : '';
                      return (
                        <div key={j} className="w-6 h-6 bg-gray-200 border-b-2 border-gray-400 shadow-sm rounded-sm flex items-center justify-center text-beast-900 font-bold text-sm">
                          {char}
                        </div>
                      );
                    })}
                  </div>
                );
              }
              if (item.type === 'icon') {
                const imgName = item.name.replace(' ', '-');
                const path = `https://beast.travel/wp-content/uploads/2026/02/${imgName}-Small.png`;
                // Some logic to handle missing/special images based on previous scraped data
                const finalPath = path.replace('Small', item.name.includes('Boat') && !item.name.includes('Purple') && !item.name.includes('Brown') && !item.name.includes('Silver') ? 'Small2' : 'Small');

                return (
                  <div key={i} className="px-3">
                    <img
                      src={`https://beast.travel/wp-content/uploads/2026/02/${item.name.replace(' ', '-')}-Small${item.name.includes('Green Boat') || item.name.includes('Gold Boat') ? '2' : ''}.png`}
                      alt={item.name}
                      className="h-10 object-contain drop-shadow-md"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=Icon' }}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Right Side: The Matches */}
        <div className="w-full md:w-72 flex flex-col gap-2">
          {matches.length === 0 ? (
            <div className="bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg p-3 text-sm flex items-center gap-2">
              ⚠️ No matching cities found.
            </div>
          ) : (
            <div className="relative">
              <select
                className="w-full appearance-none bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-beast-button focus:border-transparent transition shadow-inner"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
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
