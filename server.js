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
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    logdb.logs.find({parentid:''}).sort({datetime:-1}, function(err, logs) {
        if( err || !logs){
            console.log("error or No logs found!");
        } else {
            console.log("there are "+ logs.length +" logs Found!");
            res.writeHead(200, {'Content-Type': 'application/json'});
            var str='[';
            logs.forEach( function(log) {
                var id = log._id;
                str += '{';
                str += '"id":"' + log._id + '",';
                str += '"message":"' + log.message + '",';
                str += '"datetime":"' + log.datetime + '",';
                str += '"creator":{';
                    str += '"id":"' + log.creator.id + '",';
                    str += '"name":"' + log.creator.name + '",';
                    str += '"department":"' + log.creator.department + '"';
                    str += '},';
                str += '"comments":[';
                logdb.logs.find({parentid:id}).sort({datetime:-1},function(err, comments){
                     if(err || !comments){
                        console.log("error or No Comments Found!");
                     }else{
                        console.log("there are "+ comments.length +" comments Found! id is " + id);
                        comments.forEach(function(comment){
                            str += '{';
                            str += '"id":"' + comment._id + '",';
                            str += '"message":"' + comment.message + '",';
                            str += '"datetime":"' + comment.datetime + '",';
                            str += '"creator":{';
                                str += '"id":"' + comment.creator.id + '",';
                                str += '"name":"' + comment.creator.name + '",';
                                str += '"department":"' + comment.creator.department + '"';
                                str += '},';
                            str += '},';
                            str += '\n';
                        });
                     }
                });
                str += ']';
                str += '},';
                str += '\n';
            });
            str = str.trim();
            str = str.substring(0,str.length-1);
            str = str + ']';
            console.log("get logs successed, with comments!")
            res.end(str);
        }
    });
});

//create a log record.
app.post('/log', function (req, res){
    //console.log("POST log!");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log('req.body = '+req.body);
    console.log('req.body.mydata = ' + req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    console.log('jsonData.parentid = ' + jsonData.parentid);
    console.log('jsonData.message = ' + jsonData.message);
    console.log('jsonData.creator = ' + jsonData.creator);
    //var msg = jsonData.message.replaceAll("\n","").replaceAll("\r","");
    logdb.logs.save({parentid:jsonData.parentid,message:jsonData.message, creator: jsonData.creator,datetime:new Date()}, function(err, saved) {
        if( err || !saved ){
            var msg ="log not saved";
            console.log(msg);
            res.end(msg);
        }else{
            var msg = "log saved.";
            console.log(msg);
            res.end(msg);
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
            var str='[';
            users.forEach( function(user) {
                str = str + '{"name":"' + user.username + '","password":"' + user.password + '","department":"' + user.department + '"},' +'\n';
                //console.log(str);
            });
            str = str.trim();
            str = str.substring(0,str.length-1);
            str = str + ']';
            console.log("get users successed!")
            res.end( str);
        }
    });
});


app.post('/user', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log('req.body = '+req.body);
    console.log('req.body.mydata = ' + req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    console.log('jsonData.username = ' + jsonData.username);
    console.log('jsonData.password = ' + jsonData.password);
    console.log('jsonData.department = ' + jsonData.department);

    userdb.users.save({username: jsonData.username, password: jsonData.password,department: jsonData.department}, function(err, saved) {
        if( err || !saved ){
            var msg ="User not saved";
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "User saved.";
            console.log(msg);
            res.end(msg);
        }
    });
});

app.listen(8080, function () {
  console.log('server started,  http://localhost:8080');
});



