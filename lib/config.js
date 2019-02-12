/**
 * create and export configuration variables
 */
let environment = {
    dev: {
        httpPort: 3000,
        httpsPort: 3001,
        env: 'dev',
        hashingSecret: 'thisIsASecret',
    },
    prod: {
        httpPort: 5000,
        httpsPort: 5001,
        env: 'prod',
        hashingSecret: 'thisIsAlsoASecret',
    }
};
let currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
let toExport = typeof(environment[currentEnv]) == 'object' ? environment[currentEnv] : environment.dev;
module.exports = toExport;