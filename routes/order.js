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
/*
 * @params  products：订单产品列表
 * @return  numPrice：订单总额
 */
function getNumPrice(products){
	var orders = DB.get("Order"),numPrice=0;
	return new Promise(function(resolve, reject){
		var ids="";
		products.forEach(function(value){
			ids += value.id+",";
		});
		ids = ids.substring(0,ids.length - 1);
		orders.getConnection(function(connection){
			var query = connection.query(`select price from product where id in (${ids})`,function(error, results){
	    		if (error) {//出现错误，回滚
		    		reject(error);
		    		logger.debug(error);
			        return connection.rollback(function(){
			        	throw error;
			        });
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
//生成订单
router.post("/addOrders",function(req,res){
 	var orders = DB.get("Order");
	var openid = req.body.openid;//微信用户id
	var products = req.body.products;//商品信息
    var createTime = moment().format("YYYY-MM-DD HH:mm:ss");//创建时间
    getNumPrice(products).then(numPrice => {//订单总额
    		
    		
    });
    
// 	orders.getConnection(function(connection){//获得数据库连接
//		connection.beginTransaction(function(err){//创建事务，出错回滚
//			if (err) { 
//				logger.debug(err);
//				throw err; 
//			}
//		});
// 	});
});
module.exports = router;