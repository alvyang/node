var express = require("express");
var router = express.Router();
var logger = require('../utils/logger');
var moment = require('moment');
//工具类引入
var wechatPay = require('../utils/wechat_pay.js');
router.post("/cancelOrder",function(req,res){
	var order = DB.get("Order");
	user.update(req.body,function(err,result){
		if(err){
			res.json({"code":"100000",message:"取消订单失败！"});
		}else{
			res.json({"code":"000000",message:"取消订单成功！"});
		}
	});
});
/* 
 * 查询全部订单
 * @params openId 微信openid
 * 		   pages  分页参数currentPage:当前第几页,pageSize:每页几条
 * 		   type	  订单状态 1:全部 2:待付款3:待发货4:待收货5:待评价  详细说明，请看entity/orders.js
 * @return order left join shipping 的 list , totle:总数
 */
function getOrdersShipping(openId,page,type){
	var start = (page.currentPage-1)*page.pageSize;//开始位置
	var end = page.currentPage*page.pageSize;//结束位置
	var sql = "select o.*,s.tracking_no,s.delivery_corp,s.delivery_corp_url from `order` o left join shipping s "+
			  "on o.id = s.order_id where o.open_id = '"+openId+"'";
	var sqlCount = "select count(*) as num from `order` where open_id = '"+openId+"'";
	if(type == 1){//全部
	}else if(type == 2){//待付款
		sql += " and payment_status = 0 and order_status in (0,1,2)"+" order by o.creation_date desc";
		sqlCount += " and payment_status = 0 and order_status in (0,1,2)";
	}else if(type == 3){//待发货
		sql += " and payment_status = 2 and shipping_status = 0 and order_status in (0,1,2)"+" order by o.creation_date desc";
		sqlCount +=  " and payment_status = 2 and shipping_status = 0 and order_status in (0,1,2)";
	}else if(type == 4){//已发货
		sql += " and payment_status = 2 and shipping_status = 2 and order_status in (0,1,2)"+" order by o.creation_date desc";
		sqlCount += " and payment_status = 2 and shipping_status = 2 and order_status in (0,1,2)";
	}
	sql += " limit "+start+","+end//加分页
	var order = DB.get("Order");
	return new Promise(function(resolve, reject){
		order.getConnection(function(connection){
			var queryCount = connection.query(sqlCount,function(error, count){//查询总数
				if (error) {//出现错误，回滚
		    			logger.debug(error);
			    }else{
					var query = connection.query(sql,function(error, results){
				    		if (error) {//出现错误，回滚
					    		reject(error);
					    		logger.debug(error);
					    }else{
						    	var data = {
						    		total:count[0].num,
						    		list:results,
						    	}
						    	resolve(data);
					    }
					    connection.release(); //release
					});
					logger.debug(query.sql);
			    }
			});
			logger.debug(queryCount.sql);
		});
    }); 
}

router.post("/getOrderList",function(req,res){
	var orderItem = DB.get("OrderItem");
	var openId = req.body.open_id;
	//1:全部 2:待付款3:待发货4:待收货5:待评价
	var type = req.body.type;
	var page = {
		currentPage:req.body.currentPage,
		pageSize:req.body.pageSize,
	}
	getOrdersShipping(openId,page,type).then(orders => {
		var list = orders.list, l = orders.list.length;
		var orderIds = [];
		for(var i = 0 ; i < l ; i++){//查询订单项
			orderIds.push(orders.list[i].id);
		}
		if(orderIds.length > 0){
			var sql = "select "+orderItem.fields.join(',')+" from order_item where order_id in ("+orderIds.join(',')+")";
			orderItem.getConnection(function(connection){
				var query = connection.query(sql,function(error, results){
					if(error){
						logger.debug(error);
		   				res.json({code:"100000"});
					}else{
						var rl = results.length;
						for(var j = 0 ; j < rl ; j++){
							for(var i = 0 ; i < l ; i++){//查询订单项
								if(!list[i].orderItem){
									list[i].orderItem = [];
								}
								if(results[j].order_id == list[i].id){
									list[i].orderItem.push(results[j]);
									break;
								}
							}
						}
						res.json({code:"000000",data:orders});
						logger.debug(query.sql);
					}
					connection.release(); 
				});
			});
		}else{
			res.json({code:"110000",data:null});
		}
	}).catch(err=>{
		logger.debug(err);
	});
});

//获取订单统计数量
router.post("/getOrderNum",function(req,res){
	var order = DB.get("Order");
	var openId = req.body.open_id;
	order.getConnection(function(connection){
		var sql = "select * from `order` where order_status in (0,1) and open_id = '"+openId+"'";
		var query =  connection.query(sql,function(error, results){
			if(error){
				logger.debug(error);
 				res.json({code:"100000"});
			}else{
				var l = results.length;
				/* 
				 * pendPay:查询待付款 条数  
				 * pendDelivery：查询未发货订单条数   
				 * pendReceive：已发货订单条数
				 */
				var pendPay = 0 ,pendDelivery=0 ,pendReceive =0;
				for(var i = 0 ; i < l ; i++){
					if(results[i].payment_status == 0){
						pendPay++;
					}else if(results[i].payment_status == 2 && results[i].shipping_status == 0){
						pendDelivery++;
					}else if(results[i].payment_status == 2 && results[i].shipping_status == 2){
						pendReceive++;
					}
				}
				var data = {
					pendPay:pendPay,
					pendDelivery:pendDelivery,
					pendReceive:pendReceive,
				};
	 			res.json({code:"000000",data:data});
	 		}
			connection.release(); 
		});
	});
});

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
 * @params  products：订单产品列表
 * @return  numPrice：订单总额
 */
