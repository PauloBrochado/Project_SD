const RaftNode = require('./raft');

// Configuração dos servidores
const servers = [
    { id: 'node1', host: 'localhost', port: 3001 },
    { id: 'node2', host: 'localhost', port: 3002 },
    { id: 'node3', host: 'localhost', port: 3003 }
];

// Criar um nó Raft
const node = new RaftNode('node1', servers, './DB-data-node1');

// Evento quando uma entrada é aplicada
node.on('apply', (entry) => {
    console.log('Aplicando entrada:', entry);
});

// Exemplo de como adicionar uma entrada ao log
function addEntry(data) {
    if (node.state === 'leader') {
        const entry = {
            term: node.currentTerm,
            data: data
        };
        node.log.push(entry);
        node.persistState();
        console.log('Entrada adicionada:', entry);
    } else {
        console.log('Não é líder, não pode adicionar entradas');
    }
}

// Exemplo de uso
console.log('Nó Raft iniciado como:', node.state);
console.log('Termo atual:', node.currentTerm);

// Adicionar uma entrada de exemplo
setTimeout(() => {
    addEntry({ type: 'test', value: 'hello' });
}, 2000); 