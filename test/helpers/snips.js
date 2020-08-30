const fullRiskRequestBody = {
    payment_method: {
        type: 'untokenized',
        source_type: 'credit_card',
        holder_name: 'Dina Yakovlev',
        card_number: '123456789123',
        expiration_date: '12/20'
    },
    session_id: 'session_id',
    device_id: 'device_id',
    merchant: {
        mcc: '1234',
        merchant_name: 'merchant_name',
        merchant_country_code: 'USA',
        merchant_email: 'some_email@gmail.com',
        merchant_zip_code: '12345',
        merchant_city: 'New York'
    },
    authorization_code: '1234',
    cvv_verification_code: 'M',
    three_d_secure_authentication_status: 'R',
    acquirer: {
        acquirer_id: '123546',
        acquirer_country_code: 'USA'
    },
    installments: {
        number_of_installments: 1
    },
    additional_details: {
        hello: 'world'
    },
    provider_specific_data: {
        additional_details: {
            payer_birthday: '1990/12/12',
            desc_extra1: 'blabla',
            desc_extra2: 'nanana',
            desc_extra3: 'nonono'
        }
    }
};

const MOCK_DECLINE_RESPONSE_EMAIL = 'reject-hub@email.com';
const MOCK_REVIEW_RESPONSE_EMAIL = 'manual-review-hub@email.com';

module.exports = { fullRiskRequestBody, MOCK_DECLINE_RESPONSE_EMAIL, MOCK_REVIEW_RESPONSE_EMAIL };
