function changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, url) {
    Object.assign(sdkConfigurationPreparations, {
        PAYMENTSOS_URL: url
    });

    paymentsOSsdkClient.init(sdkConfigurationPreparations, false);
}

module.exports = {
    changeTestUrl: changeTestUrl
};
