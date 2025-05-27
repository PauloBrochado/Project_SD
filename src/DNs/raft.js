const EventEmitter = require('events');
const Storage = require('./storage');
const http = require('http');

class RaftNode extends EventEmitter {
    constructor(nodeId, servers, dataDir = './DB-data') {
        super();
        this.nodeId = nodeId;
        this.servers = servers;
        this.dataDir = dataDir;
        this.storage = new Storage(dataDir, nodeId);
        
        // Carregar estado persistente
        const persisted = this.storage.loadState() || {};
        this.currentTerm = persisted.currentTerm || 0;
        this.votedFor = persisted.votedFor || null;
        this.log = this.storage.loadLog() || [];
        
        // Raft state
        this.state = 'follower';  // follower, candidate, or leader
        
        // Volatile state
        this.commitIndex = 0;
        this.lastApplied = 0;
        
        // Leader state
        this.nextIndex = {};
        this.matchIndex = {};
        
        // Election timeout (150-300ms)
        this.electionTimeout = Math.floor(Math.random() * 150) + 150;
        this.electionTimer = null;
        
        // Heartbeat interval (50ms)
        this.heartbeatInterval = 50;
        this.heartbeatTimer = null;

        // Iniciar servidor HTTP
        this.startServer();
        
        this.startElectionTimer();
    }

