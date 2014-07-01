var express = require('express');
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var secret = 'this is the secret secret secret 12356';

var databaseUrl = "jlog"; // "username:password@example.com/mydb"
var userCollections = ["users"];
var logCollections = ["logs"];
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
    userdb.users.find({userName:req.body.userName,password:req.body.password}, function(err, users) {
        if( err || !users || users.length==0){
            res.send(401, 'Wrong user or password');
            console.log("authenticate: wrong user or password!");
        }else {
            var user = users[0];
            var profile = {
                userId:user._id
            };
            var loginUser = {
                userId: user._id,
                userName: user.userName,
                department: user.department,
                bosses:user.bosses,
                followers:user.followers,
                tobeBosses:user.tobeBosses,
                tobeFollowers:user.tobeFollowers
            };
            console.log("authenticate: succeeded!");
            var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });
            res.json({token: token,loginUser:loginUser });
        }
   });
});

app.get('/api/restricted', function (req, res) {
  console.log('user ' + req.user.userId + ' is calling /api/restricted');
  res.json({
    name: req.user.userId
  });
});

app.get('/logs', function (req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");

    userdb.users.findOne({'_id':req.param('creatorid')},function(err,user){
            if(err || !user){
                console.log('get logs error! could NOT find followers!');
                res.end("[]");
            }else{
                var ids = user.followers.split(',');
                ids.splice(0,0,req.param('creatorid'));

                logdb.logs.find({'creator.id':{$in:ids}}).sort({datetime:-1}, function(err, logs) {
                    console.log(ids);

                    if( err || !logs){
                        console.log("get logs error! could NOT find logs!");
                        console.log(err);
                        res.end("[]");
                    } else {
                        console.log("there are "+ logs.length +" logs Found!");
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        var str='[';
                        if(logs.length>0){
                            logs.forEach( function(log) {
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
                                for(var i=0; i<log.comments.length; i++){
                                    var comment = log.comments[i];
                                    str += '{';
                                    str += '"message":"' + comment.message + '",';
                                    str += '"datetime":"' + comment.datetime + '",';
                                    str += '"creator":{';
                                    str += '"id":"' + comment.creator.id + '",';
                                    str += '"name":"' + comment.creator.name + '",';
                                    str += '"department":"' + comment.creator.department + '"';
                                    str += '}},';
                                }
                                if(log.comments.length>0){
                                    str = str.trim();
                                    str = str.substring(0,str.length-1);
                                }
                                str += ']';
                                str += '},';
                                str += '\n';
                            });
                            str = str.trim();
                            str = str.substring(0,str.length-1);
                        }
                        str = str + ']';
                        console.log("get logs successed!")
                        res.end(str);
                    }
                });

            }
    });
});

app.post('/log', function (req, res){
    //console.log("POST log!");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log('req.body = '+req.body);
    //console.log('req.body.mydata = ' + req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    //console.log('jsonData.id = ' + jsonData.id);
    //console.log('jsonData.message = ' + jsonData.message);
    //console.log('jsonData.creator = ' + jsonData.creator);
    //console.log('jsonData.comments = ' + jsonData.comments);
    var d = new Date();

    for(var i=0; i<jsonData.comments.length; i++){
        var comment = jsonData.comments[i];
        if(comment.message == jsonData.comment){
            comment.datetime = d.getTime();  //以服务端的日期为准
        }
    }

    logdb.logs.save({_id:jsonData.id,message:jsonData.message, creator: jsonData.creator,datetime:d.getTime(),comments:jsonData.comments}, function(err, saved) {
        if( err || !saved ){
            var msg ="log not saved";
            console.log(msg);
            res.end(msg);
        }else{
            var msg = "log with comments saved.";
            console.log(msg);
            res.end(msg);
        }
    });
});

app.get('/users', function (req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    console.log("find user by userName:" + req.param('userName'));
    //var regexp = "{$regex:'" + req.param("username") + "'}";
    //console.log(regexp);
    console.log('loginUserId = ' + req.param('loginUserId'));
    userdb.users.find({userName:{$regex:req.param("userName")}}, function(err, users) {
        if( err || !users){
            console.log("No users found");
        }else{
            //console.log('find ' + users.length + ' users.');
            res.writeHead(200, {'Content-Type': 'application/json'});
            var str='[';
            users.forEach( function(user) {
                str += '{';
                str += '"userId":"'         + user._id                                                                    + '"'       + ',';
                str += '"userName":"'       + user.userName                                                              + '"'       + ',';
                str += '"password":"'       + user.password                                                               + '"'       + ',';
                str += '"department":"'     + user.department                                                           + '"'       +  ',';
                str += '"bosses":"'          + user.bosses                                                               + '"'      + ',';
                str += '"followers":"'      + user.followers                                                            + '"'      + ',';
                str += '"tobeBosses":"'     + user.tobeBosses                                                           + '"'      + ',';
                str += '"tobeFollowers":"'  + user.tobeFollowers                                                       + '"'      + ',';
                str += '"isMyBoss":'       + (user.followers.indexOf(req.param('loginUserId'))==-1 ? false : true)      + ''      + ',';
                str += '"isMyFollower":'   + (user.bosses.indexOf(req.param('loginUserId'))==-1 ? false : true)         + ''      + ',';
                str += '"tobeMyBoss":'     + (user.tobeBosses.indexOf(req.param('loginUserId'))==-1 ? false : true)   + ''      + ',';
                str += '"tobeMyFollower":'     + (user.tobeFollowers.indexOf(req.param('loginUserId'))==-1 ? false : true)   + ''      + ',';
                str += '"isMyself":'       + (user._id==req.param('loginUserId') ?  true : false)                      + ''      + '';
                str += '},' +'\n';
            });
            str = str.trim();
            str = str.substring(0,str.length-1);
            str = str + ']';
            //console.log(str);
            //console.log("get users successed!")
            res.end( str);
        }
    });
});

