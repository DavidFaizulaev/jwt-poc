const riskAnalysesModel = require('../models/getRiskAnalysesResource');

async function getRiskAnalyses(ctx){
    const response = await riskAnalysesModel.getRiskAnalyses(ctx);
    ctx.body = response.data;
    ctx.status = response.status;
};

async function getRiskAnalysesById(ctx){
    const response = await riskAnalysesModel.getRiskAnalysesById(ctx);
    ctx.body = response.data;
    ctx.status = response.status;
};

module.exports = {
    getRiskAnalyses: getRiskAnalyses,
    getRiskAnalysesById: getRiskAnalysesById
};
