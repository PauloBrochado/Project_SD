const RaftNode = require('./raft');

// Configuração dos servidores
const servers = [
    { id: 'node1', host: 'localhost', port: 3001 },
    { id: 'node2', host: 'localhost', port: 3002 },
    { id: 'node3', host: 'localhost', port: 3003 }
];

// Criar os nós
const nodes = servers.map(server => {
    const node = new RaftNode(server.id, servers, `./DB-data-${server.id}`);
    
    node.on('apply', (entry) => {
        console.log(`[${server.id}] Aplicando entrada:`, entry);
    });

    return node;
});

console.log('Cluster Raft iniciado com', nodes.length, 'nós');

// Função para adicionar uma entrada ao líder
function addEntry(data) {
    const leader = nodes.find(node => node.state === 'leader');
    if (leader) {
        const entry = {
            term: leader.currentTerm,
            data: data
        };
        leader.log.push(entry);
        leader.persistState();
        console.log('Entrada adicionada ao líder:', entry);
    } else {
        console.log('Nenhum líder eleito ainda');
    }
}

// Adicionar uma entrada de exemplo após 5 segundos
setTimeout(() => {
    addEntry({ type: 'test', value: 'hello' });
}, 5000); 