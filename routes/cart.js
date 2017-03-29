var express = require("express");
var router = express.Router();
var redis = require("../utils/redis_util.js");
var uuid=require("node-uuid");
var moment = require('moment');

//删除购物车对应商品
router.post('/deleteCartItem',function(req,res){
	var cartItem = DB.get("CartItem");
	var id = req.body.id;
	cartItem.remove(id,function(err,result){
		if(err){
			logger.debug(error);
	        res.json({"code":"100000",message:"删除购物车信息失败"});
		}else{
			res.json({"code":"000000",message:"删除购物车信息成功"});
		}
	});
});
//更新购物车商品数量
router.post('/updateQuantity',function(req,res){
	var cartItem = DB.get("CartItem");
	var itemData = req.body;
	cartItem.update(itemData, function(error, result) {
        if (error) {
    		logger.debug(error);
	        res.json({"code":"100000",message:"修改订单商品数量出错"});
	    }else{
    		res.json({"code":"000000",message:"修改订单商品数量成功"});
	    }
    });
});
//获取购物车项
router.post("/getCartItem",function(req,res){
	var cart = DB.get("Cart");
	var product = DB.get("Product");
	var fields = product.fields;
	var sql = `select ${fields},c.quantity,c.item_id,d.sn from
		(select b.quantity,b.product_id,b.id as item_id from cart a ,cart_item b 
			where a.id = b.cart_id and b.delete_flag = 0 and a.open_id = '${req.body.open_id}'
		) c ,product d where c.product_id = d.id`;
	cart.executeSql(sql,null,function(err,result){
 		if(err){
 			logger.debug(err);
 			res.json({code:"100000"});
 		}else{
 			res.json({code:"000000",data:result});
 		}
 	});
});
/* 
 * 加入购物车
 */
router.post("/addCart",function(req,res){
	var cart = DB.get("Cart");
	var openid = req.body.openid;
	var cartItem = req.body.cartItem;
    var createTime = moment().format("YYYY-MM-DD HH:mm:ss");
	//查询当前用户的购物车id
	cart.getConnection(function(connection){
		connection.query(`select id from cart where open_id = '${openid}'`,req.body.cart,function (error, results) {
			var cartId = results[0].id;//得到购物车id
		    new Promise(function(resolve, reject){
			    	//判断该商品是否已经在购物车
			    	var sql_temp = `select * from cart_item where product_id = ${cartItem.product_id} and cart_id = ${cartId} and delete_flag = 0`;
			    var query=connection.query(sql_temp,function(error, results){
			    		if(error){
			    			logger.debug(error);
			    			res.json({code:"100000"});
			    			reject();
			    		}else{
			    			if(results.length == 0){//没有查询到，说明没有添加到购物车
				    			cartItem.cart_id = cartId;
						    	resolve(cartItem);
				    		}else{
			    				resolve(null);
				    		}
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
					    }else{
					    		res.json({code:"000000",message:"添加购物车成功"});
					    }
				    });
				    logger.debug(query.sql);
		    		}
		    		connection.release(); 
		    });
	    });
	});
});
module.exports = router;