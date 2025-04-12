const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Path to servers directory
const serversDir = path.join(__dirname, 'servers');

// Function to delete all server files
function deleteServerFiles() {
    return new Promise((resolve, reject) => {
        // Check if servers directory exists
        if (!fs.existsSync(serversDir)) {
            console.log('Servers directory does not exist. Creating...');
            fs.mkdirSync(serversDir, { recursive: true });
            return resolve();
        }

        // Read all files in the servers directory
        fs.readdir(serversDir, (err, files) => {
            if (err) {
                return reject(`Error reading servers directory: ${err.message}`);
            }

            // Filter only server_*.js files
            const serverFiles = files.filter(file => file.startsWith('server_') && file.endsWith('.js'));
            
            if (serverFiles.length === 0) {
                console.log('No server files found to delete.');
                return resolve();
            }

            console.log(`Found ${serverFiles.length} server files to delete.`);
            
            // Delete each server file
            let deletedCount = 0;
            serverFiles.forEach(file => {
                const filePath = path.join(serversDir, file);
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Error deleting ${file}: ${unlinkErr.message}`);
                    } else {
                        console.log(`Deleted server file: ${file}`);
                        deletedCount++;
                    }
                    
                    // If all files have been processed, resolve the promise
                    if (deletedCount === serverFiles.length) {
                        console.log('All server files deleted successfully.');
                        resolve();
                    }
                });
            });
        });
    });
}

// Function to run the generate_servers.js script
function generateServers() {
    return new Promise((resolve, reject) => {
        console.log('Generating new server files...');
        
        // Path to generate_servers.js
        const generatePath = path.join(__dirname, 'generate_servers.js');
        
        // Execute the generate_servers.js script
        exec(`node "${generatePath}"`, (error, stdout, stderr) => {
            if (error) {
                return reject(`Error executing generate_servers.js: ${error.message}`);
            }
            
            if (stderr) {
                console.error(`generate_servers.js stderr: ${stderr}`);
            }
            
            console.log(stdout);
            console.log('Server generation completed successfully.');
            resolve();
        });
    });
}

// Main function to orchestrate the process
async function rebootServers() {
    try {
        console.log('=== REBOOTING SERVERS ===');
        console.log('Step 1: Deleting existing server files...');
        await deleteServerFiles();
        
        console.log('\nStep 2: Generating new server files...');
        await generateServers();
        
        console.log('\n=== SERVER REBOOT COMPLETED SUCCESSFULLY ===');
    } catch (error) {
        console.error(`\nERROR: ${error}`);
        process.exit(1);
    }
}

// Run the reboot process
rebootServers(); 