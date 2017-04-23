var express = require("express");
var router = express.Router();
var redis = require("../utils/redis_util.js");
var moment = require('moment');

/* 
 * 更新收货地址
 */
router.post("/updateReceiver",function(req,res){
	var receiver = DB.get("Receiver");
	var openId = req.body.openId;
	var receiverData = req.body.receiver;
    receiver.update(receiverData, function(error, result) {
        if (error) {
        	logger.debug("修改收货地址出错");
    		logger.debug(error);
	        res.json({"code":"100000",message:"修改收货地址出错"});
	    }else{
	    		res.json({"code":"000000",message:""});
	    }
    });

})
/* 
 * 添加收货地址
 */
router.post("/addReceiver",function(req,res){
	var receiver = DB.get("Receiver");
	var openId = req.body.openId;
	var receiverData = req.body.receiver;
	var createTime = moment().format("YYYY-MM-DD HH:mm:ss");
	receiverData.creation_date=createTime;
	receiverData.open_id = openId;
	receiverData.is_default=1;
	receiverData.id = null;
	receiver.getConnection(function(connection) {
        var query = connection.query("insert into receiver set ?", receiverData, function(error, result) {
            if (error) {//出现错误，回滚
            	logger.debug("添加收货出错");
		    		logger.debug(error);
		        res.json({"code":"100000",message:"添加收货出错"});
		    }else{
		    		res.json({"code":"000000",message:""});
		    }
            connection.release(); //release
        });
        logger.debug(query.sql);
    })
});
/* 
 * 查询默认收获地址
 */
router.post("/getDefaultReceiver",function(req,res){
	var receiver = DB.get("Receiver");
	var openId = req.body.openId;
	receiver.getConnection(function(connection){
		var fields = receiver.fields;
		var query = connection.query(`select ${fields} from receiver where open_id = '${openId}' and is_default = 1`,function(error, results){
	    		if (error) {//出现错误，回滚
	    			logger.debug("获取地址出错");
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
/* 
 * 查询所有地址
 */
router.post("/getReceiverList",function(req,res){
	var receiver = DB.get("Receiver");
	var openId = req.body.openId;
	receiver.getConnection(function(connection){
		var fields = receiver.fields;
		var query = connection.query(`select ${fields} from receiver where open_id = '${openId}'`,function(error, results){
	    		if (error) {//出现错误，回滚
	    			logger.debug("查询所有地址出错");
		    		logger.debug(error);
		        res.json({"code":"100000",message:"获取地址出错"});
		    }else{
		    		if(results.length == 0){
		    			res.json({"code":"000000",receivers:null});
		    		}else{
		    			console.log(results);
		    			res.json({"code":"000000",receivers:results});
		    		}
		    }
		    connection.release(); //release
		});
		logger.debug(query.sql);
	});
});

module.exports = router;