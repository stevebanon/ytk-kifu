var toc = require('markdown-toc');

var table = toc('# One\n\n# Two').content;

var fs = require('fs');
fs.readFile('2.md', 'utf8', function(err, data) {
    var table = toc(data).content;
    console.log(table);
});