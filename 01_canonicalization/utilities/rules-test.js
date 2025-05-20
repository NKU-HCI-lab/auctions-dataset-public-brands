const fs = require('fs');
const readline = require('readline');
const path = require('path');

const { applyRules } = require('../rules'); // Load the applyRules function from rules.js

// Path to your CSV file
const csvFilePath = path.join(__dirname, 'rules-test.csv');

// Function to process the CSV file
async function processBrands(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log("Original Brand => Filtered Brand");
    console.log("--------------------------------");

    for await (const line of rl) {
        const originalBrand = line.trim();
        if (originalBrand.length === 0) continue; // skip empty lines
        const filteredBrand = applyRules(originalBrand);
        console.log(`${originalBrand} => ${filteredBrand}`);
    }
}

processBrands(csvFilePath).catch(err => {
    console.error("Error processing brands:", err);
});
