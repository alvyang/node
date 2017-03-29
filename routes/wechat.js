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
		var cartData = {
			open_id:d.openid,
			creation_date:createTime,
		};
		user.getConnection(function(connection){//根据openid，判断用户是否已经关注过
			connection.beginTransaction(function(err){
				if (err) { 
					logger.debug(err);
					throw err; 
				}
				new Promise(function(resolve, reject){
					var query = connection.query(`select * from wechat_member where id = '${d.openid}'`, function(err, result) {
		                if (err) {
		                		logger.debug(err);
				    			res.json({code:"100000"});
				    			return connection.rollback(function(){
						        	throw err;
					      	});
		                }else{
		                    resolve(result);
		                }
		            });
		            logger.debug(query.sql);
				}).then(data => {
					if(data.length == 0){//判断是否首次关注,没有关注则,插入会员信息,购物车信息
						new Promise(function(resolve, reject){
							var query = connection.query('insert into wechat_member set ?', memberData, function(err, result) {
				                if (err) {
				                	 	logger.debug(err);
						    			res.json({code:"100000"});
						    			return connection.rollback(function(){
								        	throw err;
							      	});
				                }
				                 resolve();
				             });
				             logger.debug(query.sql);
						}).then(data => {
							var query = connection.query('insert into cart set ?', cartData, function(err, result) {
				                if (err) {
			                			logger.debug(err);
						    			res.json({code:"100000"});
						    			return connection.rollback(function(){
								        	throw err;
							      	});
				                }
				             });
				             logger.debug(query.sql);
						}).then(data=>{
							connection.commit(function(err){
						        if (err) {//出现错误，回滚
							        	res.json({code:"100000"});
							        	logger.debug(error);
						          	return connection.rollback(function() {
						            		throw err;
						          	});
						        }
						        res.json({code:"000000","openid":d.openid});
						    });
						    connection.release();
						});
					}else{
						res.json({code:"000000","openid":d.openid});
					}
				});
			})
		});
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