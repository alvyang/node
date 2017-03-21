var express = require("express");
var router = express.Router();
var redis = require("../utils/redis_util.js");
var uuid=require("node-uuid");
var moment = require('moment');
router.post("/getCartItem",function(req,res){
	var cart = DB.get("Cart");
	var product = DB.get("Product");
	var fields = product.fields;
	var sql = `select ${fields},c.quantity from (select b.quantity,b.product_id from 
			(select cart.id from cart where cart.open_id ='${req.body.open_id}') a left join cart_item b 
		on a.id = b.cart_id) c 
			left join product d on c.product_id = d.id`;
	cart.executeSql(sql,null,function(err,result){
 		if(err){
 			logger.debug(err);
 			res.json({code:"100000"});
 		}else{
 			res.json({code:"000000",data:result});
 		}
 	});
});
router.post("/addCart",function(req,res){
	var cart = DB.get("Cart");
	cart.getConnection(function(connection){//获得数据库连接
		connection.beginTransaction(function(err){//创建事务，出错回滚
			if (err) { 
				logger.debug(err);
				throw err; 
			}
			var openid = req.body.openid;
			var cartItem = req.body.cartItem;
		    var createTime = moment().format("YYYY-MM-DD HH:mm:ss");
			//查询当前用户的购物车id
			connection.query(`select id from cart where open_id = '${openid}'`,req.body.cart,function (error, results) {
			    if (error) {//错误回滚
			    	res.json({code:"100000"});
			    	logger.debug(error);
			      	return connection.rollback(function(){
			        	throw error;
			      	});
			    }
			    new Promise(function(resolve, reject){
				    var cartId = results[0].id;//得到购物车id
				    	//判断该商品是否已经在购物车
				    	var sql_temp = `select * from cart_item where product_id = ${cartItem.product_id} and cart_id = ${cartId}`;
				    var query=connection.query(sql_temp,function(error, results){
				    		if(error){
				    			logger.debug(error);
				    			res.json({code:"100000"});
				    			return connection.rollback(function(){
						        	throw error;
					      	});
				    		}
				    		if(results.length == 0){//没有查询到，说明没有添加到购物车
				    			cartItem.cart_id = cartId;
						    	resolve(cartItem);
				    		}else{
			    				resolve(null);
				    		}
				    		
				    	});
				    	logger.debug(query.sql);
			    }).then(data => {//执行插入购物车商品
			    		if(data){
			    			data.creation_date = createTime;
		    				var query = connection.query("insert into cart_item set ?",data,function(error, results){
					    		if (error) {//出现错误，回滚
					    			res.json({code:"100000"});
					    			logger.debug(error);
						        return connection.rollback(function(){
						        	throw error;
						        });
						    }
					    });
					    logger.debug(query.sql);
			    		}
			    }).then(data=>{//执行完成后，提交事务
				    connection.commit(function(err){
				        if (err) {//出现错误，回滚
				        	res.json({code:"100000"});
				        	logger.debug(error);
				          	return connection.rollback(function() {
				            	throw err;
				          	});
				        }
				        res.json({code:"000000"});
				    });
			    });
		    });
		});
	});
});
module.exports = router;