var express = require("express");
var router = express.Router();
var logger = require('../utils/logger');
function keepTwoDecimal(num) {
	var result = parseFloat(num);
	if (isNaN(result)) {
		console.log('传递参数错误，请检查！');
		return false;
	}
  	result = Math.round(num * 100) / 100;
  	return result;
}
//生成订单
router.post("/addOrders",function(req,res){
 	var orders = DB.get("Order");
 	orders.getConnection(function(connection){//获得数据库连接
		connection.beginTransaction(function(err){//创建事务，出错回滚
			if (err) { 
				logger.debug(err);
				throw err; 
			}
			var openid = req.body.openid;//微信用户id
			var products = req.body.products;//商品信息
			var numPrice = 0;
		    var createTime = moment().format("YYYY-MM-DD HH:mm:ss");
		    new Promise(function(resolve, reject){
		    		var ids="";
		    		products.forEach(function(value){
		    			ids += value.id+",";
		    		});
		    		ids = ids.substring(0,ids.length - 1);
	    			var query = connection.query(`select price from product where id in (${ids})`,function(error, results){
			    		if (error) {//出现错误，回滚
				    		res.json({code:"100000"});
				    		logger.debug(error);
				        return connection.rollback(function(){
				        		throw error;
				        });
				    }else{
				    		resolve(results);
				    }
		    		});
		    		logger.debug(query.sql);
		    }).then(productPrice => {
		    		var l = products.length;
		    		for(var i = 0 ; i < l;i++){//计算总金额
		    			numPrice += keepTwoDecimal(products[i].quantity*productPrice[0].price);
		    		}
		    		//生成订单
		    		console.log(numPrice);
		    }).then(data => {
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
module.exports = router;