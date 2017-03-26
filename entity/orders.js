module.exports = {//luZ_O1HPaeC!
	key:'Order',
	name:'order',
	fields:['id',
			'order_status',//订单状态 0：未确认 1:确认 2:已完成 3：已取消
			'payment_status',//支付状态 0：未支付 1:部分支付：2:已支付  3：部分退款   4：已退款
			'shipping_status',//配送状态 0：初始状态未发货 1:部分发货 2：已发货 3：部分退货  4：已退货
			'amount_paid',//已付金额
			'area_name',//地区名称
			'fee',//订单金额，订单金额还加了freight运费，暂时不考虑
			'address',//地址
			'consignee',//收获人
			'memo',//附言
			'phone',//电话
			'point',//赠送积分
			'sn',//订单编号
			'member_id',//会员id
			'open_id',//openId
			'delete_flag',//删除标志
			'creation_date'//创建日期
	]
};
