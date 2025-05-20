const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for the temp directory path
rl.question('Enter the path to the temporary files directory: ', (userInput) => {
  const tempDir = path.resolve(userInput.trim());

  fs.readdir(tempDir, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${tempDir}`, err);
      rl.close();
      return;
    }

    files.forEach(file => {
      const fullPath = path.join(tempDir, file);

      if (file.startsWith('chrome_BITS_') || file.startsWith('scoped_dir')) {
        fs.stat(fullPath, (err, stats) => {
          if (err) {
            console.error(`Error getting stats for ${fullPath}`, err);
            return;
          }

          if (stats.isDirectory()) {
            fs.rm(fullPath, { recursive: true, force: true }, (err) => {
              if (err) {
                console.error(`Failed to delete ${fullPath}`, err);
              } else {
                console.log(`Deleted: ${fullPath}`);
              }
            });
          }
        });
      }
    });

    rl.close();
  });
});
