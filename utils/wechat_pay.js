var request = require("request");
var redis = require("../utils/redis_util.js");

var wechat = require("./wechat_util.js").getWechat();

//统一下单接口地址
var unifiedorder = "https://api.mch.weixin.qq.com/pay/unifiedorder";

//Promise化request  
var requestUrl = function(opts){
    opts = opts || {};  
    return new Promise(function(resolve, reject){  
        request(opts,function(error, response, body){  
            if (error) {
                return reject(error);  
            }  
            resolve(body);  
        })  
    })  
}; 
/* 
 * @params 统一下单的请求参数
 * @return 统一下单后的预生成订单信息
 */
exports.unifiedorder = function(order){
	var weOrder={
		appid:wechat.appId,
		mch_id:"",//商户号
		nonce_str:"",
	}
	var formData  = "<xml>";
	    formData  += "<appid>"+wechat.appId+"</appid>";  //appid
	    formData  += "<attach>"+attach+"</attach>"; //附加数据
	    formData  += "<body>"+body+"</body>";
	    formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
	    formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
	    formData  += "<notify_url>"+notify_url+"</notify_url>";
	    formData  += "<openid>"+openid+"</openid>";
	    formData  += "<out_trade_no>"+bookingNo+"</out_trade_no>";
	    formData  += "<spbill_create_ip></spbill_create_ip>";
	    formData  += "<total_fee>"+total_fee+"</total_fee>";
	    formData  += "<trade_type>JSAPI</trade_type>";
	    formData  += "<sign>"+paysignjsapi()+"</sign>";
	    formData  += "</xml>";
}


exports.jsapipay = function (req, res) {
    var bookingNo = req.query.bookingNo;
    var appid = _appid;
    var attach = _attach;
    var mch_id = _mch_id;
    var nonce_str = _nonce_str;
    var total_fee = _total_fee;
    var notify_url = _notify_url;
    var openid = _openid;
    var body = _body;
    var timeStamp = _timeStamp; 
    var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";
    var formData  = "<xml>";
    formData  += "<appid>"+appid+"</appid>";  //appid
    formData  += "<attach>"+attach+"</attach>"; //附加数据
    formData  += "<body>"+body+"</body>";
    formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
    formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
    formData  += "<notify_url>"+notify_url+"</notify_url>";
    formData  += "<openid>"+openid+"</openid>";
    formData  += "<out_trade_no>"+bookingNo+"</out_trade_no>";
    formData  += "<spbill_create_ip></spbill_create_ip>";
    formData  += "<total_fee>"+total_fee+"</total_fee>";
    formData  += "<trade_type>JSAPI</trade_type>";
    formData  += "<sign>"+paysignjsapi(appid,attach,body,mch_id,nonce_str,notify_url,openid,bookingNo,'',total_fee,'JSAPI')+"</sign>";
    formData  += "</xml>";
    request({url:url,method:'POST',body: formData},function(err,response,body){
        if(!err && response.statusCode == 200){
            console.log(body);
            var prepay_id = getXMLNodeValue('prepay_id',body.toString("utf-8"));
            var tmp = prepay_id.split('[');
            var tmp1 = tmp[2].split(']');
            //签名
            var _paySignjs = paysignjs(appid,nonce_str,'prepay_id='+tmp1[0],'MD5',timeStamp);
            res.render('jsapipay',{prepay_id:tmp1[0],_paySignjs:_paySignjs});
            //res.render('jsapipay',{rows:body});
            //res.redirect(tmp3[0]);
        }
    });
}

/*
 * @params ret : 需要加密的对象
 * @return string : 加密后的字符串，并转换成大写
 */
function paysignjsapi(ret){
    var str = raw(ret);
    var key = wechat.key;
    str += '&key='+key;
    var crypto = require('crypto');
    return crypto.createHash('md5').update(str,'utf8').digest('hex').toUpperCase();
};

/*
 * @params args : 任意对象
 * @return str : 将args 拼接成get方式的字符串
 */
function raw(args) {
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
//解析XML
function getXMLNodeValue(node_name,xml){
    var tmp = xml.split("<"+node_name+">");
    var _tmp = tmp[1].split("</"+node_name+">");
    return _tmp[0];
}