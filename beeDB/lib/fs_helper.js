const fs = require('fs').promises;

module.exports = {
  async readFile(path) {
    return await fs.readFile(path, 'utf8');
  },

  async writeFile(path, data) {
    return await fs.writeFile(path, data, 'utf8');
  },

  async exists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
};
