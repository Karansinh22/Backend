const { LRUCache } = require('lru-cache');
const axios = require('axios');
const retry = require('async-retry');

// Initialize LRU cache
const territoryCache = new LRUCache({
    max: 1000,
    ttl: 1000 * 60 * 60, // 1 hour
    allowStale: false,
    updateAgeOnGet: false
});

// syncUsers();

module.exports = { territoryCache };