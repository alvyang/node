var express = require("express");
var router = express.Router();
var logger = require('../utils/logger');
var product = DB.get("Product");

router.post("/getProductByCategoryId",function(req,res){
	var categoryId = req.body.categoryId
	var productFields = product.fields.join(",");
	product.executeSql(`select ${productFields} from product where product_category_id = ${categoryId} and delete_flag = 0`,null,function(err,result){
		if(err){
			logger.debug(err);
			res.json({code:"100000"});
		}else{
			res.json({code:"000000",data:result});
		}
	});
});
//查询所有商品列表
router.post("/getProductsList",function(req,res){
 	//var sql = "select * from product left join product_image on product.id = product_image.product_id";
 	product.queryAll(function(err,result){
 		if(err){
 			logger.debug(err);
 			res.json({code:"100000"});
 		}else{
 			res.json({code:"000000",data:result});
 		}
 	});
});
//由商品id查询商品相关信息
router.post("/getProductMessage",function(req,res){
 	var pImage = DB.get("ProductImage");
 	var fields = product.fields.join(",")+","+pImage.fields.join(",");
 	var sql = `select ${fields} from (select * from product where product.id = ${req.body.id}) a left join product_image on a.id = product_image.product_id`;
 	product.executeSql(sql,null,function(err,result){
 		if(err){
 			logger.debug(err);
 			res.json({code:"100000"});
 		}else{
 			res.json({code:"000000",data:result});
 		}
 	});
});


module.exports = router;