const { expect, use } = require('chai');
const { chaiPlugin } = require('api-contract-validator');
const path = require('path');

const apiDefinitionsPath = path.join(__dirname, '../../docs/swagger.yaml');
use(chaiPlugin({ apiDefinitionsPath }));

function changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, url) {
    Object.assign(sdkConfigurationPreparations, {
        PAYMENTSOS_URL: url
    });

    paymentsOSsdkClient.init(sdkConfigurationPreparations, false);
}

function validateApiSchema(expectedStatus, riskAnalysesResource) {
    if (expectedStatus === 201) {
        expect({
            path: '/payments/{payment_id}/risk-analyses',
            status: 201,
            method: 'post',
            body: riskAnalysesResource,
            headers: {}
        }).to.matchApiSchema();
    } else if (expectedStatus === 200) {
        expect({
            path: '/payments/{payment_id}/risk-analyses/{risk_analyses_id}',
            status: 200,
            method: 'get',
            body: riskAnalysesResource,
            headers: {}
        }).to.matchApiSchema();
    }
}

module.exports = {
    changeTestUrl: changeTestUrl,
    validateApiSchema: validateApiSchema
};
