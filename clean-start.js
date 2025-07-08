// Script to clean Next.js cache and start the server
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Function to recursively delete a directory
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    console.log(`Deleting folder: ${folderPath}`);
    
    try {
      // On Windows, we need to use a different approach for deleting folders
      if (process.platform === 'win32') {
        try {
          // First try with Node.js fs
          fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              deleteFolderRecursive(curPath);
            } else {
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(folderPath);
        } catch (err) {
          // If that fails, try with rimraf command
          console.log(`Using rimraf for: ${folderPath}`);
          execSync(`npx rimraf "${folderPath}"`);
        }
      } else {
        // For non-Windows platforms, use rimraf
        execSync(`npx rimraf "${folderPath}"`);
      }
      console.log(`Successfully deleted: ${folderPath}`);
    } catch (err) {
      console.error(`Error deleting folder ${folderPath}:`, err);
    }
  }
}

// Clean up Next.js cache
console.log('Cleaning Next.js cache...');
deleteFolderRecursive(path.join(__dirname, '.next'));

// Also clean up any potential lock files
const lockFiles = [
  path.join(__dirname, '.next.lock'),
  path.join(__dirname, 'node_modules/.cache')
];

lockFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      console.log(`Deleting: ${file}`);
      if (fs.lstatSync(file).isDirectory()) {
        deleteFolderRecursive(file);
      } else {
        fs.unlinkSync(file);
      }
    } catch (err) {
      console.error(`Error deleting ${file}:`, err);
    }
  }
});

// Start the server
console.log('Starting the server...');
const port = process.argv[2] || '3030'; // Use a different port by default

// Use spawn to create a new process that will outlive this script
const serverProcess = spawn('node', ['server.js', port], {
  stdio: 'inherit',
  detached: true
});

console.log(`Server starting on port ${port}...`);
console.log('You can now access the application at:');
console.log(`http://localhost:${port}`);

// Don't wait for the child process
serverProcess.unref();
