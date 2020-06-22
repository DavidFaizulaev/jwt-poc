const sinon = require('sinon');
const should = require('should');
const request = require('axios');
const requestSender = require('../../../src/service/request-sender');
const logger = require('../../../src/service/logger');

describe('Request sender tests', () => {
    let sandbox, getRequest, loggerInfo, loggerError;
    const requestOptions = {
        url: 'url',
        method: 'get',
        targetName: 'target'
    };

    before(() => {
        sandbox = sinon.createSandbox();
        getRequest = sandbox.stub(request, 'get');
        loggerInfo = sandbox.spy(logger, 'info');
        loggerError = sandbox.spy(logger, 'error');
    });

    afterEach(function () {
        sandbox.reset();
    });

    after(function () {
        sandbox.restore();
    });

    describe('Test request retries', function() {
        it('On response with status different than 5xx, should be sent once', async () => {
            getRequest.resolves({ status: 200 });
            const response = await requestSender.sendRequest(requestOptions);
            response.status.should.eql(200);
            getRequest.callCount.should.eql(1);
            loggerError.callCount.should.eql(0);
            loggerInfo.callCount.should.eql(1);
        });
        it('On response with status 5xx, should retry once, and on successful response stop', async () => {
            getRequest.onFirstCall().resolves({ status: 500 });
            getRequest.onSecondCall().resolves({ status: 200 });
            const response = await requestSender.sendRequest(requestOptions);
            response.status.should.eql(200);
            getRequest.callCount.should.eql(2);
            loggerError.callCount.should.eql(1);
            loggerError.args[0][1].should.eql('Request failed. Attempt number 1 of 3.');
            loggerInfo.callCount.should.eql(1);
        });
        it('On response with status 5xx, should retry twice, and on successful response stop', async () => {
            getRequest.onFirstCall().resolves({ status: 500 });
            getRequest.onSecondCall().resolves({ status: 500 });
            getRequest.onThirdCall().resolves({ status: 200 });
            const response = await requestSender.sendRequest(requestOptions);
            response.status.should.eql(200);
            getRequest.callCount.should.eql(3);
            loggerError.callCount.should.eql(2);
            loggerError.args[1][1].should.eql('Request failed. Attempt number 2 of 3.');
            loggerInfo.callCount.should.eql(1);
        });
        it('On response with status 5xx, should retry 3 times', async () => {
            getRequest.resolves({ status: 500 });
            const response = await requestSender.sendRequest(requestOptions);
            response.status.should.eql(500);
            getRequest.callCount.should.eql(3);
            loggerError.callCount.should.eql(3);
            loggerError.args[2][1].should.eql('Request failed. Attempt number 3 of 3.');
            loggerInfo.callCount.should.eql(0);
        });
    });

    describe('Test request throws error', function() {
        it('On response with status different than 5xx, should be sent once', async () => {
            getRequest.rejects({ error: 'ESOCKETTIMEDOUT' });
            try {
                await requestSender.sendRequest(requestOptions);
                throw new Error('Error should have been thrown before');
            } catch (error) {
                error.should.eql({ error: 'ESOCKETTIMEDOUT' });
                getRequest.callCount.should.eql(1);
                loggerError.callCount.should.eql(1);
                loggerInfo.callCount.should.eql(0);
            }
        });
    });
});
