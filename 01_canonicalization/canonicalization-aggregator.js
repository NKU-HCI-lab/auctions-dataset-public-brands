/* BEGIN SETTINGS */
const FILE_RULES='./rules.js'; // Location of file containing the rules (input)
const FILE_BRANDS='../brands.csv';  // Location of file containing the brands (input)
const FILE_CANONICAL_JSON='./brands_canonical.json';  // Location of JSON file containing the canonical brands (output)
const FILE_CANONICAL_CSV='./brands_canonical.csv';  // Location of CSV file containing the canonical brands (output)
/* END SETTINGS */

const fs=require('fs');
const {applyRules}=require(FILE_RULES); // Load the applyRules function from rules.js

// Convert brands into array and make sure it contains unique values
var brands=[...new Set(fs.readFileSync(FILE_BRANDS,'utf8').split(/[\r\n]+/))];
console.log(`${brands.length} unique brands found.`);

// Calculate canonical brands
var brands_canonical=fs.existsSync(FILE_CANONICAL_JSON) ? JSON.parse(fs.readFileSync(FILE_CANONICAL_JSON,'utf8')) : {};
for(let i=0;i<brands.length;i++){
	if(i%5000==0) console.log(`${i} brands processed (${(i/brands.length).toFixed(2)}%)`);
	let brands_i_rules=applyRules(brands[i]); // Apply rules to brand[i]
	if(brands_i_rules.length==0) continue;
	if(!brands_canonical[brands_i_rules]) brands_canonical[brands_i_rules]=[];
	if(brands_canonical[brands_i_rules].indexOf(brands[i])<0) brands_canonical[brands_i_rules].push(brands[i]);
}
fs.writeFileSync(FILE_CANONICAL_JSON,JSON.stringify(brands_canonical));
fs.writeFileSync(FILE_CANONICAL_CSV,Object.keys(brands_canonical).join('\n'));
console.log(`${Object.keys(brands_canonical).length} unique canonical brands found.`);