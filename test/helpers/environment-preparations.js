const Chance = require('chance');
const testConfig = require('../helpers/test-config');
const chance = new Chance();

module.exports = {
    prepareTestEnvironment: prepareTestEnvironment,
    generateGenericAddress: generateGenericAddress,
    preparePaymentMethodToken: preparePaymentMethodToken
};

async function prepareTestEnvironment(paymentsOsClient, paymentsOSsdkClient, configurations) {
    const createMerchantResponse = await createMerchantConfiguration(paymentsOsClient, paymentsOSsdkClient, configurations);
    const providerId = await paymentsOSsdkClient.getProviderId({
        provider_type: 'risk_provider',
        processor: 'processor',
        provider_name: 'PayU-Risk',
        session_token: createMerchantResponse.session_token
    });
    const createConfigurationResponse = await paymentsOSsdkClient.createConfiguration({
        account_id: createMerchantResponse.merchant_id,
        session_token: createMerchantResponse.session_token,
        provider_id: providerId,
        configuration_data: {
            name: 'merchant_key',
            tenant_id: 'payu',
            region: 'latam',
            isRequired: true,
            isHidden: false,
            description: 'key used to identify the merchant in the fraud system'
        },
        name: `mynameis${(new Date().getTime())}`
    });
    const createApplicationResponse = await paymentsOSsdkClient.createApplication({
        app_name: `some_app_id${(new Date().getTime())}`,
        account_id: createMerchantResponse.merchant_id,
        default_provider: createConfigurationResponse.body.id,
        description: 'some_app_description',
        session_token: createMerchantResponse.session_token
    });
    const getAppKeysResponse = await paymentsOSsdkClient.getApplicationKeys({
        app_name: createApplicationResponse.body.id,
        account_id: createMerchantResponse.merchant_id,
        session_token: createMerchantResponse.session_token
    });
    const data = {
        merchant: createMerchantResponse,
        configurations: createConfigurationResponse.body,
        application: createApplicationResponse.body,
        app_keys: getAppKeysResponse.body
    };
    return data;
}

async function preparePaymentMethodToken(paymentsOSsdkClient) {
    const genericAddress = generateGenericAddress(paymentsOSsdkClient);

    const createPaymentMethodToken = {
        token_type: 'credit_card',
        holder_name: 'holder_name',
        expiration_date: '12/2027',
        card_number: '4245757666349685',
        billing_address: genericAddress
    };
    const tokenResponse = await paymentsOSsdkClient.createToken({ request_body: createPaymentMethodToken });

    return tokenResponse.body;
}

function generateGenericAddress(paymentsOSsdkClient) {
    const genericAddress = paymentsOSsdkClient.createAddressObject({
        country: 'ISR',
        city: 'Tel-Aviv',
        line1: '10705 Old Mill Rd',
        line2: '10705 Old Mill Rd',
        zip_code: '1111',
        title: 'Mr',
        first_name: 'Gordon',
        last_name: 'Ramsey',
        phone: '095090941',
        email: 'blabla@zooz.com',
        state: 'SD'
    });

    return genericAddress;
}

async function createMerchantConfiguration(paymentsOsClient, paymentsOSsdkClient, configurations) {
    const merchantConfiguration = {
        merchant_name: chance.name(),
        user_email: chance.email(),
        user_password: `${chance.email()}@#$QC19`,
        domain: chance.domain(),
        session_token: ''
    };
    const { body } = await paymentsOSsdkClient.registerMerchant({
        merchant_name: merchantConfiguration.merchant_name,
        user_email: merchantConfiguration.user_email,
        user_password: merchantConfiguration.user_password,
        domain: merchantConfiguration.domain,
        internal_headers: {
            origin: testConfig.ORIGIN_URL
        }
    });

    configurations.merchant_id = body.merchant_id;
    configurations.user_id = body.user_id;
    merchantConfiguration.session_token = body.session_token;

    const activateAccountOptions = {
        merchantId: body.merchant_id,
        email: merchantConfiguration.user_email,
        merchantName: merchantConfiguration.merchant_name
    };

    await paymentsOsClient.activateAccount(activateAccountOptions);

    const createSessionResponse = await paymentsOSsdkClient.createUserSession({
        email: merchantConfiguration.user_email,
        password: merchantConfiguration.user_password
    });

    merchantConfiguration.session_token = createSessionResponse.body.session_token;
    configurations.session_token = createSessionResponse.body.session_token;

    return body;
}
