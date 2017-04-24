var express = require("express");
var logger = require('../utils/logger');
var redis = require("../utils/redis_util.js");
var router = express.Router();
var moment = require('moment');
var wechat = require('../utils/wechat_util.js');
var wechatPay = require('../utils/wechat_pay.js');
var order = DB.get("Order");
var orderItem = DB.get("OrderItem");
var payment = DB.get("Payment");

/* 
 * 判断订单是否已经处理，微信回调
 */
function orderHandled(orderId){
	return new Promise(function(resolve, reject){//创建一个异步连接,用于创建事务
		payment.executeSql(`select * from payment where order_id = ${orderId}`,null,function(err,result){
			if(err){
				logger.debug("查询收款信息出错");
				logger.debug(err);
				reject(err);
			}else{
				resolve(result);
			}
		});
	});
}
function keepTwoDecimal(num) {
	var result = parseFloat(num);
	if (isNaN(result)) {
		console.log('传递参数错误，请检查！');
		return false;
	}
  	result = Math.round(num * 100) / 100;
  	return result;
}
/* 
 * 判断订单金额是否一致
 */
function orderTotalFee(orderId,totalFee){
	return new Promise(function(resolve, reject){
		orderItem.executeSql(`select price,quantity from order_item where order_id = ${orderId}`,null,function(err,result){
			if(err){
				logger.debug("查询订单项出错");
				logger.debug(err);
				reject(err);
			}else{
				var l = result.length,numPrice = 0;
				for(var i = 0 ; i < l ; i++){
					numPrice += keepTwoDecimal(result[i].quantity*result[i].price);
				}
				if(numPrice == totalFee){
					resolve(true);
				}else{
					resolve(false);
				}
			}
		});
	});
}
/* 
 * 验证通过后，保存收款信息，并更新订单状态
 */
function updateOrderPayment(notify,res){
	
	var paymentData = {
		sn:new Date().getTime(),
		type:0,
	    order_id:notify.out_trade_no,
	    amount:notify.total_fee,
	    fee:0,
	    payment_date:notify.time_end,
	    status:0,
	    method:0,
	    payment_method:"微信公众号支付",
	};
	var notifyReturn = `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[数据处理出错]]></return_msg></xml>`;
	new Promise(function(resolve, reject){//创建一个异步连接,用于创建事务
		payment.getConnection(function(connection){
			//根据openid，判断用户是否已经关注过
			connection.beginTransaction(function(err){
				if (err) {
					logger.debug(err);
					reject();
					returnNofify(res,notifyReturn);
					return connection.rollback(function() {
		            		throw err;
		          	});
				}
				var query = connection.query('insert into payment set ?', paymentData, function(err, result) {
	                if (err) {
	                	logger.debug("添加收款信息出错"+notify.out_trade_no);
                	 	logger.debug(err);
                	 	reject();
                	 	returnNofify(res,notifyReturn);
		    			return connection.rollback(function(){
				        	throw err;
				      	});
	                }else{
	                	var sql = "update `order` set amount_paid = "+notify.total_fee+",payment_status=2 where id = "+notify.out_trade_no;
                		var updateOrder = connection.query(sql,function(err, result) {
			                if (err) {
			                	logger.debug("微信回调，更新订单状态出错"+notify.out_trade_no);
	                			logger.debug(err);
	                			reject();
	                			returnNofify(res,notifyReturn);
				    			return connection.rollback(function(){
						        	throw err;
					      		});
			                }else{
				                connection.commit(function(err){
							        if (err) {//出现错误，回滚
							        	logger.debug(error);
							        	reject();
							        	returnNofify(res,notifyReturn);
							          	return connection.rollback(function() {
							            		throw err;
							          	});
							        }
							        notifyReturn = `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[ok]]></return_msg></xml>`;
							        returnNofify(res,notifyReturn);
							        resolve();
							    });
				            }
						    connection.release();
			            });
			        	logger.debug(updateOrder.sql);
	                }
	            });
	            logger.debug(query.sql);
			})
		});
	});
}
/*
 * 支付完成，微信异步回调
 */
router.post("/payNotifyUrl",function(req, res){
	var notify = req.body.xml;
	var notifyReturn = "";
	if(notify.result_code == "SUCCESS" && notify.return_code == "SUCCESS" ){
		//1.判断签名
		
		//2.redis 数据锁，处理并发
		redis.get("ORDER-ID-"+notify.out_trade_no).then(out_trade_no => {//同一个订单，并发控制
			if(out_trade_no){
				notifyReturn = `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[数据正在处理中]]></return_msg></xml>`;
				returnNofify(res,notifyReturn);
			}else{
				redis.set("ORDER-ID-"+notify.out_trade_no,notify.out_trade_no,10);
				//3.是否已经处理
				orderHandled(notify.out_trade_no).then(paymentData => {
					if(paymentData.length > 0){//该订单已处理
						notifyReturn = `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[数据已处理]]></return_msg></xml>`;
						returnNofify(res,notifyReturn);
					}else{
						//4.判断订单金额是否相同
						orderTotalFee(notify.out_trade_no,notify.total_fee).then(flag=>{
							if(flag){//更新订单信息，并保存收款信息
								updateOrderPayment(notify,res);
							}else{
								notifyReturn = `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[订单金额不符]]></return_msg></xml>`;
								returnNofify(res,notifyReturn);
							}
						});
					}
				});
			}
	    }).catch(err=>{
			logger.debug("微信支付完成，异步回调");
			logger.debug(err);
			notifyReturn = `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[系统异常]]></return_msg></xml>`;
			returnNofify(res,notifyReturn);
		});
	}else{
		//支付失败
		logger.debug(notify.return_msg);
		notifyReturn = `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[ok]]></return_msg></xml>`;
		returnNofify(res,notifyReturn);
	}
});
function returnNofify(res,notifyReturn){
	logger.debug(notifyReturn);
	res.writeHead(200, {'Content-Type': 'application/xml'});
	res.end(notifyReturn);
}
/*
 * 统一下单异步回调
 */
router.post('/pay', function(req, res) {
	var order = {
		sn:"1111111111",
		fee:"23423423"
	}
	wechatPay.unifiedorder(order);
	res.json({code:"100000","message":test});
});

/*微信安全接入*/
router.get('/test', function(req, res) {
	var order = {
		sn:"1111111111",
		fee:"23423423"
	}
	wechatPay.unifiedorder(order);
	res.json({code:"100000","message":test});
});


module.exports = router;