var express = require("express");
var router = express.Router();
var logger = require('../utils/logger');
var moment = require('moment');

//获取订单统计数量
router.post("/getOrderNum",function(req,res){
	var order = DB.get("Order");
	var openId = req.body.open_id;
	order.getConnection(function(connection){
		/* 
		 * 1:查询待付款 条数  2：查询未发货订单条数   3：已发货订单条数
		 */
		var sql = "select count(*) from `order` where payment_status = 0 and open_id = '"+openId+"' ;"+
				  "select count(*) from `order` where payment_status = 2 and shipping_status = 0 and open_id = '"+openId+"' ;"+
				  "select count(*) from `order` where payment_status = 2 and shipping_status = 2 and open_id = '"+openId+"' ;";
		var query =  connection.query(sql,function(error, results){
			if(error){
				logger.debug(error);
 				res.json({code:"100000"});
			}else{
				console.log(results);
	 			res.json({code:"000000",data:results});
	 		}
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
							        }else{
							        		resolve();
							        }
							    });
							}
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
    			saveOrder(orderData,orderItem);//生成订单
    		}
    }).then(data=>{//进了这里,说明前面的代码正常执行了,个性购物车状态
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
			        res.json({"code":"100000",message:"更新购物车商品出错"});
			    }else{
			    		res.json({"code":"000000",message:""});
			    }
	            connection.release(); //release
	        });
	        logger.debug(query.sql);
	    })
    		
    }).catch(function(error){
    		console.log(error);
    });
});
module.exports = router;