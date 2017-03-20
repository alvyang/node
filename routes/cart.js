var express = require("express");
var router = express.Router();
var redis = require("../utils/redis_util.js");
var uuid=require("node-uuid");
var moment = require('moment');

router.post("/addCart",function(req,res){
	var cart = DB.get("Cart");
	cart.getConnection(function(connection){//获得数据库连接
		connection.beginTransaction(function(err){//创建事务，出错回滚
			if (err) { 
				logger.debug(err);
				throw err; 
			}
			var openid = req.body.openid;
		    var createTime = moment().format("YYYY-MM-DD HH:mm:ss");
			//查询当前用户的购物车id
			connection.query(`select id from cart where member_id = ${openid}`,req.body.cart,function (error, results) {
			    if (error) {//错误回滚
			    	res.json({code:"100000"});
			    	logger.debug(error);
			      	return connection.rollback(function(){
			        	throw error;
			      	});
			    }
			    new Promise(function(resolve, reject){
				    var cartItem = [],cartId = results[0].id;//得到购物车id
				    req.body.cartItem.forEach(function(item){
				    	item.cart_id = cartId;
				    	item.creation_date = createTime;
				    	//判断该商品是否已经在购物车
				    	var sql_temp = `select * from cart_item where product_id = ${item.product_id} and cart_id = ${cartId}`;
				    	connection.query(sql_temp,function(error, results){
				    		if(error){
				    			logger.debug(error);
				    			res.json({code:"100000"});
				    			return connection.rollback(function(){
						        	throw error;
						      	});
				    		}
				    		if(results.length == 0){//没有查询到，说明没有添加到购物车
						    	cartItem.push(item);
				    		}
				    	});
				    });
				    resolve(cartItem);
			    }).then(cartItem => {//执行插入购物车商品
			    	cartItem.forEach(function(value){
			    		connection.query("insert into cart_item set ?",value,function(error, results){
					    	if (error) {//出现错误，回滚
					    		res.json({code:"100000"});
					    		logger.debug(error);
						        return connection.rollback(function(){
						        	throw error;
						        });
						    }
					    });
			    	});
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