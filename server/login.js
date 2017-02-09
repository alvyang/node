var express = require("express");
var router = express.Router();

router.get("/index",function(req,res){
	res.sendfile("index.html");
});

module.exports = router;