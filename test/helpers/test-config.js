module.exports = {
    PAYMENTS_OS_BASE_URL: process.env.PAYMENTS_OS_BASE_URL || 'https://api-qa.paymentsos.com',
    EXTERNAL_ENVIRONMENT: process.env.EXTERNAL_ENVIRONMENT || 'test',
    ORIGIN_URL: process.env.ORIGIN_URL || 'https://control-qa.paymentsos.com/',
    API_VERSION: '1.3.0',
    HDR_TEST: 'x-zooz-test',
    BRANCH_NAME: process.env.CI_COMMIT_REF_NAME,
    PAYMENTS_OS_BASE_URL_FOR_TESTS: process.env.PAYMENTS_OS_BASE_URL_FOR_TESTS || 'https://api-qa.paymentsos.com/tamara',
    RISK_PROVIDER_CONFIGURATION: {
        type: 'risk_provider',
        properties: [{
            name: 'merchant_key',
            type: 'string',
            isSecret: false,
            isRequired: true,
            isHidden: false,
            description: 'key used to identify the merchant in the fraud system'
        }]
    }
};
