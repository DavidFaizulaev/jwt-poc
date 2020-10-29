const { JWK, JWKS } = require('jose');
const crypto = require('crypto');
const { generateKeyPairSync } = crypto;
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

const publicJWK = JWK.asKey(publicKey, { alg: 'RS512', use: 'sig' });
const publicKeys = [publicJWK];
const publicJWKSet = new JWKS.KeyStore([publicKeys]);

module.exports = {
    publicKey,
    privateKey,
    publicJWK,
    publicJWKSet
};