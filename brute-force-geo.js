#!/usr/bin/env node
/**
 * Beast Travel – Geographic Brute Force Solver v3 (OFFLINE)
 * Uses GeoNames cities15000.txt dump for instant local lookups.
 * 
 * For each unmatched row:
 * 1. Analyze word structure [w1, w2, ..., wN]
 * 2. Try all splits: last N words = region name
 * 3. Match region by letter counts
 * 4. Look up real cities in that country from offline DB
 * 5. Filter by word structure + expected letter at icon position
 */

const fs = require('fs');

// ===== Load puzzle data =====
eval(fs.readFileSync(__dirname + '/rows.js', 'utf8').replace('const ', 'var '));
const appCode = fs.readFileSync(__dirname + '/app.jsx', 'utf8');
eval(appCode.match(/const knownSolutions = \{[\s\S]*?\};/)[0].replace('const ', 'var '));

const PHRASE = 'IN JIMMYS VAULT FIRST PART STICKS ROAMY RESULTS IN BETWEEN STAGE ONE ANSWER PAIRS LAST PART HE SHOWED AT START';
const expectedLetters = PHRASE.replace(/ /g, '').split('');

// ===== Load GeoNames cities DB =====
console.log('📂 Loading cities database...');
const geoLines = fs.readFileSync('/tmp/geonames/cities15000.txt', 'utf8').split('\n');
// Format: tab-separated. Col 1=name, Col 3=alternate names, Col 8=country code
const citiesByCountry = {}; // iso -> Set of city names
for (const line of geoLines) {
    if (!line) continue;
    const cols = line.split('\t');
    const name = cols[1]; // asciiname
    const altNames = cols[3] || ''; // alternate names
    const countryCode = cols[8];
    if (!countryCode || !name) continue;
    if (!citiesByCountry[countryCode]) citiesByCountry[countryCode] = new Set();
    citiesByCountry[countryCode].add(name);
    // Also add alternate names
    for (const alt of altNames.split(',')) {
        const trimmed = alt.trim();
        if (trimmed && /^[A-Za-zÀ-ÿ\s\-'.]+$/.test(trimmed)) {
            citiesByCountry[countryCode].add(trimmed);
        }
    }
}
const totalCities = Object.values(citiesByCountry).reduce((s, set) => s + set.size, 0);
console.log(`✅ Loaded ${totalCities} city names across ${Object.keys(citiesByCountry).length} countries\n`);

// ===== Region DB =====
const REGIONS = {
    "Afghanistan": { s: [11], c: "AF" }, "Albania": { s: [7], c: "AL" }, "Algeria": { s: [7], c: "DZ" },
    "Andorra": { s: [7], c: "AD" }, "Angola": { s: [6], c: "AO" }, "Argentina": { s: [9], c: "AR" },
    "Armenia": { s: [7], c: "AM" }, "Australia": { s: [9], c: "AU" }, "Austria": { s: [7], c: "AT" },
    "Azerbaijan": { s: [10], c: "AZ" }, "Bahamas": { s: [7], c: "BS" }, "Bahrain": { s: [7], c: "BH" },
    "Bangladesh": { s: [10], c: "BD" }, "Barbados": { s: [8], c: "BB" }, "Belarus": { s: [7], c: "BY" },
    "Belgium": { s: [7], c: "BE" }, "Belize": { s: [6], c: "BZ" }, "Benin": { s: [5], c: "BJ" },
    "Bhutan": { s: [6], c: "BT" }, "Bolivia": { s: [7], c: "BO" }, "Botswana": { s: [8], c: "BW" },
    "Brazil": { s: [6], c: "BR" }, "Brunei": { s: [6], c: "BN" }, "Bulgaria": { s: [8], c: "BG" },
    "Burundi": { s: [7], c: "BI" }, "Cambodia": { s: [8], c: "KH" }, "Cameroon": { s: [8], c: "CM" },
    "Canada": { s: [6], c: "CA" }, "Chad": { s: [4], c: "TD" }, "Chile": { s: [5], c: "CL" },
    "China": { s: [5], c: "CN" }, "Colombia": { s: [8], c: "CO" }, "Comoros": { s: [7], c: "KM" },
    "Congo": { s: [5], c: "CG" }, "Croatia": { s: [7], c: "HR" }, "Cuba": { s: [4], c: "CU" },
    "Cyprus": { s: [6], c: "CY" }, "Czechia": { s: [7], c: "CZ" }, "Denmark": { s: [7], c: "DK" },
    "Djibouti": { s: [8], c: "DJ" }, "Dominica": { s: [8], c: "DM" }, "Ecuador": { s: [7], c: "EC" },
    "Egypt": { s: [5], c: "EG" }, "Eritrea": { s: [7], c: "ER" }, "Estonia": { s: [7], c: "EE" },
    "Eswatini": { s: [8], c: "SZ" }, "Ethiopia": { s: [8], c: "ET" }, "Fiji": { s: [4], c: "FJ" },
    "Finland": { s: [7], c: "FI" }, "France": { s: [6], c: "FR" }, "Gabon": { s: [5], c: "GA" },
    "Gambia": { s: [6], c: "GM" }, "Georgia": { s: [7], c: "GE" }, "Germany": { s: [7], c: "DE" },
    "Ghana": { s: [5], c: "GH" }, "Greece": { s: [6], c: "GR" }, "Grenada": { s: [7], c: "GD" },
    "Guatemala": { s: [9], c: "GT" }, "Guinea": { s: [6], c: "GN" }, "Guyana": { s: [6], c: "GY" },
    "Haiti": { s: [5], c: "HT" }, "Honduras": { s: [8], c: "HN" }, "Hungary": { s: [7], c: "HU" },
    "Iceland": { s: [7], c: "IS" }, "India": { s: [5], c: "IN" }, "Indonesia": { s: [9], c: "ID" },
    "Iran": { s: [4], c: "IR" }, "Iraq": { s: [4], c: "IQ" }, "Ireland": { s: [7], c: "IE" },
    "Israel": { s: [6], c: "IL" }, "Italy": { s: [5], c: "IT" }, "Jamaica": { s: [7], c: "JM" },
    "Japan": { s: [5], c: "JP" }, "Jordan": { s: [6], c: "JO" }, "Kazakhstan": { s: [10], c: "KZ" },
    "Kenya": { s: [5], c: "KE" }, "Kiribati": { s: [8], c: "KI" }, "Kuwait": { s: [6], c: "KW" },
    "Kyrgyzstan": { s: [10], c: "KG" }, "Laos": { s: [4], c: "LA" }, "Latvia": { s: [6], c: "LV" },
    "Lebanon": { s: [7], c: "LB" }, "Lesotho": { s: [7], c: "LS" }, "Liberia": { s: [7], c: "LR" },
    "Libya": { s: [5], c: "LY" }, "Lithuania": { s: [9], c: "LT" }, "Luxembourg": { s: [10], c: "LU" },
    "Madagascar": { s: [10], c: "MG" }, "Malawi": { s: [6], c: "MW" }, "Malaysia": { s: [8], c: "MY" },
    "Maldives": { s: [8], c: "MV" }, "Mali": { s: [4], c: "ML" }, "Malta": { s: [5], c: "MT" },
    "Mauritania": { s: [10], c: "MR" }, "Mauritius": { s: [9], c: "MU" }, "Mexico": { s: [6], c: "MX" },
    "Moldova": { s: [7], c: "MD" }, "Monaco": { s: [6], c: "MC" }, "Mongolia": { s: [8], c: "MN" },
    "Montenegro": { s: [10], c: "ME" }, "Morocco": { s: [7], c: "MA" }, "Mozambique": { s: [10], c: "MZ" },
    "Myanmar": { s: [7], c: "MM" }, "Namibia": { s: [7], c: "NA" }, "Nauru": { s: [5], c: "NR" },
    "Nepal": { s: [5], c: "NP" }, "Netherlands": { s: [11], c: "NL" }, "Nicaragua": { s: [9], c: "NI" },
    "Niger": { s: [5], c: "NE" }, "Nigeria": { s: [7], c: "NG" }, "Norway": { s: [6], c: "NO" },
    "Oman": { s: [4], c: "OM" }, "Pakistan": { s: [8], c: "PK" }, "Palau": { s: [5], c: "PW" },
    "Palestine": { s: [9], c: "PS" }, "Panama": { s: [6], c: "PA" }, "Paraguay": { s: [8], c: "PY" },
    "Peru": { s: [4], c: "PE" }, "Philippines": { s: [11], c: "PH" }, "Poland": { s: [6], c: "PL" },
    "Portugal": { s: [8], c: "PT" }, "Qatar": { s: [5], c: "QA" }, "Romania": { s: [7], c: "RO" },
    "Russia": { s: [6], c: "RU" }, "Rwanda": { s: [6], c: "RW" }, "Samoa": { s: [5], c: "WS" },
    "Senegal": { s: [7], c: "SN" }, "Serbia": { s: [6], c: "RS" }, "Singapore": { s: [9], c: "SG" },
    "Slovakia": { s: [8], c: "SK" }, "Slovenia": { s: [8], c: "SI" }, "Somalia": { s: [7], c: "SO" },
    "Spain": { s: [5], c: "ES" }, "Sudan": { s: [5], c: "SD" }, "Suriname": { s: [8], c: "SR" },
    "Sweden": { s: [6], c: "SE" }, "Switzerland": { s: [11], c: "CH" }, "Syria": { s: [5], c: "SY" },
    "Taiwan": { s: [6], c: "TW" }, "Tajikistan": { s: [10], c: "TJ" }, "Tanzania": { s: [8], c: "TZ" },
    "Thailand": { s: [8], c: "TH" }, "Togo": { s: [4], c: "TG" }, "Tonga": { s: [5], c: "TO" },
    "Tunisia": { s: [7], c: "TN" }, "Turkey": { s: [6], c: "TR" }, "Turkmenistan": { s: [12], c: "TM" },
    "Tuvalu": { s: [6], c: "TV" }, "Uganda": { s: [6], c: "UG" }, "Ukraine": { s: [7], c: "UA" },
    "Uruguay": { s: [7], c: "UY" }, "Uzbekistan": { s: [10], c: "UZ" }, "Vanuatu": { s: [7], c: "VU" },
    "Venezuela": { s: [9], c: "VE" }, "Vietnam": { s: [7], c: "VN" }, "Yemen": { s: [5], c: "YE" },
    "Zambia": { s: [6], c: "ZM" }, "Zimbabwe": { s: [8], c: "ZW" },
    // Multi-word
    "New Zealand": { s: [3, 7], c: "NZ" }, "South Korea": { s: [5, 5], c: "KR" },
    "North Korea": { s: [5, 5], c: "KP" }, "South Africa": { s: [5, 6], c: "ZA" },
    "Saudi Arabia": { s: [5, 6], c: "SA" }, "Sri Lanka": { s: [3, 5], c: "LK" },
    "Costa Rica": { s: [5, 4], c: "CR" }, "Sierra Leone": { s: [6, 5], c: "SL" },
    "Burkina Faso": { s: [7, 4], c: "BF" }, "East Timor": { s: [4, 5], c: "TL" },
    "Ivory Coast": { s: [5, 5], c: "CI" }, "Czech Republic": { s: [5, 8], c: "CZ" },
    "South Sudan": { s: [5, 5], c: "SS" }, "Papua New Guinea": { s: [5, 3, 6], c: "PG" },
};

// ===== Helpers =====
function norm(name) {
    const n = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const w = n.split(/[^A-Z]+/).filter(x => x.length > 0);
    return { wc: w.map(x => x.length), letters: w.join('') };
}

function getRow(idx) {
    const row = puzzleRows[idx];
    const blocks = row.blocks.map(b => b.filter(x => x.type === 'square' || x.type === 'icon').length);
    let pos = 0, iconPos = -1;
    for (let b of row.blocks) for (let c of b) {
        if (c.type === 'icon') { iconPos = pos; pos++; }
        else if (c.type === 'square') { pos++; }
    }
    return { blocks, iconPos, letter: expectedLetters[idx] };
}

function eq(a, b) { return a.length === b.length && a.every((v, i) => v === b[i]); }

// ===== Solve =====
console.log('🔍 Beast Travel - Geographic Brute Force Solver v3 (OFFLINE)');
console.log('═'.repeat(60));

const unmatched = [];
for (let i = 0; i < puzzleRows.length; i++) {
    if (!knownSolutions[i]) unmatched.push(i);
}
console.log(`📋 ${unmatched.length} unmatched rows\n`);

for (const idx of unmatched) {
    const { blocks, iconPos, letter } = getRow(idx);

    console.log(`\n${'━'.repeat(60)}`);
    console.log(`📌 Row ${idx + 1}: [${blocks}] letter="${letter}" @pos${iconPos}`);

    let foundAny = false;

    // Try splits: last N words = region
    for (let rw = 1; rw < blocks.length; rw++) {
        const cityStruct = blocks.slice(0, blocks.length - rw);
        const regionStruct = blocks.slice(blocks.length - rw);
        const cityLetterCount = cityStruct.reduce((a, b) => a + b, 0);

        for (const [regionName, rd] of Object.entries(REGIONS)) {
            if (!eq(rd.s, regionStruct)) continue;

            // Check if icon letter is in region part — if so, verify it matches
            const regionNorm = norm(regionName);
            const isIconInCity = iconPos < cityLetterCount;
            if (!isIconInCity) {
                const rp = iconPos - cityLetterCount;
                if (rp < regionNorm.letters.length && regionNorm.letters[rp] !== letter) continue;
            }

            // Get cities for this country
            const cities = citiesByCountry[rd.c];
            if (!cities) continue;

            const matches = [];
            for (const cityName of cities) {
                const cn = norm(cityName);
                if (!eq(cn.wc, cityStruct)) continue;
                // Check letter constraint
                if (isIconInCity) {
                    if (iconPos < cn.letters.length && cn.letters[iconPos] !== letter) continue;
                }
                matches.push(cityName);
            }

            if (matches.length > 0) {
                // Deduplicate & sort
                const unique = [...new Set(matches)].sort();
                // Limit display to avoid flooding
                const display = unique.length > 10
                    ? unique.slice(0, 10).join(', ') + ` ... (+${unique.length - 10} more)`
                    : unique.join(', ');
                console.log(`   ✅ ${regionName} (${rd.c}): ${display}`);
                foundAny = true;
            }
        }
    }

    // Single-word rows
    if (blocks.length === 1) {
        console.log(`   ℹ Single word [${blocks[0]}] — standalone name, no country split`);
    }

    if (!foundAny && blocks.length > 1) {
        console.log(`   ❌ No city matches found`);
    }
}

console.log(`\n${'═'.repeat(60)}`);
console.log('Done!');
