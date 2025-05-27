const express = require('express');
const bodyParser = require('body-parser');
const RaftNode = require('./raft');
const RaftRPC = require('./raftRPC');
const config = require('../../etc/configure.json');
const KVStore = require('./kvstore');
const logger = require('./logger');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Initialize Raft node
const servers = config.nodes.flatMap(node => 
    node.servers.map(server => ({
        id: server.id,
        url: `http://${server.host}:${server.port}`
    }))
);

const nodeId = 'dn0_3000';
const raftNode = new RaftNode(nodeId, servers, './DB-data');
const raftRPC = new RaftRPC(`http://localhost:${port}`);
const kvstore = new KVStore('./DB-data', nodeId);
let stats = { puts: 0, gets: 0, dels: 0 };

// Raft endpoints
app.post('/raft/requestVote', (req, res) => {
    const response = raftNode.handleRequestVote(req.body);
    res.json(response);
});

app.post('/raft/appendEntries', (req, res) => {
    const response = raftNode.handleAppendEntries(req.body);
    res.json(response);
});

// Override RaftNode's RPC methods
raftNode.sendRequestVote = async (server) => {
    const request = {
        term: raftNode.currentTerm,
        candidateId: raftNode.nodeId,
        lastLogIndex: raftNode.log.length - 1,
        lastLogTerm: raftNode.log[raftNode.log.length - 1]?.term || 0
    };
    return await raftRPC.requestVote(server.url, request);
};

raftNode.sendAppendEntries = async (server) => {
    const request = {
        term: raftNode.currentTerm,
        leaderId: raftNode.nodeId,
        prevLogIndex: raftNode.nextIndex[server.id] - 1,
        prevLogTerm: raftNode.log[raftNode.nextIndex[server.id] - 1]?.term || 0,
        entries: raftNode.log.slice(raftNode.nextIndex[server.id]),
        leaderCommit: raftNode.commitIndex
    };
    return await raftRPC.appendEntries(server.url, request);
};

// Handle committed entries
raftNode.on('apply', (entry) => {
    if (entry.command) {
        if (entry.command.op === 'put') {
            kvstore.put(entry.command.key, entry.command.value);
            stats.puts++;
            logger.info(`APPLY put`, { key: entry.command.key, value: entry.command.value });
        } else if (entry.command.op === 'del') {
            kvstore.del(entry.command.key);
            stats.dels++;
            logger.info(`APPLY del`, { key: entry.command.key });
        }
    }
});

// REST API CRUD
app.put('/api/:key', async (req, res) => {
    if (raftNode.state !== 'leader') {
        logger.warn(`PUT denied: not leader`, { nodeId, leader: raftNode.leaderId });
        return res.status(403).json({ error: 'Not leader', leader: raftNode.leaderId });
    }
    const key = req.params.key;
    const value = req.body.value;
    logger.info(`PUT request queued`, { key, value });
    raftNode.log.push({ term: raftNode.currentTerm, command: { op: 'put', key, value } });
    raftNode.persistState();
    res.json({ status: 'queued', key, value });
});

app.get('/api/:key', (req, res) => {
    stats.gets++;
    const value = kvstore.get(req.params.key);
    if (value === undefined) {
        logger.warn(`GET not found`, { key: req.params.key });
        return res.status(404).json({ error: 'Not found' });
    }
    logger.info(`GET`, { key: req.params.key, value });
    res.json({ key: req.params.key, value });
});

app.delete('/api/:key', async (req, res) => {
    if (raftNode.state !== 'leader') {
        logger.warn(`DELETE denied: not leader`, { nodeId, leader: raftNode.leaderId });
        return res.status(403).json({ error: 'Not leader', leader: raftNode.leaderId });
    }
    const key = req.params.key;
    logger.info(`DELETE request queued`, { key });
    raftNode.log.push({ term: raftNode.currentTerm, command: { op: 'del', key } });
    raftNode.persistState();
    res.json({ status: 'queued', key });
});

// Status e estatísticas
app.get('/status', (req, res) => {
    res.json({
        nodeId,
        state: raftNode.state,
        term: raftNode.currentTerm,
        leader: raftNode.leaderId,
        commitIndex: raftNode.commitIndex,
        lastApplied: raftNode.lastApplied
    });
});

app.get('/stat', (req, res) => {
    res.json({ nodeId, stats });
});

// Start the server
app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
    logger.info('Raft node initialized', { nodeId: raftNode.nodeId });
}); 