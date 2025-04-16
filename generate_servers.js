const fs = require('fs');
const path = require('path');

// Read the configuration
const configPath = path.join(__dirname, 'etc', 'configure.json');
console.log(`Loading configuration from: ${configPath}`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Read the template
const templatePath = path.join(__dirname, 'template_server.js');
console.log(`Loading template from: ${templatePath}`);
const template = fs.readFileSync(templatePath, 'utf8');

// Ensure src/DNs directory exists
const serversDir = path.join(__dirname, 'src', 'DNs');
console.log(`Servers directory: ${serversDir}`);
if (!fs.existsSync(serversDir)) {
    fs.mkdirSync(serversDir, { recursive: true });
}

// Generate server files for each node and server
config.nodes.forEach(node => {
    node.servers.forEach(server => {
        const serverCode = template
            .replace('"{{PORT}}"', server.port)
            .replace('{{NODE_ID}}', node.id)
            .replace('{{SERVER_ID}}', server.id)
            .replace(/__SERVER_NAME__/g, server.name);

        const serverPath = path.join(serversDir, `server_${server.port}.js`);
        fs.writeFileSync(serverPath, serverCode);
        console.log(`Generated server file: ${serverPath}`);
    });
});

console.log('Server generation complete!');
