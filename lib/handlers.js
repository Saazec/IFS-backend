const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
let handlers = {};

handlers.ifs = (data, callback) => {
    let acceptableMethods = ['get', 'post', 'put'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._ifs[data.method](data, callback);
    } else {
        callback(400)
    }
    // callback(200, { 'name': 'IFS Data Handler' })
};
handlers.operational = (data, callback) => {
    let acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._operational[data.method](data, callback);
    } else {
        callback(400)
    }
    // callback(200, { 'name': 'Operational Data Handler' })
};

handlers.user = (data, callback) => {
    let acceptableMethods = ['post', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._user[data.method](data, callback);
    } else {
        callback(400)
    }
}
// Tokens

handlers.token = (data, callback) => {
    let acceptableMethods = ['get', 'post', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._token[data.method](data, callback)
    } else {
        callback(405)
    }
}

handlers._token = {
    get: (data, callback) => {
        let id = data.queryStringObj.token || '';
        if (id) {
            _data.read('token', id, (err, tokenData) => {
                if (!err && tokenData) {
                    callback(200, tokenData)
                } else {
                    callback(404);
                }
            })
        } else {
            callback(404)
        }
    },
    post: (data, callback) => {
        // If it's a valid user then create a new token for the user
        let userName = data.payload.userName || '';
        let password = data.payload.password || '';

        if (userName && password) {
            // check if user exists
            _data.read('user', userName, (err, userData) => {
                if (!err && userData) {
                    // check if sent password matches the stored password
                    let hashedPassword = helpers.hash(password);
                    if (hashedPassword == userData.hashedPassword) {
                        // create a new token and json file
                        let tokenId = helpers.createRandonString(20);
                        let expires = Date.now() + 1000 * 60 * 60;

                        let tokenObj = { userName, tokenId, expires };
                        _data.create('token', tokenId, tokenObj, err => {
                            if (!err) {
                                callback(200, tokenObj);
                            } else {
                                callback(400, { 'Error': 'Error storing the token' });
                            }
                        })

                    } else {
                        callback(400, { 'Error': 'Invalid Password' });
                    }
                } else {
                    callback(400, { 'Error': `Couldn't find specified user` });
                }
            })
        } else {
            callback(400, { 'Error': `Missing required fields` });
        }
    },
    put: (data, callback) => {
        // increase the token expiry time by one hour after each request
        let id = data.payload.token || '';
        let extend = data.payload.extend || false;

        if (id && extend) {
            _data.read('token', id, (err, tokenData) => {
                if (!err && tokenData) {
                    // check if token has expired
                    if (tokenData.expires > Date.now()) {
                        // increase token expiry time by one hour.
                        tokenData.expires = Date.now() + 1000 * 60 * 60;
                        _data.update('token', id, tokenData, err => {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, { 'Error': `Couldn't update the token's data` });
                            }
                        })
                    }
                } else {
                    callback(400, { 'Error': `Supplied token is invalid` });
                }
            })
        } else {
            callback(400, { 'Error': 'Missing required field' });
        }
    },
    delete: (data, callback) => {
        let token = data.queryStringObj.token || '';
        let userName = data.payload.userName || '';
        if (token && userName) {
            handlers._token.verifyToken(token, userName, tokenIsValid => {
                if (tokenIsValid) {
                    _data.read('token', token, (err, returnedData) => {
                        if (!err && returnedData) {
                            _data.delete('token', token, err => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, { 'Error': `Couldn't delete specified token` });
                                }
                            })
                        } else {
                            callback(400, { 'Error': `Couldn't find the specified token` });
                        }
                    })
                } else {
                    callback(400, { 'Error': 'Supplied token is invalid, or has expired' });
                }
            })

        } else {
            callback(400, { 'Error': 'Missing required field' });
        }
    },

    verifyToken: (id, userName, callback) => {
        _data.read('token', id, (err, tokenData) => {
            if (!err && tokenData) {
                if (tokenData.userName == userName && tokenData.expires > Date.now()) {
                    callback(true);
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        })
    }
}

handlers._operational = {
    get: (data, callback) => {

        let token = data.headers.token || '';
        let userName = data.payload.userName || '';
        if (token && userName) {
            handlers._token.verifyToken(token, userName, tokenIsValid => {
                if (tokenIsValid) {
                    _data.fetchData('operational', 'operational', (err, data) => {
                        if (!err && data) {
                            callback(200, data);
                        } else {
                            callback(400, { 'Error': 'Error occured while fetching data' });
                        }
                    })
                } else {
                    callback(403, { 'Error': 'Invalid token, or the token has expired' })
                }
            })
        } else {
            callback(400, { 'Error': `Missing required field` });
        }
    }
}

handlers._ifs = {
    get: (data, callback) => {
        // check if the passed token exists and has not expired
        let userName = data.payload.userName || '';
        let token = data.headers.token || '';
        if (userName && token) {
            handlers._token.verifyToken(token, userName, tokenIsValid => {
                if (tokenIsValid) {
                    _data.fetchData('ifs', 'ifs', (err, data) => {
                        if (!err && data) {
                            callback(200, data);
                        } else {
                            callback(400, { 'Error': 'Error occured while fetching data' });
                        }
                    })
                } else {
                    callback(400, { 'Error': 'Supplied token is invalid, or has expired' });
                }
            })
        } else {
            callback(400, { 'Error': 'Missing requied field' });
        }

    },
    post: (data, callback) => {
        let caseNumber = data.payload.caseNumber || '';
        let source = data.payload.source || '';
        let feedbackType = data.payload.feedbackType || '';
        let division = data.payload.division || '';
        let reportedDate = data.payload.reportedDate || '';
        let createdOn = data.payload.createdOn || '';
        let engineScore = data.payload.engineScore || '';
        let lastSaved = data.payload.lastSaved || '';

        // forming the object to be added to the collection
        if (caseNumber && source && feedbackType && division && reportedDate && createdOn && engineScore && lastSaved) {

            let token = data.headers.token || '';
            let userName = data.payload.userName || '';

            if (userName && token) {
                handlers._token.verifyToken(token, userName, tokenIsValid => {
                    if (tokenIsValid) {
                        let _payload = { caseNumber, source, feedbackType, division, reportedDate, createdOn, engineScore, lastSaved };
                        _data.writeData('ifs', 'ifs', _payload, (err, _data) => {
                            if (err != 400 && _data) {
                                callback(200, JSON.parse(_data));
                            } else {
                                callback(400, _data);
                            }
                        })
                    } else {
                        callback(400, { 'Error': 'Supplied token is invalid, or has expired' });
                    }
                })
            } else {
                callback(400, { 'Error': 'Missing userName or token' });;
            }
        } else {
            callback(400, { 'Error': 'Missing required fields' });
        }

    },
    put: (data, callback) => {
        // To update ifs records
        let caseNumber = data.payload.caseNumber || '';
        let source = data.payload.source || '';
        let feedbackType = data.payload.feedbackType || '';
        let division = data.payload.division || '';
        let reportedDate = data.payload.reportedDate || '';
        let createdOn = data.payload.createdOn || '';
        let engineScore = data.payload.engineScore || '';
        let lastSaved = data.payload.lastSaved || '';

        if (source || feedbackType || division || reportedDate || createdOn || engineScore || lastSaved) {
            let _payload = { caseNumber, source, feedbackType, division, reportedDate, createdOn, engineScore, lastSaved };

            let token = data.headers.token || '';
            let userName = data.payload.userName || '';

            if (userName && token) {
                handlers._token.verifyToken(token, userName, tokenIsValid => {
                    if (tokenIsValid) {
                        _data.updateData('ifs', 'ifs', _payload, (err, _data) => {
                            if (!err) {
                                callback(200, JSON.parse(_data));
                            } else {
                                callback(400, { 'Error': err });
                            }
                        })
                    } else {
                        callback(400, { 'Error': 'Supplied token is invalid, or has expired' });
                    }
                })

            } else {
                callback(400, { 'Error': 'Supplied token is invalid, or has expired' });
            }

        } else {
            callback(400, { 'Error': 'Missing required field' });
        }
    }
}


// user handler
handlers._user = {
    get: (data, callback) => {
        callback(500, { 'Error': 'Method not supported' });
    },
    post: (data, callback) => {
        // creating a new user record
        let userName = data.payload.userName || '';
        let password = data.payload.password || '';

        if (userName && password) {
            // check if user already exists
            _data.read('user', userName, (err, data) => {
                if (err) {
                    let hashedPassword = helpers.hash(password);
                    if (hashedPassword) {
                        let userObject = { userName, hashedPassword };
                        // create new user record
                        _data.create('user', userName, userObject, err => {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, { 'Error': `Couldn't create user` });
                            }
                        })
                    } else {
                        callback(500, { 'Error': 'Error hashing the password' })
                    }
                } else {
                    callback(500, { 'Error': 'User already exists' });
                }
            })
        } else {
            callback(400, { 'Error': 'Missing required fields' });
        }
    },
    put: (data, callback) => {
        callback(500, { 'Error': 'Method not supported' });
    },
    delete: (data, callback) => {
        let userName = data.queryStringObj.userName || '';
        let token = data.headers.token || '';

        if (userName && token) {
            handlers._token.verifyToken(token, userName, tokenIsValid => {
                if (tokenIsValid) {
                    _data.read('user', userName, (err, userData) => {
                        if (!err && userData) {
                            _data.delete('user', userName, err => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, { 'Error': `Couldn't delete specified user` });
                                }
                            })
                        } else {
                            callback(400, { 'Error': `couldn't find specified user` });
                        }
                    })
                } else {
                    callback(400, { 'Error': 'Token is invalid, or has expired' });
                }
            })

        } else {
            callback(400, { 'Error': 'Missing required field' });
        }
    }
}

handlers.notFound = (data, callback) => {
    callback(404);
};


module.exports = handlers;