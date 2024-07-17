const NodeCache = require('node-cache');

// Initialize cache with different TTLs for different types of data
const cache = new NodeCache();

module.exports = cache;