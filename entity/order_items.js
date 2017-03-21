module.exports = {
	key:'OrderItem',
	name:'order_item',
	fields:['id',
			'sn',//商品编号 
			'creation_date',//创建日期
			'name',//商品名称
			'price',//商品价格
			'quantity',//商品数量
			'thumbnail',//商品缩略图
			'order_id',//订单id
			'delete_flag',//删除标志
			'product_id'//商品id
	]
};
