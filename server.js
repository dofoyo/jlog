var express = require('express');
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var secret = 'this is the secret secret secret 12356';

var databaseUrl = "jlog"; // "username:password@example.com/mydb"
var userCollections = ["users"]
var logCollections = ["logs"]
var userdb = require("mongojs").connect(databaseUrl, userCollections);
var logdb = require("mongojs").connect(databaseUrl, logCollections);

var app = express();

// We are going to protect /api routes with JWT
app.use('/api', expressJwt({secret: secret}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

// 用于开发调试，可以看e2e测试结果
app.use('/', express.static(__dirname + '/'));

// 正式发布后，修改为一下
//app.use('/', express.static(__dirname + '/app'));

app.use(function(err, req, res, next){
  if (err.constructor.name === 'UnauthorizedError') {
    res.send(401, 'Unauthorized');
  }
});

app.post('/authenticate', function (req, res) {
   userdb.users.find({username:req.body.username,password:req.body.password}, function(err, users) {
        if( err || !users || users.length==0){
            res.send(401, 'Wrong user or password');
            console.log("authenticate: wrong user or password!");
        }else {
            var user = users[0];
            var profile = {
                id:user._id,
                username:user.username,
                password:user.password,
                department:user.department
            };
            console.log("authenticate: succeeded!");
            var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });
            res.json({token: token });
        }
   });
});

app.get('/api/restricted', function (req, res) {
  console.log('user ' + req.user.username + ' is calling /api/restricted');
  res.json({
    name: req.user.email
  });
});


//create REST api to get all logs from log collection.
app.get('/logs', function (req, res) {
    console.log("get logs!");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    logdb.logs.find('', function(err, logs) {
        if( err || !logs) console.log("No logs found");
        else
        {
            res.writeHead(200, {'Content-Type': 'application/json'});
            str='[';
            logs.forEach( function(log) {
                str = str + '{"message":"' + log.message + '","creator":"' + log.creator + '"},' +'\n';
                //console.log(str);
            });
            str = str.trim();
            str = str.substring(0,str.length-1);
            str = str + ']';
            res.end(str);
        }
    });
});


/*
"id": "0004",
"message":"完成资金流程的合计金额的计算错误的修改。",
"datetime":"2014-6-1 18:00:32",
"creator":{"id":"002","name":"钱二","department":"集团总部.信息化管理中心.实施推广部"},
"comments":[]
 */


//Here we have made a POST request to create an user via REST calling.
app.post('/log', function (req, res){
    console.log("POST log!");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    console.log('req.body = '+req.body);
    console.log('req.body.mydata = ' + req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    console.log('jsonData.message = ' + jsonData.message);
    console.log('jsonData.creator = ' + jsonData.creator);

    logdb.logs.save({message: jsonData.message, creator: jsonData.creator}, function(err, saved) {
        if( err || !saved ){
            var msg ="log not saved";
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "log saved.";
            res.end(msg);
            console.log(msg);
        }
    });
});

app.get('/users', function (req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    userdb.users.find('', function(err, users) {
        if( err || !users) console.log("No users found");
        else
        {
            res.writeHead(200, {'Content-Type': 'application/json'});
            str='[';
            users.forEach( function(user) {
                str = str + '{"name":"' + user.username + '","password":"' + user.password + '","department":"' + user.department + '"},' +'\n';
                //console.log(str);
            });
            str = str.trim();
            str = str.substring(0,str.length-1);
            str = str + ']';
            res.end( str);
        }
    });
});


app.post('/user', function (req, res){
    console.log("POST: ");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    console.log('req.body = '+req.body);
    console.log('req.body.mydata = ' + req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    console.log('jsonData.username = ' + jsonData.username);
    console.log('jsonData.password = ' + jsonData.password);
    console.log('jsonData.department = ' + jsonData.department);

    userdb.users.save({department: jsonData.department, password: jsonData.password, username: jsonData.username}, function(err, saved) {
        if( err || !saved ){
            var msg ="User not saved";
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "User saved.";
            res.end(msg);
            console.log(msg);
        }
    });
});

app.listen(8080, function () {
  console.log('server started,  http://localhost:8080');
});


