var sgf_parser = require('node-sgf-parser');
var fs = require('fs');
var iconv = require('iconv-lite');
// var str = "(;CA[gb2312]LB[mi:B][oi:C]C[围棋是谁发明的？A：尧,B：舜,C\:禹]AP[MultiGo:4.4.4]SZ[19]LB[ki:A]MULTIGOGM[1];B[ki]C[RIGHT])";
// var sgf = sgf_parser.parseFromSgf(str);
// console.log(sgf.root);
fs.readFile('1-1.sgf', function(err, data) {
    var str = iconv.decode(data, 'gb2312');
    str = str.replace(/\r\n/g, '');
    var sgf = sgf_parser.parseFromSgf(str);
    console.log(sgf.nodeCount);
});