app.get('/user', function (req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    console.log("userId: " + req.param("userId"))
    userdb.users.find({_id:req.param("userId")}, function(err, users) {
        if( err || !users) console.log("No users found");
        else
        {
            console.log("found " + users.length + " users.");
            res.writeHead(200, {'Content-Type': 'application/json'});
            var str='';
            users.forEach( function(user) {
                str += '{';
                str += '"userId":"'         + user._id              + '"'              + ',';
                str += '"userName":"'       + user.userName         + '"'        + ',';
                str += '"password":"'       + user.password         + '"'          + ',';
                str += '"department":"'     + user.department     + '"'          +  ',';
                str += '"bosses":"'         + user.bosses           + '"'           + ',';
                str += '"followers":"'      + user.followers        + '"'       + ',';
                str += '"tobeBosses":"'     + user.tobeBosses       + '"'      + '';
                str += '"tobeFollowers":"'     + user.tobeFollowers       + '"'      + '';
                str += '},' +'\n';
            });
            str = str.trim();
            str = str.substring(0,str.length-1);
            console.log("get user successed!")
            console.log(str);
            res.end( str);
        }
    });
});

app.post('/user', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log('req.body = '+req.body);
    //console.log('req.body.mydata = ' + req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    console.log('jsonData.userId = ' + jsonData.userId);
    console.log('jsonData.userName = ' + jsonData.userName);
    console.log('jsonData.password = ' + jsonData.password);
    console.log('jsonData.department = ' + jsonData.department);
    console.log('jsonData.bosses = ' + jsonData.bosses);
    console.log('jsonData.followers = ' + jsonData.followers);
    console.log('jsonData.tobeBosses = ' + jsonData.tobeBosses);
    console.log('jsonData.tobeFollowers = ' + jsonData.tobeFollowers);

    userdb.users.save(
            {
                _id:jsonData.userId,
                userName: jsonData.userName,
                password: jsonData.password,
                department: jsonData.department,
                bosses:"",
                followers:"",
                tobeBosses:"",
                tobeFollowers:""
            }, function(err, saved) {
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

app.post('/user/bosses', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log('req.body = '+req.body);
    //console.log('req.body.mydata = ' + req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    console.log("save user's bosses......");
    console.log('jsonData.userId = ' + jsonData.userId);
    console.log('jsonData.bosses = ' + jsonData.bosses);

    userdb.users.findAndModify({
        query: { _id: jsonData.userId },
        update: { $set: { bosses:jsonData.bosses } },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="User' bosses not saved";
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "User's bosses saved.";
            console.log(msg);
            res.end(msg);
        }
    });
});

app.post('/user/tobebosses', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log('req.body = '+req.body);
    //console.log('req.body.mydata = ' + req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    console.log("save user's tobeBosses......");
    console.log('jsonData.userId = ' + jsonData.userId);
    console.log('jsonData.tobeBosses = ' + jsonData.tobeBosses);

    userdb.users.findAndModify({
        query: { _id: jsonData.userId },
        update: { $set: { tobeBosses:jsonData.tobeBosses } },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="User' tobeBosses not saved";
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "User's tobeBosses saved.";
            console.log(msg);
            res.end(msg);
        }
    });
});

app.post('/user/followers', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log('req.body = '+req.body);
    //console.log('req.body.mydata = ' + req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    console.log("save user's followers......");
    console.log('jsonData.userId = ' + jsonData.userId);
    console.log('jsonData.followers = ' + jsonData.followers);

    userdb.users.findAndModify({
        query: { _id: jsonData.userId },
        update: { $set: { followers:jsonData.followers } },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="User' followers not saved";
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "User's followers saved.";
            console.log(msg);
            res.end(msg);
        }
    });
});

app.post('/user/tobefollowers', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log('req.body = '+req.body);
    //console.log('req.body.mydata = ' + req.body.mydata);
    var jsonData = JSON.parse(req.body.mydata);
    console.log("save user's tobeFollowers......");
    console.log('jsonData.userId = ' + jsonData.userId);
    console.log('jsonData.tobeFollowers = ' + jsonData.tobeFollowers);

    userdb.users.findAndModify({
        query: { _id: jsonData.userId },
        update: { $set: { tobeFollowers:jsonData.tobeFollowers } },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="User' tobeFollowers not saved";
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "User's tobeFollowers saved.";
            console.log(msg);
            res.end(msg);
        }
    });
});

app.listen(8080, function () {
  console.log('server started,  http://localhost:8080');
});




