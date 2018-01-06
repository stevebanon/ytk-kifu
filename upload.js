var fs = require('fs');
var request = require('request');
var Bagpipe = require('bagpipe');
var bagpipe = new Bagpipe(10);
var bagpipehttp = new Bagpipe(10);
var http = require('http');
var iconv = require('iconv-lite');
var Q = require("q");

var files = [];
var config = {
    method: "POST",
};

function uploadSgf(sgf, callback) {
    fs.readFile(sgf, function(err, data) {
        if (err) {
            console.log(err);
            callback(sgf + " upload failed!!!!!!!!!!!!!");
        } else {
            var str = iconv.decode(data, 'gb2312');
            str = str.replace(/\r\n/g, '');
            var kifu = str;
            config.url = 'http://60.205.216.128:3008/api/kifus/classic';
            config.json = { sgf: kifu };
            request(config, function(err, res, body) {
                if (err) {
                    console.log(err);
                    callback(sgf + " upload failed!!!!!!!!!!!!!");
                } else {
                    callback(body);
                }
            });
        }
    })
}

function processDirectoryItem(path, item) {
    var defer = Q.defer();
    scanDirectory(path + "/" + item)
        .then(function() {
            defer.resolve();
        }, function(err) {
            defer.reject(err);
        });

    return defer.promise;
}

function processFileItem(path, item) {
    var defer = Q.defer();
    if (item.indexOf('.sgf') != -1) {
        files.push(path + "/" + item);
    }
    defer.resolve();
    return defer.promise;
}

function scanDirectory(path) {
    var defer = Q.defer();
    var promises = [];
    fs.readdir(path, function(err, list) {
        var promises = [];
        list.forEach(function(item) {
            var currentPath = path + '/' + item;
            if (fs.lstatSync(currentPath).isDirectory()) {
                promises.push(processDirectoryItem(path, item));
            } else if (fs.lstatSync(currentPath).isFile()) {
                promises.push(processFileItem(path, item));
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

scanDirectory("./kifugo")
    .then(function() {
        console.log(files);
        for (var i = 0; i < files.length; i++) {
            bagpipe.push(uploadSgf, files[i], function(message) {
                console.log(message);
            });
        }
    }, function(err) {
        console.log(err);
    });

// fs.readdir("./kifugo/", function(err, files) {
//     for (var i = 0; i < files.length; i++) {
//         bagpipe.push(uploadSgf, './kifugo/' + files[i], function(message) {
//             console.log(message);
//         });
//     }
// });