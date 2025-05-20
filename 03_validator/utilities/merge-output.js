const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Helper function to read CSV content into an array of objects
function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Helper function to write CSV content
function writeCSV(filePath, data) {
    if (data.length === 0) return;

    const header = Object.keys(data[0]).map(key => ({ id: key, title: key }));
    const csvWriter = createCsvWriter({ path: filePath, header });

    return csvWriter.writeRecords(data);
}

// Remove duplicate rows based on JSON.stringify
function deduplicate(data) {
    const seen = new Set();
    return data.filter(item => {
        const key = JSON.stringify(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Main function
(async function main() {
    const inputFolder1 = prompt('Enter path to input folder 1: ');
    const inputFolder2 = prompt('Enter path to input folder 2: ');
    const outputFolder = prompt('Enter path to output folder: ');

    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    const files1 = fs.readdirSync(inputFolder1).filter(file => file.endsWith('.csv'));
    const files2 = fs.readdirSync(inputFolder2).filter(file => file.endsWith('.csv'));

    const commonFiles = files1.filter(file => files2.includes(file));

    for (const fileName of commonFiles) {
        const file1Path = path.join(inputFolder1, fileName);
        const file2Path = path.join(inputFolder2, fileName);
        const outputPath = path.join(outputFolder, fileName);

        try {
            const data1 = await readCSV(file1Path);
            const data2 = await readCSV(file2Path);
            const merged = deduplicate([...data1, ...data2]);
            await writeCSV(outputPath, merged);
            console.log(`Merged and saved: ${fileName}`);
        } catch (err) {
            console.error(`Error processing ${fileName}:`, err.message);
        }
    }

    console.log('All matching files processed.');
})();
