const sinon = require('sinon');
const should = require('should');
const errorHandler = require('../../../src/middlewares/error-handler');

const Koa = require('koa');
const { context } = new Koa();

describe('Error handler tests', () => {
    let sandbox, ctx;
    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        ctx = { status: '', body: '' };
        ctx.__proto__ = context.__proto__;
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('handle syntax error', function() {
        it('should return syntax error ', async () => {
            const syntaxErr = new SyntaxError('some error');
            await errorHandler.handleError(ctx, function(){
                throw syntaxErr;
            });

            should(ctx.status).eql(400);
            should(ctx.body).eql({
                details: ['Bad Request'],
                moreInfo: syntaxErr.stack
            });
        });
    });

    describe('handle unexpected error', function() {
        it('should return internal server error', async function() {
            const error = new Error('some error');
            await errorHandler.handleError(ctx, function(){
                throw error;
            });

            ctx.status.should.eql(500);
            should(ctx.body).eql({
                details: ['Server Error'],
                moreInfo: error.stack
            });
        });
    });

    describe('handle not found error', function() {
        it('should return not found error', async function() {
            await errorHandler.handleError(ctx, function(){
                ctx.status = 404;
                ctx.body = undefined;
            });

            should(ctx.status).eql(404);
            should(ctx.body).match({
                details: ['Not Found']
            });
        });
    });
});
