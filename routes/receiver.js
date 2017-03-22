var express = require("express");
var router = express.Router();
var redis = require("../utils/redis_util.js");

router.post("/getReceiverList",function(req,res){
	var receiver = DB.get("Receiver");
	var openId = req.body.openId;
	receiver.getConnection(function(connection){
		var fields = receiver.fields;
		var query = connection.query(`select ${fields} from receiver where open_id = '${openId}'`,function(error, results){
	    		if (error) {//出现错误，回滚
		    		logger.debug(error);
		        res.json({"code":"100000",message:"获取地址出错"});
		    }else{
		    		if(results.length == 0){
		    			res.json({"code":"000000",receivers:null});
		    		}else{
		    			res.json({"code":"000000",receivers:results[0]});
		    		}
		    }
		    connection.release(); //release
		});
		logger.debug(query.sql);
	});
});

module.exports = router;