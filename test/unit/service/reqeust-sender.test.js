const sinon = require('sinon');
const should = require('should');
const nock = require('nock');
const requestSender = require('../../../src/service/request-sender');
const logger = require('../../../src/service/logger');

describe('Request sender tests', () => {
    let sandbox, loggerInfo, loggerError;
    const url = 'http://url.com'
    const requestOptions = {
        url: url,
        method: 'get',
        targetName: 'target'
    };

    before(() => {
        sandbox = sinon.createSandbox();
        loggerInfo = sandbox.spy(logger, 'info');
        loggerError = sandbox.spy(logger, 'error');
    });

    afterEach(function () {
        sandbox.reset();
        nock.cleanAll();
    });

    after(function () {
        sandbox.restore();
    });

    describe('Test request retries', function() {
        it('On response with status different than 5xx, should be sent once', async () => {
            const nockService = nock(url)
                .get('/')
                .reply(200, {});
            const response = await requestSender.sendRequest(requestOptions);
            response.status.should.eql(200);
            nockService.isDone().should.eql(true);
            loggerError.callCount.should.eql(0);
            loggerInfo.callCount.should.eql(1);
        });
        it('On response with status 5xx, should retry once, and on successful response stop', async () => {
            const nockService = nock(url)
                .get('/')
                .reply(500, {});
            nockService.get('/').reply(200, {});

            const response = await requestSender.sendRequest(requestOptions);
            response.status.should.eql(200);
            nockService.isDone().should.eql(true);
            loggerError.callCount.should.eql(1);
            loggerError.args[0][1].should.eql('Request failed. Attempt number 1 of 3.');
            loggerInfo.callCount.should.eql(1);
        });
        it('On response with status 5xx, should retry twice, and on successful response stop', async () => {
            const nockService = nock(url)
                .get('/')
                .times(2)
                .reply(500, {});
            nockService.get('/').reply(200, {});

            const response = await requestSender.sendRequest(requestOptions);
            response.status.should.eql(200);
            nockService.isDone().should.eql(true);
            loggerError.callCount.should.eql(2);
            loggerError.args[1][1].should.eql('Request failed. Attempt number 2 of 3.');
            loggerInfo.callCount.should.eql(1);
        });
        it('On response with status 5xx, should retry 3 times', async () => {
            const nockService = nock(url)
                .get('/')
                .times(3)
                .reply(500, {});
            const response = await requestSender.sendRequest(requestOptions);
            response.status.should.eql(500);
            nockService.isDone().should.eql(true);
            loggerError.callCount.should.eql(3);
            loggerError.args[2][1].should.eql('Request failed. Attempt number 3 of 3.');
            loggerInfo.callCount.should.eql(0);
        });
    });

    describe('Test request throws error', function() {
        it('On response with status different than 5xx, should be sent once', async () => {
            const nockService = nock(url)
                .get('/')
                .replyWithError('ESOCKETTIMEDOUT')
            try {
                await requestSender.sendRequest(requestOptions);
                throw new Error('Error should have been thrown before');
            } catch (error) {
                error.message.should.eql('ESOCKETTIMEDOUT');
                nockService.isDone().should.eql(true);
                loggerError.callCount.should.eql(1);
                loggerInfo.callCount.should.eql(0);
            }
        });
    });
});
