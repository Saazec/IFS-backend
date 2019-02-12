/**
 * starting point of the application
 * 
 */
const config = require('./lib/config');
const https = require('https')
const http = require('http');
const url = require('url'); // for parsing the URL
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers');

let httpServer = http.createServer((req, res) => {
    commonServer(req, res)
});

// starting the server
httpServer.listen(config.httpPort, () => {
    console.log(`http server listening on port ${config.httpPort} in the ${config.env} mode`);;
});

// instantiating HTTPS server
let httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
}
let httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    commonServer(req, res)
});

// starting the HTTPS server
httpsServer.listen(config.httpsPort, () => {
    console.log(`https server listening on port ${config.httpsPort} in the ${config.env} mode`);;
});
/**
 * sample handler
 * @param {Object} data - contains everything that is parsed out of the request object
 * @param function() - callback function to be executed on completion
 */

// Defining a router request
let router = {
    'ifs': handlers.ifs,
    'operational': handlers.operational,
    'token': handlers.token,
    'user': handlers.user
}

// server which will handle both http and https

let commonServer = (req, res) => {
    let parasedUrl = url.parse(req.url, true); //  getting the url and parsing it
    // true: 
    let path = parasedUrl.pathname; // untrimmed eg. localhost:3000/user/ will produce '/user/'
    let trimmedPath = path.replace(/^\/+|\/+$/g, ''); // trimming off the forward slashed. eg. localhost:3000/user/ will produce user

    /**
     * get the query string as an object
     * (when we request for url with some paramters attached to the url 
     * eg: /user?foo='bar' will be stored in the query object as {'foo': 'bar'} )
     */
    let queryStringObj = parasedUrl.query;
    let method = req.method.toLowerCase();   // get the http method requested  
    let headers = req.headers; // get the reuqest headers as an object
    let decoder = new StringDecoder('utf-8');   // get the payload
    let buffer = '';
    req.on('data', data => {
        buffer += decoder.write(data);
    })
    req.on('end', () => {
        buffer += decoder.end();

        // choose the handler the request should go to
        let chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // construct data object
        let data = {
            trimmedPath,
            queryStringObj,
            method,
            headers,
            payload: helpers.parseJsonToObject(buffer)
        };
        // route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handler, or, default 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
            // use the payload calledback by the handler or use {}
            payload = typeof (payload) == 'object' ? payload : {};
            let payloadString = JSON.stringify(payload);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            // console.log(`returned response: ${statusCode}, payload ${payloadString}`);
        })
    })
}