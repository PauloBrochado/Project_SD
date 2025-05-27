const fs = require('fs');
const path = require('path');

class KVStore {
    constructor(dataDir, nodeId) {
        this.dataDir = dataDir;
        this.nodeId = nodeId;
        this.file = path.join(dataDir, `kvstore_${nodeId}.json`);
        this.data = {};
        this.load();
    }

    load() {
        if (fs.existsSync(this.file)) {
            this.data = JSON.parse(fs.readFileSync(this.file));
        }
    }

    save() {
        fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    }

    get(key) {
        return this.data[key];
    }

    put(key, value) {
        this.data[key] = value;
        this.save();
    }

    del(key) {
        delete this.data[key];
        this.save();
    }

    all() {
        return this.data;
    }
}

module.exports = KVStore; 