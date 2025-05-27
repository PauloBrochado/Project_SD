const axios = require('axios');

class RaftRPC {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
    }

    async requestVote(serverUrl, request, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.post(`${serverUrl}/raft/requestVote`, request, { timeout: 1000 });
                return response.data;
            } catch (error) {
                if (i === retries - 1) {
                    console.error(`Error requesting vote from ${serverUrl}:`, error.message);
                    throw error;
                }
            }
        }
    }

    async appendEntries(serverUrl, request, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.post(`${serverUrl}/raft/appendEntries`, request, { timeout: 1000 });
                return response.data;
            } catch (error) {
                if (i === retries - 1) {
                    console.error(`Error appending entries to ${serverUrl}:`, error.message);
                    throw error;
                }
            }
        }
    }
}

module.exports = RaftRPC; 