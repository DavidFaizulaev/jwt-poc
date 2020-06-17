const rp = require('request-promise-native');

module.exports = rp.defaults({
    json: true,
    backoffBase: 500,
    forever: true,
    timeout: 30000,
    simple: true,
    resolveWithFullResponse: true
});