    startServer() {
        const server = http.createServer((req, res) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const data = JSON.parse(body);
                let response;

                if (req.url === '/requestVote') {
                    response = this.handleRequestVote(data);
                } else if (req.url === '/appendEntries') {
                    response = this.handleAppendEntries(data);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            });
        });

        const serverConfig = this.servers.find(s => s.id === this.nodeId);
        server.listen(serverConfig.port, () => {
            console.log(`Servidor Raft rodando em http://localhost:${serverConfig.port}`);
        });
    }

    startElectionTimer() {
        if (this.electionTimer) {
            clearTimeout(this.electionTimer);
        }
        this.electionTimer = setTimeout(() => {
            this.startElection();
        }, this.electionTimeout);
    }

    startElection() {
        this.state = 'candidate';
        this.currentTerm = this.currentTerm + 1;
        this.votedFor = this.nodeId;
        this.startElectionTimer();
        
        // Request votes from all other servers
        this.requestVotes();
    }

    async requestVotes() {
        const voteRequests = this.servers
            .filter(server => server.id !== this.nodeId)
            .map(server => this.sendRequestVote(server));
        
        try {
            const responses = await Promise.all(voteRequests);
            const votes = responses.filter(response => response.voteGranted).length;
            
            if (votes > this.servers.length / 2) {
                this.becomeLeader();
            }
        } catch (error) {
            console.error('Error requesting votes:', error);
        }
    }

    async sendRequestVote(server) {
        return new Promise((resolve, reject) => {
            const lastLogEntry = this.log[this.log.length - 1] || { term: 0 };
            
            const requestData = {
                term: this.currentTerm,
                candidateId: this.nodeId,
                lastLogIndex: this.log.length - 1,
                lastLogTerm: lastLogEntry.term
            };

            const options = {
                hostname: server.host,
                port: server.port,
                path: '/requestVote',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(JSON.stringify(requestData));
            req.end();
        });
    }

    becomeLeader() {
        this.state = 'leader';
        this.nextIndex = {};
        this.matchIndex = {};
        
        // Initialize leader state
        this.servers.forEach(server => {
            this.nextIndex[server.id] = this.log.length;
            this.matchIndex[server.id] = 0;
        });
        
        // Start sending heartbeats
        this.startHeartbeat();
    }

    startHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeats();
        }, this.heartbeatInterval);
    }

    async sendHeartbeats() {
        if (this.state !== 'leader') return;
        
        const heartbeatPromises = this.servers
            .filter(server => server.id !== this.nodeId)
            .map(server => this.sendAppendEntries(server));
        
        try {
            await Promise.all(heartbeatPromises);
        } catch (error) {
            console.error('Error sending heartbeats:', error);
        }
    }

    async sendAppendEntries(server) {
        return new Promise((resolve, reject) => {
            const prevLogIndex = this.nextIndex[server.id] - 1;
            const prevLogTerm = prevLogIndex >= 0 ? this.log[prevLogIndex].term : 0;
            const entries = this.log.slice(this.nextIndex[server.id]);

            const requestData = {
                term: this.currentTerm,
                leaderId: this.nodeId,
                prevLogIndex,
                prevLogTerm,
                entries,
                leaderCommit: this.commitIndex
            };

            const options = {
                hostname: server.host,
                port: server.port,
                path: '/appendEntries',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    const response = JSON.parse(data);
                    if (response.success) {
                        this.matchIndex[server.id] = prevLogIndex + entries.length;
                        this.nextIndex[server.id] = this.matchIndex[server.id] + 1;
                    } else {
                        this.nextIndex[server.id] = Math.max(0, this.nextIndex[server.id] - 1);
                    }
                    resolve(response);
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(JSON.stringify(requestData));
            req.end();
        });
    }

    handleRequestVote(request) {
        const { term, candidateId, lastLogIndex, lastLogTerm } = request;
        
        if (term < this.currentTerm) {
            return { term: this.currentTerm, voteGranted: false };
        }
        
        if (term > this.currentTerm) {
            this.currentTerm = term;
            this.state = 'follower';
            this.votedFor = null;
        }
        
        if ((this.votedFor === null || this.votedFor === candidateId) &&
            this.isLogUpToDate(lastLogIndex, lastLogTerm)) {
            this.votedFor = candidateId;
            this.startElectionTimer();
            return { term: this.currentTerm, voteGranted: true };
        }
        
        return { term: this.currentTerm, voteGranted: false };
    }

    isLogUpToDate(candidateLastLogIndex, candidateLastLogTerm) {
        const lastLogEntry = this.log[this.log.length - 1];
        if (!lastLogEntry) return true;
        
        return candidateLastLogTerm > lastLogEntry.term ||
               (candidateLastLogTerm === lastLogEntry.term &&
                candidateLastLogIndex >= this.log.length - 1);
    }

    handleAppendEntries(request) {
        const { term, leaderId, prevLogIndex, prevLogTerm, entries, leaderCommit } = request;
        
        if (term < this.currentTerm) {
            return { term: this.currentTerm, success: false };
        }
        
        this.currentTerm = term;
        this.state = 'follower';
        this.votedFor = null;
        this.startElectionTimer();
        
        if (prevLogIndex >= 0 && 
            (this.log[prevLogIndex]?.term !== prevLogTerm)) {
            return { term: this.currentTerm, success: false };
        }
        
        // Append new entries
        if (entries && entries.length > 0) {
            this.log = this.log.slice(0, prevLogIndex + 1);
            this.log.push(...entries);
            this.persistState();
        }
        
        // Update commit index
        if (leaderCommit > this.commitIndex) {
            this.commitIndex = Math.min(leaderCommit, this.log.length - 1);
            this.applyCommittedEntries();
        }
        
        return { term: this.currentTerm, success: true };
    }

    applyCommittedEntries() {
        while (this.lastApplied < this.commitIndex) {
            this.lastApplied++;
            const entry = this.log[this.lastApplied];
            if (entry) {
                this.emit('apply', entry);
            }
        }
    }

    set currentTerm(val) {
        this._currentTerm = val;
        this.persistState();
    }

    get currentTerm() {
        return this._currentTerm;
    }

    set votedFor(val) {
        this._votedFor = val;
        this.persistState();
    }

    get votedFor() {
        return this._votedFor;
    }

    persistState() {
        this.storage.saveState({
            currentTerm: this._currentTerm,
            votedFor: this._votedFor
        });
        if (this.log) {
            this.storage.saveLog(this.log);
        }
    }
}

module.exports = RaftNode; 