var express = require("express");
var router = express.Router();

var area = DB.get("Area");
//删除购物车对应商品
router.post('/getArea',function(req,res){
	
	area.executeSql("select id as code,name,parent_id as parend_code from area where delete_flag = 0",null,function(err,result){
		if(err){
			logger.debug("获取地址失败");
			logger.debug(err);
	        res.json({"code":"100000",message:"获取地址失败"});
		}else{
			var data = [];
			//封闭前端可识别的结构
			var l = result.length;
			for(var i = 0 ; i < l ; i++){//将第一层取出来
				if(!result[i].parend_code){
					result[i].parend_code = "0";
					data.push(result[i]);
				}
			}
			//第二层
			var sl = data.length;
			for(var i = 0 ; i < sl ; i++){
				if(!data[i].child_code){
					data[i].child_code = [];
				}
				for(var j = 0 ; j < l ; j++){
					if(data[i].code == result[j].parend_code ){
						data[i].child_code.push(result[j]);
					}
				}
			}
			//第三层
			for(var i = 0 ; i < sl ; i++){
				var childData = data[i].child_code;
				var tl = childData.length;
				for(var j = 0 ; j < tl ; j++){
					if(!childData[j].child_code){
						childData[j].child_code = [];
					}
					for(var m = 0 ; m < l ; m++){
						if(childData[j].code == result[m].parend_code ){
							childData[j].child_code.push(result[m]);
						}
					}
				}
			}
			res.json({"code":"000000",data:data,message:"获取地址成功"});
		}
	});
});

module.exports = router;