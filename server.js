var express = require('express');
var path = require('path');
var fs=require("fs");
var morgan = require('morgan');//输出日志
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multiparty=require("connect-multiparty");
var session=require("express-session");

//Express配置
var app = express();
//app.use(morgan('dev'));
app.use(multiparty());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({secret:'lvyang',cookie:{maxAge: 60000*30 },saveUninitialized:true,resave:true}));

global.logger=require("./utils/logger.js");
global.moment = require('moment');//日期函数全局访问
global.moment.locale('zh-cn');
global.DB=require("./utils/dbutil.js").Instance();

var wechat = require("./utils/wechat_util.js");
wechat.getAccessToken();
setInterval(function(){
	wechat.getAccessToken();
},7000*1000);

///定义实体
app.set('entity',__dirname + '/entity/');
var entity=app.get("entity");
fs.readdirSync(entity).forEach(function(fileName) {
    var filePath = entity + fileName;
    if(!fs.lstatSync(filePath).isDirectory()) {
		DB.define(require(filePath));
    }
});
//node.js做代理服务器，做测试用
var request = require('request');
app.use('/web/', function(req, res) {//静态页面代理服务器
    var url = 'http://localhost:8020/repositories/node_web/'+req.url;
    req.pipe(request(url)).pipe(res);
});
app.use('/upload/', function(req, res) {//图片代理服务器，指向
    var url = 'http://localhost:8080/upload/'+req.url;
    req.pipe(request(url)).pipe(res);
});
//控制层_根据routes文件名+方法_约定请求路径
app.set('routes',__dirname + '/routes/');
var routes=app.get("routes");
fs.readdirSync(routes).forEach(function(fileName) {
    var filePath = routes + fileName;
    var rname=fileName.substr(0,fileName.lastIndexOf("."));
    if(!fs.lstatSync(filePath).isDirectory()) {
       app.use("/inter/"+rname,require(filePath));
    }
});

//Session拦截控制
app.all("*",function(req,res,next){
    next();
});
///404
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    res.status(err.status || 500);
});

///500
app.use(function(err, req, res){
    logger.error(err);
    res.status(err.status || 500);
});

app.listen(3000);