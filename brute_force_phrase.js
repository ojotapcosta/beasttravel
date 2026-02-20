const fs = require('fs');

const citiesText = fs.readFileSync('cities.js', 'utf8');
let cities = [];
eval(citiesText.replace('const cities =', 'cities ='));

const rowsText = fs.readFileSync('rows.js', 'utf8');
let puzzleRows = [];
eval(rowsText.replace('const puzzleRows =', 'puzzleRows ='));

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

const processedCities = cities.map(city => {
  const normalized = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const wordsRaw = normalized.split(/[^A-Z]+/);
  const wordLetterCounts = wordsRaw.filter(w => w.length > 0).map(w => w.length);
  const lettersFull = wordsRaw.filter(w => w.length > 0).join('');
  return { id: city, name: city, wordLetterCounts, lettersFull };
});

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

function getVehicleLetter(row, cityObj) {
  if (!cityObj) return '';
  let letterIdx = 0;
  for (let b = 0; b < row.blocks.length; b++) {
    for (let c = 0; c < row.blocks[b].length; c++) {
      const item = row.blocks[b][c];
      if (item.type === 'icon') {
        return cityObj.lettersFull[letterIdx] || '';
      }
      if (item.type === 'square' || item.type === 'icon') {
        letterIdx++;
      }
    }
  }
  return '';
}

// Find all matches for each VEHICLE row
const vehicleRowsWithMatches = [];

puzzleRows.forEach((row, rowIndex) => {
  let hasIcon = false;
  row.blocks.forEach(b => b.forEach(i => { if (i.type === 'icon') hasIcon = true; }));
  
  if (hasIcon) {
    const matches = processedCities.filter(c => matchRowToCity(row, c));
    vehicleRowsWithMatches.push({
      rowIndex,
      row,
      matches,
      // For each valid city in this row, what letter does the vehicle generate?
      possibleLetters: [...new Set(matches.map(m => getVehicleLetter(row, m)))] 
    });
  }
});

console.log(`Found ${vehicleRowsWithMatches.length} vehicle rows total.\n`);

vehicleRowsWithMatches.forEach((vr, i) => {
  console.log(`Vehicle ${i + 1} (Row ${vr.rowIndex + 1}): ${vr.matches.length} matches. Possible Letters: ${vr.possibleLetters.join(', ')}`);
});

