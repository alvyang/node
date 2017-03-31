var express = require("express");
var router = express.Router();
var moment = require('moment');
var logger = require('../utils/logger');

var category = DB.get("ProductCategory");
var product = DB.get("Product");
//删除购物车对应商品
router.get('/getCategoryList',function(req,res){
	var fields = category.fields.join(",");
	var productFields = product.fields.join(",");
	new Promise(function(resolve, reject){
		//查询所有一级分类
		category.executeSql(`select ${fields} from product_category where parent_id is null`,null,function(err,result){
			if(err){
				reject(err);
			}else{
				resolve(result);
			}
		});
	}).then(data => {
		//查询第一个分类下，所有商品信息
		var id0 = data[0].id;
		product.executeSql(`select ${productFields} from product where product_category_id = ${id0} and delete_flag = 0`,null,function(err,result){
			if(err){
				logger.debug(err);
				res.json({code:"100000"});
			}else{
				var resData = {
					catagoryList:data,
					productList:result,
				};
				res.json({code:"000000",data:resData});
			}
		});
		
	}).catch(err=>{
		logger.debug(err);
		res.json({code:"100000"});
	});
});

module.exports = router;