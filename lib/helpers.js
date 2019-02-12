const crypto = require('crypto');
const config = require('./config');

let helpers = {}
helpers.hash = password => {
    // SHA256 hashing
    if(typeof(password) == 'string' && password.length) {
        let hash = crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex');
        return hash;
    } else {
        return false;
    }
}

// Parse a JSON string to an Object in all cases, without throwing error
helpers.parseJsonToObject = str => {
    try{
        let obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return {};
    }
}

helpers.createRandonString = stringLength => {
    stringLength = typeof(stringLength) == 'number' ? stringLength : false;
    if (stringLength) {
        let allowedChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';
        for(let i = 0; i< stringLength; i++) {
            let randomChar = allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
            str += randomChar;
        }
        return str;
    } else {
        return false;
    }
}


module.exports = helpers;