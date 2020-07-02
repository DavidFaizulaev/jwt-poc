async function changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, configurations, url) {
    Object.assign(sdkConfigurationPreparations, {
        PAYMENTSOS_URL: url
    });

    await paymentsOSsdkClient.init(sdkConfigurationPreparations, false);
}

module.exports = {
    changeTestUrl: changeTestUrl
};