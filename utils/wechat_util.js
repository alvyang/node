var request = require("request");
var redis = require("../utils/redis_util.js");

var accessTokenUrl = "https://api.weixin.qq.com/cgi-bin/token";
var appId = "wx314326fcd29e3eef";
var appsecret = "a8fc933c50ac16d3a824ffd78ccb9f67";
exports.getAccessToken = function(){
	var url = accessTokenUrl+"?appid="+appId+"&secret="+appsecret+"&grant_type=client_credential";
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
    });	;  
}
