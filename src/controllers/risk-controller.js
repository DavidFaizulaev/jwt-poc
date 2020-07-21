const riskModel = require('../models/risk-model');
const { CREATED, OK } = require('http-status-codes');

module.exports = {
    createRisk: createRisk,
    getRiskAnalyses: getRiskAnalyses,
    getRiskAnalysesById: getRiskAnalysesById
};

async function createRisk(ctx) {
    const response = await riskModel.createRisk(ctx);
    ctx.body = response;
    ctx.status = CREATED;
}

async function getRiskAnalyses(ctx){
    const response = await riskModel.getRiskAnalyses(ctx);
    ctx.body = response;
    ctx.status = OK;
}

async function getRiskAnalysesById(ctx){
    const response = await riskModel.getRiskAnalysesById(ctx);
    ctx.body = response;
    ctx.status = OK;
}
