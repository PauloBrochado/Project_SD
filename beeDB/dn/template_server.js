const express = require('express');
const app = express();
const PORT = "{{PORT}}";
const fs = require('fs').promises;
const path = require('path');

app.use(express.json());

// Data storage directory - will be replaced in generate_servers.js
const DATA_DIR = process.env.DB_DATA_DIRECTORY || './data';
const SERVER_NAME = "__SERVER_NAME__";

// In-memory cache
const dataCache = {};

// Ensure data directory exists
async function ensureDataDirExists() {
  try {
    await fs.mkdir(path.join(DATA_DIR, SERVER_NAME), { recursive: true });
    console.log(`Data directory for ${SERVER_NAME} created at ${path.join(DATA_DIR, SERVER_NAME)}`);
  } catch (err) {
    console.error(`Error creating data directory: ${err.message}`);
  }
}

// Initialize server
async function initialize() {
  await ensureDataDirExists();
  // Load existing data into cache
  try {
    const files = await fs.readdir(path.join(DATA_DIR, SERVER_NAME));
    for (const file of files) {
      if (file.endsWith('.json')) {
        const key = file.replace('.json', '');
        const data = await fs.readFile(path.join(DATA_DIR, SERVER_NAME, file), 'utf8');
        dataCache[key] = JSON.parse(data);
      }
    }
    console.log(`Loaded ${Object.keys(dataCache).length} items into cache`);
  } catch (err) {
    console.log(`No existing data found or error loading data: ${err.message}`);
  }
}

// CRUD Operations
// Create/Update
app.post('/data', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        error: 1,
        code: "BAD_REQUEST",
        message: "Key and value are required"
      });
    }
    
    // Store in cache
    dataCache[key] = value;
    
    // Persist to disk
    await fs.writeFile(
      path.join(DATA_DIR, SERVER_NAME, `${key}.json`),
      JSON.stringify(value),
      'utf8'
    );
    
    res.json({
      error: 0,
      code: "SUCCESS",
      message: "Data stored successfully",
      data: { key }
    });
  } catch (err) {
    console.error(`Error storing data: ${err.message}`);
    res.status(500).json({
      error: 1,
      code: "INTERNAL_ERROR",
      message: "Failed to store data"
    });
  }
});

// Read
app.get('/data/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    // Check cache first
    if (dataCache[key] !== undefined) {
      return res.json({
        error: 0,
        code: "SUCCESS",
        message: "Data retrieved successfully",
        data: { key, value: dataCache[key] }
      });
    }
    
    // If not in cache, try to load from disk
    try {
      const data = await fs.readFile(
        path.join(DATA_DIR, SERVER_NAME, `${key}.json`),
        'utf8'
      );
      const value = JSON.parse(data);
      
      // Update cache
      dataCache[key] = value;
      
      return res.json({
        error: 0,
        code: "SUCCESS",
        message: "Data retrieved successfully",
        data: { key, value }
      });
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({
          error: 1,
          code: "NOT_FOUND",
          message: `Key ${key} not found`
        });
      }
      throw err;
    }
  } catch (err) {
    console.error(`Error retrieving data: ${err.message}`);
    res.status(500).json({
      error: 1,
      code: "INTERNAL_ERROR",
      message: "Failed to retrieve data"
    });
  }
});

// Delete
app.delete('/data/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    // Check if exists
    if (dataCache[key] === undefined) {
      try {
        await fs.access(path.join(DATA_DIR, SERVER_NAME, `${key}.json`));
      } catch (err) {
        return res.status(404).json({
          error: 1,
          code: "NOT_FOUND",
          message: `Key ${key} not found`
        });
      }
    }
    
    // Remove from cache
    delete dataCache[key];
    
    // Remove from disk
    try {
      await fs.unlink(path.join(DATA_DIR, SERVER_NAME, `${key}.json`));
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
    
    res.json({
      error: 0,
      code: "SUCCESS",
      message: "Data deleted successfully",
      data: { key }
    });
  } catch (err) {
    console.error(`Error deleting data: ${err.message}`);
    res.status(500).json({
      error: 1,
      code: "INTERNAL_ERROR",
      message: "Failed to delete data"
    });
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    json: "CopyEdit",
    resp: {
      error: 0,
      code: "SUCCESS",
      errno: 0,
      message: "Operação realizada com sucesso",
      data: {
        service: SERVER_NAME,
        started: new Date().toISOString(),
        uptime: process.uptime(),
        cache_size: Object.keys(dataCache).length
      }
    }
  });
});

// Start server
initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`${SERVER_NAME} running on port ${PORT}`);
  });
});