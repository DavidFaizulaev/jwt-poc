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
    }
};

const MOCK_DECLINE_RESPONSE_EMAIL = 'reject-hub@email.com';
const MOCK_REVIEW_RESPONSE_EMAIL = 'manual-review-hub@email.com';

module.exports = { fullRiskRequestBody, MOCK_DECLINE_RESPONSE_EMAIL, MOCK_REVIEW_RESPONSE_EMAIL };
