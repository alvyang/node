var express = require("express");
var router = express.Router();

router.post("/getMenuList",function(req,res){
 	var user = DB.get("Menu");
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