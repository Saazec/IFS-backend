/**
 * Library for storing and editing data
 */
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');
let ifsData = require('../.data/ifs/ifs.json');
// container of the module
let lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescripter) => {
        if (!err && fileDescripter) {
            //  converting to string
            let stringData = JSON.stringify(data);
            fs.writeFile(fileDescripter, stringData, err => {
                if (!err) {
                    fs.close(fileDescripter, err => {
                        if (!err) {
                            callback(false, stringData);
                        } else {
                            callback(`Error closing file`);
                        }
                    })
                } else {
                    callback('Error writing to file');
                }
            })
        } else {
            callback(`Couldn't create file, it may already exist`);
        }
    });
}

// fetching data
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', (err, data) => {
        if (!err) {
            let parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    })
}

// reading data from file
lib.fetchData = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', (err, data) => {
        if (!err) {
            let parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    })
}

lib.writeData = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescripter) => {

        // check if caseNumber is already in existance
        let checkIfExists = false;
        ifsData.forEach(element => {
            element.caseNumber == data.caseNumber ? checkIfExists = true : checkIfExists = false;
        });
        if (!checkIfExists) {
            if (!err && fileDescripter) {

                fs.truncate(fileDescripter, err => {
                    if (!err) {
                        ifsData.push(data);
                        let dataToWrite = JSON.stringify(ifsData);

                        fs.writeFile(fileDescripter, dataToWrite, err => {
                            if (!err) {
                                fs.close(fileDescripter, err => {
                                    if (!err) {
                                        callback(200, dataToWrite);
                                    } else {
                                        callback('Error while closing the file');
                                    }
                                })
                            } else {
                                callback(`Error writing to the file`);
                            }
                        })
                    } else {
                        callback('Error truncating the file');
                    }
                })
            } else {
                callback(`Couldn't update the file, file may not exist yet`)
            }
        } else {
            callback(400, { 'Error': 'Case number already exists, cannot create duplicate record' });
        }

    })
};

lib.updateData = (dir, file, data, callback) => {

    // if case number exists then, set index to case number, otherwise set default to -1.
    let _index = -1;
    ifsData.forEach((element, index) => {
        if (element.caseNumber == data.caseNumber) {
            _index = index;
            return;
        }
    })
    // if the caseNumber exists, then, update the data at that index position
    if (_index > -1) {
        if (data.source) ifsData[_index].source = data.source;
        if (data.feedbackType) ifsData[_index].feedbackType = data.feedbackType;
        if (data.division) ifsData[_index].division = data.division;
        if (data.reportedDate) ifsData[_index].reportedDate = data.reportedDate;
        if (data.createdOn) ifsData[_index].createdOn = data.createdOn;
        if (data.engineScore) ifsData[_index].engineScore = data.engineScore;
        if (data.lastSaved) ifsData[_index].lastSaved = data.lastSaved;

        // update the record at the found location and return back
        fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescripter) => {
            if (!err && fileDescripter) {
                fs.truncate(fileDescripter, err => {
                    if (!err) {
                        let dataToWrite = JSON.stringify(ifsData);
                        fs.writeFile(fileDescripter, dataToWrite, err => {
                            if (!err) {
                                fs.close(fileDescripter, err => {
                                    if (!err) {
                                        callback(false, dataToWrite);
                                    } else {
                                        callback(`Error closing the file`);
                                    }
                                })
                            } else {
                                callback(`Error writing to the file`);
                            }
                        })
                    } else {
                        callback(`Error truncating the file data`);
                    }
                })
            } else {
                callback(`Couldn't update the file, the file may not exist`);
            }
        })
    } else {
        callback(`Record not found`)
    }
};

lib.update = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescripter) => {
        if (!err && fileDescripter) {
            let stringData = JSON.stringify(data);
            fs.truncate(fileDescripter, err => {
                if (!err) {
                    fs.writeFile(fileDescripter, stringData, err => {
                        if (!err) {
                            fs.close(fileDescripter, err => {
                                if (!err) {
                                    callback(false)
                                } else {
                                    callback(`Error occured while closing the file`);
                                }
                            })
                        } else {
                            callback(`Error writing to the file`);
                        }
                    })
                } else {
                    callback(`Error truncating the file`);
                }
            })
        } else {
            callback(`Couldn't update the file, file may not exist yet`)
        }
    })
}

// Deleting file
lib.delete = (dir, file, callback) => {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', err => {
        if (!err) {
            callback(false);
        } else {
            callback(`Error deleting file, file may not exist`);
        }
    })
}
module.exports = lib;
