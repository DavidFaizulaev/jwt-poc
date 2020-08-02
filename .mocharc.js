module.exports = {
    forbidOnly: !!process.env.CI, // fail the pipeline whenever .only is committed to the tests
    recursive: true,
    exit: true,
    timeout: 60000
};
