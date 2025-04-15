const fs = require('fs');
const path = require('path');

// Read the configuration
const configPath = path.join(__dirname, '..', 'configure.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Read the template
const templatePath = path.join(__dirname, 'template_server.js');
const template = fs.readFileSync(templatePath, 'utf8');

// Ensure servers directory exists
const serversDir = path.join(__dirname, 'servers');
if (!fs.existsSync(serversDir)) {
    fs.mkdirSync(serversDir, { recursive: true });
}

// Ensure data directory exists
const dataDir = config.db_data_directory || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
}

// Generate server files for each node and server
config.nodes.forEach(node => {
    // Create node data directory
    const nodeDataDir = path.join(dataDir, `node${node.id}`);
    if (!fs.existsSync(nodeDataDir)) {
        fs.mkdirSync(nodeDataDir, { recursive: true });
        console.log(`Created node data directory: ${nodeDataDir}`);
    }

    node.servers.forEach(server => {
        // Create server data directory
        const serverDataDir = path.join(nodeDataDir, `server${server.id}`);
        if (!fs.existsSync(serverDataDir)) {
            fs.mkdirSync(serverDataDir, { recursive: true });
            console.log(`Created server data directory: ${serverDataDir}`);
        }

        const serverCode = template
            .replace('"{{PORT}}"', server.port)
            .replace('{{NODE_ID}}', node.id)
            .replace('{{SERVER_ID}}', server.id)
            .replace(/__SERVER_NAME__/g, server.name)
            .replace('process.env.DB_DATA_DIRECTORY || \'./data\'', `'${dataDir.replace(/\\/g, '\\\\')}'`);

        const serverPath = path.join(serversDir, `server_${server.port}.js`);
        fs.writeFileSync(serverPath, serverCode);
        console.log(`Generated server file: ${serverPath}`);
    });
});

console.log('Server generation complete!');
