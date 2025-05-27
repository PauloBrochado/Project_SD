const fs = require('fs');
const path = require('path');

class Storage {
    constructor(dataDir, nodeId) {
        this.dataDir = dataDir;
        this.nodeId = nodeId;
        this.stateFile = path.join(dataDir, `raft_state_${nodeId}.json`);
        this.logFile = path.join(dataDir, `raft_log_${nodeId}.json`);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    saveState(state) {
        fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    }

    loadState() {
        if (fs.existsSync(this.stateFile)) {
            return JSON.parse(fs.readFileSync(this.stateFile));
        }
        return null;
    }

    saveLog(log) {
        fs.writeFileSync(this.logFile, JSON.stringify(log, null, 2));
    }

    loadLog() {
        if (fs.existsSync(this.logFile)) {
            return JSON.parse(fs.readFileSync(this.logFile));
        }
        return [];
    }
}

module.exports = Storage; 