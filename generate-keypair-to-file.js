const fs = require('fs');
const path = require('path');
const { publicKey, privateKey, publicJWKSet, publicJWK } = require('./generate-keypair');

fs.mkdirSync(path.join(__dirname, '/tmp/'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '/tmp/private.pem'), privateKey, { encoding: 'utf8' });
fs.writeFileSync(path.join(__dirname, '/tmp/public.pem'), publicKey, { encoding: 'utf8' });

fs.writeFileSync(path.join(__dirname, '/tmp/publicJWK.json'), JSON.stringify(publicJWK.toJWK()));
fs.writeFileSync(path.join(__dirname, '/tmp/publicJWKS.json'), JSON.stringify(publicJWKSet.toJWKS(), undefined, 2), { encoding: 'utf8' });
