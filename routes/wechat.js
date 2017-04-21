var express = require("express");
var crypto = require('crypto');
var wechat = require('../utils/wechat_util.js');
var logger = require('../utils/logger');
var router = express.Router();
var moment = require('moment');
var gUtil = require('../utils/global_util.js');
var redis = require("../utils/redis_util.js");

/* 
 * 获取调用微信js-sdk的，参数
 */
router.post("/getJsConfig",function(req, res, next){
	var c = wechat.getWechat();
	var randomString = gUtil.randomString();
	var timestamp = parseInt(new Date().getTime()/1000);
	var url = req.body.url;
	redis.get("YG-WECHAT-JSAPI-TICKET").then(ticket => {
		console.log({noncestr:randomString,jsapi_ticket:ticket,timestamp:timestamp,url:url});
		var signature = gUtil.strEncryption({noncestr:randomString,jsapi_ticket:ticket,timestamp:timestamp,url:url});
		var config = {
			appId:c.appId,
			timestamp:timestamp,
			nonceStr:randomString,
			signature:signature,
		}
		logger.debug(config);
		res.json({code:"000000",data:config});
    });
});
/* 
 * 创建自定义菜单
 */
router.get("/createMenu",function(req, res, next){
	wechat.createMenu().then(data => {
		var d = JSON.parse(data);
		console.log(d);
		if(d.errcode == 0){
			res.json({code:"000000","message":"创建成功"});
		}else{
			res.json({code:"000000","message":"创建失败"});
		}
	});
});
router.post("/getUserMesage",function(req, res, next){
	var openId = req.body.openId;
	var user = DB.get("WechatMember");
	var query = user.executeSql(`select * from wechat_member where id = '${openId}'`, null ,function(err, result) {
        if (err) {
	      	res.json({code:"100000","message":"获取信息失败"});
        }else{
            res.json({code:"000000",data:result[0]});
        }
    });
    logger.debug(query);
	
});
//获取openId
router.post("/getOpenId",function(req, res, next){
	var user = DB.get("WechatMember");
	var createTime = moment().format("YYYY-MM-DD HH:mm:ss");
	var memberData = {};
	var cartData = {};
	var d;
	wechat.getOpenId(req.body.code).then(function(data){
		d = JSON.parse(data);
		if(!d.openid){
			res.json({code:"100000","message":"网页授权失败"});
			return ;
		}
		memberData = {
			id:d.openid,
			integral:"0",
			create_time:createTime,
		};
		cartData = {
			open_id:d.openid,
			creation_date:createTime,
		};
		return new Promise(function(resolve, reject){
			var query = user.executeSql(`select * from wechat_member where id = '${d.openid}'`, null ,function(err, result) {
                if (err) {
			      	reject(err)
                }else{
                    resolve(result);
                }
            });
		});
	}).then(data =>{
		console.log(data);
		if(data.length == 0){//判断是否首次关注,没有关注则,插入会员信息,购物车信息
			saveWechatUser(res,memberData,cartData,d.openid);
		}else{
			res.json({code:"000000","openid":d.openid});
		}
	}).catch(err=>{
		logger.debug(err);
		res.json({code:"100000"});
	});
});
/*
 * 创建用户
 */
function saveWechatUser(res,memberData,cartData,openId){
	var user = DB.get("WechatMember");
	wechat.getUserMessage(openId).then(function(data){
		var usermessage = JSON.parse(data);
		memberData.nickname = usermessage.nickname;
		memberData.subscribe = usermessage.subscribe;
		memberData.sex = usermessage.sex;
		memberData.city = usermessage.city;
		memberData.province = usermessage.province;
		memberData.country = usermessage.country;
		memberData.headimgurl = usermessage.headimgurl;
		memberData.subscribe_time = usermessage.subscribe_time;
		user.getConnection(function(connection){
			//根据openid，判断用户是否已经关注过
			connection.beginTransaction(function(err){
				if (err) {
					logger.debug(err);
					return connection.rollback(function() {
		            		throw err;
		          	});
				}
				var query = connection.query('insert into wechat_member set ?', memberData, function(err, result) {
	                if (err) {
	                	 	logger.debug(err);
			    			res.json({code:"100000"});
			    			return connection.rollback(function(){
					        	throw err;
				      	});
	                }else{
	                		var queryCart = connection.query('insert into cart set ?', cartData, function(err, result) {
			                if (err) {
		                			logger.debug(err);
					    			res.json({code:"100000"});
					    			return connection.rollback(function(){
							        	throw err;
						      	});
			                }else{
				                	connection.commit(function(err){
							        if (err) {//出现错误，回滚
								        	res.json({code:"100000"});
								        	logger.debug(error);
							          	return connection.rollback(function() {
							            		throw err;
							          	});
							        }
							        res.json({code:"000000","openid":openId});
							    });
			                }
						    connection.release();
			             });
			             logger.debug(queryCart.sql);
	                }
	             });
	             logger.debug(query.sql);
			})
		});
	});
}
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