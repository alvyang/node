var request = require("request");
var redis = require("../utils/redis_util.js");

//微信公众号信息
const appId = "wx314326fcd29e3eef";
const appsecret = "a8fc933c50ac16d3a824ffd78ccb9f67";
const token = "jinwe";
const mch_id = "123123"//商户号
//微信提供获取accessToken地址
const accessTokenUrl = "https://api.weixin.qq.com/cgi-bin/token";

//Promise化request  
var requestUrl = function(opts){  
    opts = opts || {};  
    return new Promise(function(resolve, reject){  
        request(opts,function(error, response, body){  
            if (error) {
                reject(error);  
            }else{
	            resolve(body);  
            }
        })  
    })  
}; 
/* 
 * @params url  http地址
 * @return authUrl 网页授权的http地址
 */
exports.getAuthUrl = function(url){
	var reqUrl = encodeURIComponent(url);
	var authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${reqUrl}&response_type=code&scope=snsapi_base&state=state#wechat_redirec`
	return authUrl;
}
/*
 * @params code  微信授权，微信提供的code
 * @return openId、access_token等
 */
exports.getOpenId = function(code){
	//获取临时accesstoken
	var getAccesstoken = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appsecret}&code=${code}&grant_type=authorization_code`;
	var options = {
    		method: 'GET',
    		url: getAccesstoken
  	};
  	return requestUrl(options);
}
//获取accesstoken
exports.getAccessToken = function(){
  	var url = `${accessTokenUrl}?appid=${appId}&secret=${appsecret}&grant_type=client_credential`;
  	var options = {
    	method: 'GET',
    	url: url
  	};
    new Promise(function(resolve, reject){  
        request(options,function(error, response, body){  
  			resolve(JSON.parse(body));
        })
    }).then(res => {
    	console.log(res.access_token);
		redis.set("YG-WECHAT-ACCESSTOKEN",res.access_token);
    });  
}
//获取微信基础信息
exports.getWechat = function(){
	return {
		appId:appId,
		appsecret:appsecret,
		token:token,
		mch_id:mch_id,
	}
}