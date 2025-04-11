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

// Generate server files for each node and server
config.nodes.forEach(node => {
    node.servers.forEach(server => {
        const serverCode = template
            .replace('{{PORT}}', server.port)
            .replace('{{NODE_ID}}', node.id)
            .replace('{{SERVER_ID}}', server.id);

        const serverPath = path.join(serversDir, `server_${server.port}.js`);
        fs.writeFileSync(serverPath, serverCode);
        console.log(`Generated server file: ${serverPath}`);
    });
});

console.log('Server generation complete!');
