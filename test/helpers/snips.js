const fullRiskRequestBody = {
    transaction_type: 'charge',
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
        mcc: '123',
        merchant_name: 'merchant_name',
        merchant_country_code: 'USA'
    }
};

module.exports = { fullRiskRequestBody };