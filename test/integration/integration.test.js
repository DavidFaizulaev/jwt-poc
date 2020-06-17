const supertest = require('supertest');
const should = require('should');

const app = require('../../src/app');

describe('Integration test', function() {
    let testApp;
    let server;

    before(async function () {
        testApp = await app();
        server = testApp.listen();
    });

    after(function(){
        server.close();
    });
});
