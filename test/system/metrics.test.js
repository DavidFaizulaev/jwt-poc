const { expect } = require('chai');
const testConfig = require('../helpers/test-config');
const serviceRequestSender = require('../helpers/service-request-sender');

const METRICS_ROUTES = ['/v1/applications/:application_name', '/merchants/:merchant_id/payment-methods', '/payments/:payment_id/risk-analyses',
    'payments/:payment_id', 'payments/:payment_id/risk-analyses', 'payments/:payment_id/risk-analyses/:risk-analyses_id', 'v1/configurations/:configuration_id'];

const NORTHBOUND_METRICS_ROUTES = ['/payments/:payment_id/risk-analyses', '/payments/:payment_id/risk-analyses', '/payments/:payment_id/risk-analyses/:risk_analyses_id', 'N/A'];
// 'N/A' exists in all metrics calls

describe('Metrics system test', function () {
    it('Should return all metrics for southbound and northbound routes without any errors', async function () {
        const getMetricsResponse = await serviceRequestSender.getMetrics(testConfig.SERVICE_URL);
        expect(getMetricsResponse.status).to.equal(200);

        const metricsData = getMetricsResponse.data;
        const clientErrorsMetric = metricsData[1];
        // no error should exist
        expect(clientErrorsMetric.values.length).to.equal(0);

        // validate all metric labels do not include any unique data, such as uuid, query params and so on
        const southBoundMetrics = metricsData[0].values;
        expect(southBoundMetrics.length).to.not.equal(0);
        for (let i = 0; i < southBoundMetrics.length; i++) {
            expect(METRICS_ROUTES.includes(southBoundMetrics[i].labels.route)).to.equal(true);
        }
        // validate all metric labels do not include any unique data, such as uuid, query params and so on
        const northBoundMetrics = metricsData[24].values;
        expect(northBoundMetrics.length).to.not.equal(0);
        for (let i = 0; i < northBoundMetrics.length; i++) {
            expect(NORTHBOUND_METRICS_ROUTES.includes(northBoundMetrics[i].labels.route)).to.equal(true);
        }
    });
});