function getNumPrice(products){
	var orders = DB.get("Order"),numPrice=0;
	var ids="";//封闭已选择的商品id字符串
	products.forEach(function(value){
		ids += value.id+",";
	});
	ids = ids.substring(0,ids.length - 1);
	return new Promise(function(resolve, reject){
		orders.getConnection(function(connection){
			var query = connection.query(`select price from product where id in (${ids})`,function(error, results){
		    		if (error) {//出现错误，回滚
			    		reject(error);
			    		logger.debug(error);
			    }else{
			    		var l = products.length;
					for(var i = 0 ; i < l;i++){//计算总金额
						numPrice += keepTwoDecimal(products[i].quantity*results[0].price);
					}
					resolve(numPrice);
			    }
			    connection.release(); //release
			});
			logger.debug(query.sql);
		});
    });
}
/* 
 * 生成订单
 * @params order 订单对象
 * @return id 订单主键id
 */
function saveOrder(orderData,orderItem){
	var order = DB.get("Order");
	//初始化订单状态
	var createTime = moment().format("YYYY-MM-DD HH:mm:ss");//创建时间
	orderData.order_status = 0;
	orderData.payment_status = 0;
	orderData.shipping_status = 0;
	orderData.is_allocated_stock=0;
	orderData.creation_date = createTime;
	orderData.sn = new Date().getTime();
	return new Promise(function(resolve, reject){//创建一个异步连接,用于创建事务
		order.getConnection(function(connection){//获得数据库连接
			connection.beginTransaction(function(err){//事务开始
				if(err){
					logger.debug(err);
					throw err; 
					reject(err);
				}
		    		var createTime = moment().format("YYYY-MM-DD HH:mm:ss");
				connection.query("insert into `order` set ?",orderData,function(err,result){
					if(err){
						logger.debug(err);
						return connection.rollback(function() {
			            		throw err;
			          	});
			          	reject(err);
					}else{
						var ol = orderItem.length,oItems = [];
						for(var i = 0 ; i < ol ; i++){
				    			oItems.push({
				    				sn:orderItem[i].sn,
				    				creation_date:createTime,
				    				name:orderItem[i].full_name,
				    				full_name:orderItem[i].full_name,
				    				price:orderItem[i].price,
				    				quantity:orderItem[i].quantity,
				    				thumbnail:orderItem[i].image,
				    				order_id:result.insertId,
				    				product_id:orderItem[i].id,
				    			});
				    		}
				    		connection.query("insert into order_item set ?",oItems,function(err,result){
							if(err){
								logger.debug(err);
								return connection.rollback(function() {
					            		throw err;
					          	});
					          	reject(err);
							}else{
								connection.commit(function(err){
							        if (err) {//出现错误，回滚
							        		logger.debug(err);
							          	return connection.rollback(function() {
							            		throw err;
							          	});
							          	reject(err);
							        }else{
							        		resolve();
							        }
							    });
							}
							connection.release(); 
						});
					}
				});
			});
		});
	});
}
//生成订单
router.post("/addOrders",function(req,res){
 	var orders = DB.get("Order");
	var orderItem = req.body.orderItem;//商品信息
	var orderData = req.body.order;
	var price = req.body.price;
    getNumPrice(orderItem).then(numPrice => {//计算订单总额
		console.log(price,numPrice);
		if(price != numPrice){//判断提交金额与后台计算金额是否一致
			res.json({code:"100000",message:"提交金额与实际金额不附"});
			return ;
		}else{
			res.json({code:"000000",message:"生成订单出现错误"});
			return saveOrder(orderData,orderItem);//生成订单
		}
    }).then(data=>{
    	//在这里调用微信的统一下单接口
    	//return wechatPay.unifiedorder(orderData);
    }).then(res=>{
		//这里处理，微信统一下单接口，返回的数据
    	//res.json({"code":"100000",message:"更新购物车商品出错"});
    	//res.json({"code":"000000",message:""});
	}).then(data=>{//进了这里,说明前面的代码正常执行了,更新购物车状态
    		var openId = orderData.open_id;
    		//这里要注意,删除的是购物车下,逻辑删除,已经结算的商品
    		orders.getConnection(function(connection) {
		    var updateSql = `update cart_item set delete_flag = 1  where product_id in 
		    					( select b.product_id from
								(select ci.product_id from cart c,cart_item ci where c.open_id = '${openId}' and c.id = ci.cart_id) b
							)`
       		var query = connection.query(updateSql, function(error, result) {
	            if (error) {
            		console.log(error);
			    }
	            connection.release(); //release
	        });
	        logger.debug(query.sql);
	    })
    		
    }).catch(function(error){
    		res.json({code:"100000",message:"生成订单出现错误"});
    		console.log(error);
    });
});
module.exports = router;