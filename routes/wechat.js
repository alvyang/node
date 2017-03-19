var express = require("express");
var crypto = require('crypto');
var wechat = require('../utils/wechat_util.js');
var logger = require('../utils/logger');
var router = express.Router();
var moment = require('moment');
//获取openId
router.post("/getOpenId",function(req, res, next){
	wechat.getOpenId(req.body.code).then(function(data){
		var d = JSON.parse(data);
		var user = DB.get("WechatMember");
		var createTime = moment().format("YYYY-MM-DD HH:mm:ss");
		var memberData = {
			id:d.openid,
			integral:"0",
			create_time:createTime,
		};
		user.insert(memberData);
		res.json({code:"000000","openid":d.openid});
	});
});
//获取网页授权后的地址
router.get("/getAuthUrl",function(req, res, next){
	var url = wechat.getAuthUrl(req.query.url);
	res.json({"url":url});
});
/*微信安全接入*/
router.get('/getInto', function(req, res, next) {
	var signature = req.query.signature;
	var timestamp = req.query.timestamp;
	var nonce = req.query.nonce;
	var echostr = req.query.echostr;
	/*  加密/校验流程如下： */
	//1. 将token、timestamp、nonce三个参数进行字典序排序
	var str = [wechat.getWechat.token, timestamp, nonce].sort().join('');
	//2. 将三个参数字符串拼接成一个字符串进行sha1加密
	var sha1Code = crypto.createHash("sha1");
	var code = sha1Code.update(str,'utf-8').digest("hex");
	  
	//3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
	if(code===signature){
	    res.send(echostr)
	}else{
	    res.send("error");
	}
});
module.exports = router;