var express = require('express');
var path = require('path');
var fs=require("fs");
var morgan = require('morgan');//输出日志
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multiparty=require("connect-multiparty");
var session=require("express-session");

global.logger=require("./server/utils/logger.js");
global.moment = require('moment');//日期函数全局访问
global.moment.locale('zh-cn');
global.DB=require("./server/utils/dbutil.js").Instance();

///定义实体
DB.define({key:'User',name:'user',fields:['id','username','password']});

//Express配置
var app = express();
app.set('routes',__dirname + '/server/');
//app.use(morgan('dev'));
app.use(multiparty());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({secret:'lvyang',cookie:{maxAge: 60000*30 },saveUninitialized:true,resave:true}));
app.use(express.static(path.join(__dirname, 'public')));


//Session拦截控制
app.all("*",function(req,res,next){
    next();
});

//控制层_根据routes文件名+方法_约定请求路径
var routes=app.get("routes");
fs.readdirSync(routes).forEach(function(fileName) {
    var filePath = routes + fileName;
    var rname=fileName.substr(0,fileName.lastIndexOf("."));
    if(!fs.lstatSync(filePath).isDirectory()) {
       if(rname==="index"){
           app.use("/",require(filePath));
       }else{
           app.use("/"+rname,require(filePath));
       }
    }
});

///404
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
});

///500
app.use(function(err, req, res){
    logger.error(err);
    res.status(err.status || 500);
});

app.listen(3000);