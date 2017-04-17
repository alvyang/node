var wechat = require('../utils/wechat_util.js');

/*
 * 生成随机字符串
 */
exports.randomString = function(len) {
　　len = len || 32;
　　var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';
　　var maxPos = $chars.length;
　　var pwd = '';
　　for (i = 0; i < len; i++) {
　　　　pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
　　}
　　return pwd;
}
/*
 * @params ret : 需要加密的对象
 * @return string : 加密后的字符串，并转换成大写
 */
exports.strEncryption = function(ret){
    var str = raw(ret);
    var crypto = require('crypto');
    return crypto.createHash('sha1').update(str,'utf8').digest('hex');
};

/*
 * @params args : 任意对象
 * @return str : 将args 拼接成get方式的字符串
 */
function raw(args){
	var keys = Object.keys(args).sort();
	var newArgs = {};
  	keys.forEach(function (key) {
    	newArgs[key] = args[key];
  	});
  	var str = '';
    for (var k in newArgs) {
    	str += '&' + k + '=' + newArgs[k];
    }
    str = str.substr(1);
    return str; 
};