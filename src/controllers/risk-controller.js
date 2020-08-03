const riskModel = require('../models/risk-model');
const { CREATED, OK } = require('http-status-codes');
const { get } = require('lodash');

module.exports = {
    createRisk: createRisk,
    getRiskAnalyses: getRiskAnalyses,
    getRiskAnalysesById: getRiskAnalysesById
};

async function createRisk(ctx) {
    const response = await riskModel.createRisk(ctx);
    addSelfHeader(ctx, response);
    ctx.body = response;
    ctx.status = CREATED;
}

async function getRiskAnalyses(ctx){
    const response = await riskModel.getRiskAnalyses(ctx);
    const payment_id = get(ctx, 'params.payment_id');
    ctx.set('self', `payments/${payment_id}/risk-analyses`);
    ctx.body = response;
    ctx.status = OK;
}

async function getRiskAnalysesById(ctx){
    const response = await riskModel.getRiskAnalysesById(ctx);
    addSelfHeader(ctx, response);
    ctx.body = response;
    ctx.status = OK;
}

function addSelfHeader(ctx, response) {
    const payment_id = get(ctx, 'params.payment_id');
    ctx.set('self', `payments/${payment_id}/risk-analyses/${response.id}`);
}
