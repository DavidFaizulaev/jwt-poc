const deleteConfig = encodeURIComponent(JSON.stringify({ delete: { services: [{ name: process.env.APP_NAME }] } }));

console.log(deleteConfig);

module.exports = deleteConfig;
