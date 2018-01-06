var fs = require('fs');
var request = require('request');
var Bagpipe = require('bagpipe');
var bagpipe = new Bagpipe(10);
var bagpipehttp = new Bagpipe(10);
var http = require('http');
var iconv = require('iconv-lite');
var Q = require("q");

var config = {
    method: "POST",
};

var stream = fs.createWriteStream("issue.txt");

var files = [];

function processDirectoryItem(path, parentId, level, item) {
    var defer = Q.defer();
    var directory = {};
    directory.name = item;
    directory.level = level;
    if (parentId) {
        directory.parent = parentId;
    }
    config.url = 'http://106.14.238.214:3008/api/directories';
    config.json = directory;
    request(config, function(err, res, body) {
        if (err) {
            console.log(err);
            defer.reject(err);
        } else {
            var id = body.id;
            scanDirectory(path + "/" + item, id, level + 1)
                .then(function() {
                    defer.resolve();
                }, function(err) {
                    defer.reject(err);
                });
        }
    });
    return defer.promise;
}

function processFileItem(path, parentId, level, item) {
    var defer = Q.defer();
    var sgf = {};
    sgf.parent = parentId;
    sgf.path = path + "/" + item;
    sgf.name = item;
    files.push(sgf);
    defer.resolve();

    return defer.promise;
}

function uploadProblem(sgf, callback) {
    // console.log(sgf);
    var problem = {};
    problem.name = sgf.name;
    problem.parent = sgf.parent;
    fs.readFile(sgf.path, function(err, data) {
        if (err) {
            console.log(err);
            callback(problem.name + " upload failed!!!!!!!!!!!!!");
        } else {
            var str = iconv.decode(data, 'gb2312');
            str = str.replace(/\r\n/g, '');
            problem.sgf = str;
            config.url = 'http://106.14.238.214:3008/api/problems';
            config.json = problem;
            request(config, function(err, res, body) {
                if (err) {
                    console.log(err);
                    callback(problem.name + " upload failed!!!!!!!!!!!!!");
                } else {
                    callback(body.name + " upload succeed");
                }
            });
        }
    })
}

function scanDirectory(path, parentId, level) {
    var defer = Q.defer();
    var promises = [];
    fs.readdir(path, function(err, list) {
        var promises = [];
        list.forEach(function(item) {
            var currentPath = path + '/' + item;
            if (fs.lstatSync(currentPath).isDirectory()) {
                promises.push(processDirectoryItem(path, parentId, level, item));
            } else if (fs.lstatSync(currentPath).isFile()) {
                promises.push(processFileItem(path, parentId, level, item));
            }
        });
        Q.all(promises)
            .then(function() {
                defer.resolve();
            }, function(err) {
                defer.reject(err);
            })
    });

    return defer.promise;
}

scanDirectory("./qipuku/", null, 1)
    .then(function() {
        for (var i = 0; i < files.length; i++) {
            bagpipe.push(uploadProblem, files[i], function(message) {
                console.log(message);
            });
        }
    }, function(err) {
        console.log(err);
    });