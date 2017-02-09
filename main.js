var express = require("express");
var app = express();

var bodyParse = require("body-parser");
var cookieParser = require("cookie-parser");
var fs=require("fs");
var path = require("path");

var mysql = require("mysql");
app.use(cookieParser());
app.use(bodyParse.urlencoded({extended:false}));

app.use("/assets",express.static(path.join(__dirname,"assets")));

app.get("/",function(req,res){
	res.sendfile("public/main.html");
	console.log("main page is required");
});

app.get("/add",function(req,res){
	res.sendfile("public/add.html");
	console.log("add page is required");
});

//创建连接  

app.post("/login",function(req,res){
	name = req.body.name;
	pwd = req.body.pwd;
	var client = mysql.createConnection({  
	  user: 'root',  
	  password: 'admin',  
	  database : 'node', 
	}); 
	client.connect();
	client.query(  
	  	"select * from user where username = '" + name + "' and password = '"+pwd+"'",  
	  	function selectCb(err, results, fields) {  
		    if (err) {  
		      throw err;  
		    }  
		    if(results.length > 0){
	          	for(var i = 0; i < results.length; i++){
	              	console.log("%d\t%s\t%s", results[i].id, results[i].username, results[i].password);
	          	}
	          	res.status(200).send(name+'--'+pwd);
		    }
	  	}  
	); 
    client.end();  
});

var server = app.listen(3000);
