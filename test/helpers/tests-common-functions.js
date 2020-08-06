const { use } = require('chai');
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

module.exports = {
    changeTestUrl: changeTestUrl
};
