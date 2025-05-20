const FILE_RULES = '../01_canonicalization/rules.js'; // Location of file containing the rules (input)
const fs = require('fs');
const path = require('path');

const { applyRules } = require(FILE_RULES); // Load the applyRules function from rules.js

// Path to your CSV file
const csvFilePath = path.join(__dirname, 'validated.csv');
var p=[];

// Function to process the CSV file synchronously
function processBrandsSync(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/); // Handles both LF and CRLF line endings

        console.log("Original Brand => Filtered Brand");
        console.log("--------------------------------");

        for (const line of lines) {
            const originalBrand = line.trim();
            if (originalBrand.length === 0) continue; // skip empty lines
            const filteredBrand = applyRules(originalBrand);
			if(p.indexOf(filteredBrand)<0) p.push(filteredBrand);
            console.log(`${originalBrand} => ${filteredBrand}`);
        }
    } catch (err) {
        console.error("Error processing brands:", err);
    }
}

// Run the function
processBrandsSync(csvFilePath);
fs.writeFileSync('./validated_canonical.csv',p.join('\n')	+'\n')