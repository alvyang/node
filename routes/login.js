var express = require("express");
var router = express.Router();
var redis = require("../utils/redis_util.js");

router.post("/login",function(req,res){
	var user = DB.get("User");
	redis.get("YG-WECHAT-ACCESSTOKEN").then(res => {
		console.log("accesstoken:"+res);
	});
	user.where(req.body,null,function(err,result){
		if(result.length == 0){
			res.json({"code":"100000",message:"用户名或密码错误！"});
		}else{
			req.session.user=result;
			res.json({"code":"000000",message:"登录成功！"});
		}
	});
});

module.exports = router;