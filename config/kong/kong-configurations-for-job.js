const MANDATORY_VARS = [
    'APPS_STORAGE_URL_LIVE',
    'APPS_STORAGE_URL_TEST',
    'IAM_SERVICE_URL',
    'RISK_LIVE_URL',
    'RISK_SANDBOX_URL'
];

const missingFields = MANDATORY_VARS.filter((currVar) => {
    return !process.env[currVar];
});
if (missingFields.length > 0) {
    throw new Error(`Missing mandatory env variables: ${missingFields}`);
}

const branchRouteName = process.env.BRANCH_NAME ? `${process.env.BRANCH_NAME}-` : '';
const branchName = process.env.BRANCH_NAME ? `/${process.env.BRANCH_NAME}` : '';

const configurations = {
    services: [
        {
            name: process.env.APP_NAME,
            url: process.env.RISK_LIVE_URL,
            routes: [
                {
                    name: `${branchRouteName}create-risk-analyses`,
                    methods: ['POST'],
                    strip_path: false,
                    paths: [`${branchName}/payments/(?<paymentId>[^/]*)/risk-analyses`],
                    plugins: [
                        {
                            name: 'authentication',
                            config: {
                                iam: {
                                    consider_environment: true,
                                    permission: 'payment.create',
                                    require_account_id_header: true
                                },
                                apps: {
                                    key_type: 'private'
                                },
                                audit: {
                                    resource_type: 'payment',
                                    action_type: 'authentication',
                                    extract_app_id: {
                                        source: 'request_headers',
                                        field_name: 'app-id'
                                    },
                                    extract_fields: {
                                        url: [
                                            { audit_name: 'payment_id', field_name: 'paymentId' }
                                        ],
                                        body: {
                                            response: [
                                                { audit_name: 'authentication_id', field_name: 'id' }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    name: `${branchRouteName}get-risk-analyses`,
                    methods: ['GET'],
                    strip_path: false,
                    paths: [`${branchName}/payments/(?<paymentId>[^/]*)/risk-analyses`],
                    plugins: [
                        {
                            name: 'authentication',
                            config: {
                                iam: {
                                    consider_environment: true,
                                    permission: 'payment.get',
                                    extended_data_permission: 'personal-data.get',
                                    require_account_id_header: true,
                                    pass_authorization_header_to_upstream: true
                                },
                                apps: {
                                    key_type: 'private'
                                },
                                audit: {
                                    resource_type: 'payment',
                                    action_type: 'get_payment',
                                    extract_app_id: {
                                        source: 'request_headers',
                                        field_name: 'app_id'
                                    },
                                    extract_fields: {
                                        url: [
                                            { audit_name: 'payment_id', field_name: 'paymentId' }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    name: `${branchRouteName}get-risk-analysis`,
                    methods: ['GET'],
                    strip_path: false,
                    paths: [`${branchName}/payments/(?<paymentId>[^/]*)/risk-analyses/(?<riskAnalysIsId>[^/]*)`],
                    plugins: [
                        {
                            name: 'authentication',
                            config: {
                                iam: {
                                    consider_environment: true,
                                    permission: 'payment.get',
                                    extended_data_permission: 'personal-data.get',
                                    require_account_id_header: true,
                                    pass_authorization_header_to_upstream: true
                                },
                                apps: {
                                    key_type: 'private'
                                }
                            }
                        }
                    ]
                }
            ],
            plugins: [
                {
                    name: 'upstream_url_mapper',
                    config: {
                        mapping: [
                            {
                                env: 'live',
                                upstream_url: `${process.env.RISK_LIVE_URL}`
                            },
                            {
                                env: 'test',
                                upstream_url: `${process.env.RISK_SANDBOX_URL}`
                            }
                        ]
                    }
                },
                {
                    name: 'prometheus_handler'
                }
            ]
        }
    ]
};

// For branches we need to add the strip uri feature to support feature
// Branches development
if (branchName) {
    const stripUri = {
        name: 'strip_uri_plugin',
        config: {
            string_to_strip: branchName
        }
    };
    for (let i = 0; i < configurations.services.length; i++) {
        if (configurations.services[i].plugins) {
            configurations.services[i].plugins.push(stripUri);
        } else {
            configurations.services[i].plugins = [stripUri];
        }
    }
}

console.log(encodeURIComponent(JSON.stringify(configurations)));

module.exports = configurations;
