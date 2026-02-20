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

function getVehicleInfo(row, cityObj) {
  if (!cityObj) return {letter: '', type: ''};
  let letterIdx = 0;
  for (let b = 0; b < row.blocks.length; b++) {
    for (let c = 0; c < row.blocks[b].length; c++) {
      const item = row.blocks[b][c];
      if (item.type === 'icon') {
        return { letter: cityObj.lettersFull[letterIdx] || '', type: item.name };
      }
      if (item.type === 'square' || item.type === 'icon') {
        letterIdx++;
      }
    }
  }
  return {letter: '', type: ''};
}

let rowMatches = puzzleRows.map((row, rowIndex) => {
  const matches = processedCities.filter(c => matchRowToCity(row, c));
  let hasIcon = false;
  let iconName = '';
  
  row.blocks.forEach(b => b.forEach(i => { 
    if (i.type === 'icon') {
       hasIcon = true;
       iconName = i.name;
    }
  }));

  return { rowIndex, row, matches, hasIcon, iconName };
});

let changesMade = true;
const usedCities = new Set();
while(changesMade) {
  changesMade = false;
  rowMatches.forEach(rm => {
    if (rm.matches.length === 1) {
      if (!usedCities.has(rm.matches[0].id)) {
        usedCities.add(rm.matches[0].id);
        changesMade = true;
      }
    }
  });

  if (changesMade) {
    rowMatches.forEach(rm => {
      if (rm.matches.length > 1) {
         rm.matches = rm.matches.filter(c => !usedCities.has(c.id));
      }
    });
  }
}

// Download an english dictionary to score strings
const https = require('https');

https.get('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const dict = new Set(data.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length > 2));
    
    function scoreEnglish(str) {
      // Find longest english words in the string
      let score = 0;
      for (let i = 0; i < str.length; i++) {
        for (let j = i + 3; j <= str.length; j++) {
           if (dict.has(str.substring(i, j))) {
               score += (j - i) * (j - i); // Reward longer words exponentially
           }
        }
      }
      return score;
    }

    const types = ["Car", "Horse", "Plane", "Boat"];

    types.forEach(vehicleType => {
      const pertinentRows = rowMatches.filter(rm => rm.hasIcon && rm.iconName === vehicleType);
      
      const arraysOfLetters = pertinentRows.map(rm => {
        const lettersForThisRow = rm.matches.map(m => getVehicleInfo(rm.row, m).letter);
        return [...new Set(lettersForThisRow)].filter(Boolean);
      });
      
      console.log(`\n==== ${vehicleType.toUpperCase()} ====`);
      const slotCount = arraysOfLetters.length;
      
      const combos = arraysOfLetters.reduce((acc, letters) => {
         if (letters.length === 0) return acc;
         if (acc.length === 0) return letters;
         
         const nextLevel = [];
         for(let prefix of acc) {
           for(let l of letters) {
             nextLevel.push(prefix + l);
           }
         }
         return nextLevel;
      }, []);
      
      if (combos.length > 0 && combos.length <= 500000) {
          const scored = combos.map(c => ({ str: c, score: scoreEnglish(c) }));
          scored.sort((a,b) => b.score - a.score);
          console.log(`Top 10 likely phrases (out of ${combos.length}):`);
          scored.slice(0, 10).forEach(s => console.log(`${s.str} (Score: ${s.score})`));
      } else {
         console.log(`Too many combinations (${combos.length})`);
      }
    });
  });
});
