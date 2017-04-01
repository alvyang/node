var express = require("express");
var logger = require('../utils/logger');
var router = express.Router();
var moment = require('moment');
var wechat = require('../utils/wechat_util.js');
var wechatPay = require('../utils/wechat_pay.js');

/*
 * 统一下单异步回调
 */
router.post('/pay', function(req, res) {
	var order = {
		sn:"1111111111",
		fee:"23423423"
	}
	wechatPay.unifiedorder(order);
	res.json({code:"100000","message":test});
});

/*微信安全接入*/
router.get('/test', function(req, res) {
	var order = {
		sn:"1111111111",
		fee:"23423423"
	}
	wechatPay.unifiedorder(order);
	res.json({code:"100000","message":test});
});


module.exports = router;