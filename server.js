var express = require('express');
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var secret = 'this is the secret secret secret 12356';

var databaseUrl = "jlog"; // "username:password@example.com/mydb"
var userCollections = ["users"];
var logCollections = ["logs"];
var userdb = require("mongojs").connect(databaseUrl, userCollections);
var logdb = require("mongojs").connect(databaseUrl, logCollections);

var Promise = require('es6-promise').Promise;

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

app.get('/logs/own', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getLogs0(creatorIds,res);
});

app.get('/logs/one', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getLogs1(creatorIds,res,getLogsCallback);
});

app.get('/logs/two', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getLogs2(creatorIds,res,getLogs1Callback,getLogsCallback);
});

app.get('/logs/three', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getLogs3(creatorIds,res,getLogs2Callback,getLogs1Callback,getLogsCallback);
});

app.get('/logs/four', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getLogs4(creatorIds,res,getLogs3Callback,getLogs2Callback,getLogs1Callback,getLogsCallback);
});

app.post('/log', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jsonData = JSON.parse(req.body.mydata);
    var d = new Date();

    logdb.logs.save({_id:jsonData.id,message:jsonData.message, creator: jsonData.creator,datetime:d.getTime(),comments:[]}, function(err, saved) {
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

app.post('/comment', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var logId = jdata.logId;
    var d = new Date()

    var comment = new Object();
    comment.message = jdata.message;
    comment.datetime = d.getTime();
    comment.creator = jdata.creator;


    logdb.logs.findAndModify({
        query: { _id: logId },
        update: {
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="comment not added";
            console.log(msg);
            res.end(msg);
        }else{
            var msg = "comment added.";
            //console.log(msg);
            res.end(msg);
        }
    });



});

app.get('/user', function (req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.writeHead(200, {'Content-Type': 'application/json'});
    console.log("userId: " + req.param("userId"))
    userdb.users.findOne({_id:req.param("userId")}, function(err, user) {
        if( err || !user){
            console.log("No users found");
            res.end('{}');
        }else{
            console.log("found " + users.length + " users.");
            var str='{';
            str += '"userId":"'         + user._id              + '"'              + ',';
            str += '"userName":"'       + user.userName         + '"'        + ',';
            str += '"password":"'       + user.password         + '"'          + ',';
            str += '"department":"'     + user.department     + '"'          +  '';
            str += '}';
            console.log("get user successed!")
            //console.log(str);
            res.end( str);
        }
    });
});

app.get('/users', function (req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.writeHead(200, {'Content-Type': 'application/json'});
    userdb.users.find({userName:{$regex:req.param("userName")}}, function(err, users) {
        if( err || !users){
            console.log("No users found");
            res.end( "[]");
        }else{
            var str='[';
            if(users.length>0){
                users.forEach( function(user) {
                    str += '{';
                    str += '"userId":"'         + user._id                                                                    + '"'       + ',';
                    str += '"userName":"'       + user.userName                                                              + '"'       + ',';
                    str += '"password":"'       + user.password                                                               + '"'       + ',';
                    str += '"department":"'     + user.department                                                           + '"'       +  '';
                    str += '},' +'\n';
                });
                str = str.trim();
                str = str.substring(0,str.length-1);
            }
            str = str + ']';
            res.end( str);
        }
    });
});

app.get('/users/follower', function (req, res) {
    getFollowers(req,res,getFollowersCallback);
});

app.get('/users/tobefollower', function (req, res) {
    getTobeFollowers(req,res,getTobeFollowersCallback);
});

app.get('/users/boss', function (req, res) {
    //console.log(req.param("userId"));
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.writeHead(200, {'Content-Type': 'application/json'});
    userdb.users.find({followers:[req.param("userId")]}, function(err, users) {
        if( err || !users){
            console.log("No users found");
            res.end( "[]");
        }else{
            var str='[';
            if(users.length>0){
                users.forEach( function(user) {
                    str += '{';
                    str += '"userId":"'         + user._id                                                                    + '"'       + ',';
                    str += '"userName":"'       + user.userName                                                              + '"'       + ',';
                    str += '"password":"'       + user.password                                                               + '"'       + ',';
                    str += '"department":"'     + user.department                                                           + '"'       +  ',';
                    str += '"isMyFollower":"'       + false     + '"'       +  ',';
                    str += '"tobeMyFollower":"'     + false    + '"'       +  ',';
                    str += '"isMyBoss":"'            + true    + '"'       +  ',';
                    str += '"tobeMyBoss":"'          + false    + '"'       +  '';
                    str += '},' +'\n';
                });
                str = str.trim();
                str = str.substring(0,str.length-1);
            }
            str = str + ']';
            res.end( str);
        }
    });
});

app.get('/users/tobeboss', function (req, res) {
    //console.log(req.param("userId"));
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.writeHead(200, {'Content-Type': 'application/json'});
    userdb.users.find({tobeFollowers:[req.param("userId")]}, function(err, users) {
        if( err || !users){
            console.log("No users found");
            res.end( "[]");
        }else{
            var str='[';
            if(users.length>0){
                users.forEach( function(user) {
                    str += '{';
                    str += '"userId":"'         + user._id                                                                    + '"'       + ',';
                    str += '"userName":"'       + user.userName                                                              + '"'       + ',';
                    str += '"password":"'       + user.password                                                               + '"'       + ',';
                    str += '"department":"'     + user.department                                                           + '"'       +  ',';
                    str += '"isMyFollower":"'       + false     + '"'       +  ',';
                    str += '"tobeMyFollower":"'     + false    + '"'       +  ',';
                    str += '"isMyBoss":"'            + false    + '"'       +  ',';
                    str += '"tobeMyBoss":"'          + true    + '"'       +  '';
                    str += '},' +'\n';
                });
                str = str.trim();
                str = str.substring(0,str.length-1);
            }
            str = str + ']';
            res.end( str);
        }
    });
});

app.get('/users/unrelated',function(req,res){
    getUnrelated(req,res,getUnrelatedCallback1,getUnrelatedCallback2,getUnrelatedCallback3);
});

app.post('/user', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jsonData = JSON.parse(req.body.mydata);
    userdb.users.save(
            {
                _id:jsonData.userId,
                userName: jsonData.userName,
                password: jsonData.password,
                department: jsonData.department,
                followers:[],
                tobeFollowers:[]
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

app.post('/user/tobefollower', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jsonData = JSON.parse(req.body.mydata);
    userdb.users.findAndModify({
        query: { _id: jsonData.userId },
        update: { $addToSet: { tobeFollowers:jsonData.followerId } },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="tobefollower not added";
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "tobefollower added.";
            //console.log(msg);
            res.end(msg);
        }
    });
});

app.post('/user/befollower', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jsonData = JSON.parse(req.body.mydata);
    userdb.users.findAndModify({
        query: { _id: jsonData.userId },
        update: {
                    $addToSet: { followers:jsonData.followerId },
                    $pull: { tobeFollowers:jsonData.followerId }
                },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="follower not added";
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "follower added.";
            //console.log(msg);
            res.end(msg);
        }
    });
});

app.post('/user/notfollower', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jsonData = JSON.parse(req.body.mydata);
    //console.log("userId:" + jsonData.userId + ", followerId:" + jsonData.followerId)
    userdb.users.findAndModify({
        query: { _id: jsonData.userId },
        update: { $pull: { tobeFollowers:jsonData.followerId,followers:jsonData.followerId }},
        new: true
    }, function(err, doc, lastErrorObject,followerId) {
        if( err ){
            var msg = " follower or tobeFollower has NOT deleted.";
            res.end(msg);
            console.log(msg);
            console.log(err);
        }else{
            var msg = " follower or tobeFollower has deleted.";
            console.log(msg);
            res.end(msg);
        }
    });
});

app.listen(8080, function () {
  console.log('server started,  http://localhost:8080');
});

function getUnrelated(req,res,callback1,callback2,callback3){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.writeHead(200, {'Content-Type': 'application/json'});
    var userId = req.param('userId');
    userdb.users.findOne({_id:userId}, function(err, user) {
        if( err || !user){
            //console.log("could not find user by id: " + userId);
            res.end('[]');
        }else{
            //console.log("found a user by id: " + userId);
            callback1(user.followers.concat(user.tobeFollowers),userId,res,callback2,callback3);
        }
    });
}

function getUnrelatedCallback1(relatedIds,userId,res,callback2,callback3){
    userdb.users.find({followers:[userId]}, function(err, users) {
        if( err || !users){
        }else{
            if(users.length>0){
                users.forEach( function(user) {
                    relatedIds.push(user._id);
                });
            }
        }
        callback2(relatedIds,userId,res,callback3);
    });
}

function getUnrelatedCallback2(relatedIds,userId,res,callback3){
    userdb.users.find({tobefollowers:[userId]}, function(err, users) {
        if( err || !users){
        }else{
            if(users.length>0){
                users.forEach( function(user) {
                    relatedIds.push(user._id);
                });
            }
        }
        relatedIds.push(userId);
        callback3(relatedIds,res);
    });
}

function getUnrelatedCallback3(relatedIds,res) {
    userdb.users.find({_id:{$nin:relatedIds}}, function(err, users) {
        if( err || !users){
            //console.log("the user has no followers");
            res.end('[]');
        }else{
            //console.log("the user has " + users.length + " followers");
            var str='[';
            if(users.length>0){
                users.forEach( function(user) {
                    str += '{';
                    str += '"userId":"'         + user._id           + '"'       + ',';
                    str += '"userName":"'       + user.userName      + '"'       + ',';
                    str += '"password":"'       + user.password      + '"'       + ',';
                    str += '"department":"'     + user.department    + '"'       +  '';
                    str += '},' +'\n';
                });
                str = str.trim();
                str = str.substring(0,str.length-1);
            }
            str = str + ']';
            //console.log(str);
            res.end(str);
        }
    });
}

function getFollowers(req,res,callback){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.writeHead(200, {'Content-Type': 'application/json'});
    var userId = req.param('userId');
    userdb.users.findOne({_id:userId}, function(err, user) {
        if( err || !user){
            //console.log("could not find user.followers by id: " + userId);
            res.end('[]');
        }else{
            //console.log("found user.followers by id: " + userId);
            callback(user.followers,res);
        }
    });
}

function getTobeFollowers(req,res,callback){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.writeHead(200, {'Content-Type': 'application/json'});
    var userId = req.param('userId');
    userdb.users.findOne({_id:userId}, function(err, user) {
        if( err || !user){
            //console.log("could not find user by id: " + userId);
            res.end('[]');
        }else{
            //console.log("found a user by id: " + userId);
            callback(user.tobeFollowers,res);
        }
    });
}

function getFollowersCallback(userIds,res) {
    userdb.users.find({_id:{$in:userIds}}, function(err, users) {
        if( err || !users){
            //console.log("the user has no followers");
            res.end('[]');
        }else{
            //console.log("the user has " + users.length + " followers");
            var str='[';
            if(users.length>0){
                users.forEach( function(user) {
                    str += '{';
                    str += '"userId":"'         + user._id           + '"'       + ',';
                    str += '"userName":"'       + user.userName      + '"'       + ',';
                    str += '"password":"'       + user.password      + '"'       + ',';
                    str += '"department":"'     + user.department    + '"'       +  ',';
                    str += '"isMyFollower":"'       + true     + '"'       +  ',';
                    str += '"tobeMyFollower":"'     + false    + '"'       +  ',';
                    str += '"isMyBoss":"'            + false    + '"'       +  ',';
                    str += '"tobeMyBoss":"'          + false    + '"'       +  '';
                    str += '},' +'\n';
                });
                str = str.trim();
                str = str.substring(0,str.length-1);
            }
            str = str + ']';
            //console.log(str);
            res.end(str);
        }
    });
}

function getTobeFollowersCallback(userIds,res) {
    userdb.users.find({_id:{$in:userIds}}, function(err, users) {
        if( err || !users){
            //console.log("the user has no followers");
            res.end('[]');
        }else{
            //console.log("the user has " + users.length + " followers");
            var str='[';
            if(users.length>0){
                users.forEach( function(user) {
                    str += '{';
                    str += '"userId":"'         + user._id           + '"'       + ',';
                    str += '"userName":"'       + user.userName      + '"'       + ',';
                    str += '"password":"'       + user.password      + '"'       + ',';
                    str += '"department":"'     + user.department    + '"'       +  ',';
                    str += '"isMyFollower":"'       + false     + '"'       +  ',';
                    str += '"tobeMyFollower":"'     + true    + '"'       +  ',';
                    str += '"isMyBoss":"'            + false    + '"'       +  ',';
                    str += '"tobeMyBoss":"'          + false    + '"'       +  '';
                    str += '},' +'\n';
                });
                str = str.trim();
                str = str.substring(0,str.length-1);
            }
            str = str + ']';
            //console.log(str);
            res.end(str);
        }
    });
}

function getLogsCallback(creatorIds,res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.writeHead(200, {'Content-Type': 'application/json'});

    logdb.logs.find({'creator.id':{$in:creatorIds}}).sort({datetime:-1}, function(err, logs) {
        console.log('ids: ' + creatorIds);

        if( err || !logs){
            console.log("get logs error! could NOT find logs!");
            console.log(err);
            res.end("[]");
        } else {
            //console.log("there are "+ logs.length +" logs Found!");
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
            //console.log("get logs successed!")
            res.end(str);
        }
    });
}

function getLogs0(creatorIds,res){
    var ids = creatorIds;
    getLogsCallback(ids,res);
}

function getLogs1(creatorIds,res,callback1){
    userdb.users.find({'_id':{$in:creatorIds}},function(err,users){
        var ids = creatorIds;
        if(err || !users){
            console.log(err);
        }else{
            users.forEach(function(user){
                ids = ids.concat(user.followers);
            });
        }
        ids = ids.distinct();
        callback1(ids,res);
    });
}

function getLogs2(creatorIds,res,callback1,callback2){
    userdb.users.find({'_id':{$in:creatorIds}},function(err,users){
        var ids = creatorIds;
        if(err || !users){
            console.log(err);
        }else{
            users.forEach(function(user){
                ids = ids.concat(user.followers);
            });
        }
        ids = ids.distinct();
        callback1(ids,res,callback2);
    });
}

function getLogs3(creatorIds,res,callback1,callback2,callback3){
    userdb.users.find({'_id':{$in:creatorIds}},function(err,users){
        var ids = creatorIds;
        if(err || !users){
            console.log(err);
        }else{
            users.forEach(function(user){
                ids = ids.concat(user.followers);
            });
        }
        ids = ids.distinct();
        callback1(ids,res,callback2,callback3);
    });
}

function getLogs4(creatorIds,res,callback1,callback2,callback3,callback4){
    userdb.users.find({'_id':{$in:creatorIds}},function(err,users){
        var ids = creatorIds;
        if(err || !users){
            console.log(err);
        }else{
            users.forEach(function(user){
                ids = ids.concat(user.followers);
            });
        }
        ids = ids.distinct();
        callback1(ids,res,callback2,callback3,callback4);
    });
}

function getLogs1Callback(creatorIds,res,callback){
    userdb.users.find({'_id':{$in:creatorIds}},function(err,users){
        var ids = creatorIds;
        if(err || !users){
            console.log('get logs error! could NOT find followers!');
        }else{
            users.forEach(function(user){
                ids = ids.concat(user.followers);
            });
        }
        ids = ids.distinct();
        callback(ids,res);
    });
}

function getLogs2Callback(creatorIds,res,callback1,callback2){
    userdb.users.find({'_id':{$in:creatorIds}},function(err,users){
        var ids = creatorIds;
        if(err || !users){
            console.log('get logs error! could NOT find followers!');
        }else{
            users.forEach(function(user){
                ids = ids.concat(user.followers);
            });
        }
        ids = ids.distinct();
        callback1(ids,res,callback2);
    });
}

function getLogs3Callback(creatorIds,res,callback1,callback2,callback3){
    userdb.users.find({'_id':{$in:creatorIds}},function(err,users){
        var ids = creatorIds;
        if(err || !users){
            console.log('get logs error! could NOT find followers!');
        }else{
            users.forEach(function(user){
                ids = ids.concat(user.followers);
            });
        }
        ids = ids.distinct();
        callback1(ids,res,callback2,callback3);
    });
}

function getLogs4Callback(creatorIds,res,callback1,callback2,callback3,callback4){
    userdb.users.find({'_id':{$in:creatorIds}},function(err,users){
        var ids = creatorIds;
        if(err || !users){
            console.log('get logs error! could NOT find followers!');
        }else{
            users.forEach(function(user){
                ids = ids.concat(user.followers);
            });
        }
        ids = ids.distinct();
        callback1(ids,res,callback2,callback3,callback4);
    });
}

Array.prototype.distinct=function(){
    var sameObj=function(a,b){
        var tag = true;
        if(!a||!b)return false;
        for(var x in a){
            if(!b[x])
                return false;
            if(typeof(a[x])==='object'){
                tag=sameObj(a[x],b[x]);
            }else{
                if(a[x]!==b[x])
                    return false;
            }
        }
        return tag;
    }
    var newArr=[],obj={};
    for(var i=0,len=this.length;i<len;i++){
        if(!sameObj(obj[typeof(this[i])+this[i]],this[i])){
            newArr.push(this[i]);
            obj[typeof(this[i])+this[i]]=this[i];
        }
    }
    return newArr;
}

//----------------- promise test ---
app.get('/logs/promise', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getLogCreatorIds(creatorIds,0)
        .then(function(creatorIds){return getLogCreatorIds(creatorIds,1)})
        .then(function(creatorIds){return getLogCreatorIds(creatorIds,2)})
        ;
});

var getLogCreatorIds = function(creatorIds,level){
    return new Promise(function(resolve){
        console.log(level + ':' + creatorIds);
        userdb.users.find({'_id':{$in:creatorIds}},function(err,users){
            if(err || !users){
                console.log(err);
            }else{
                users.forEach(function(user){
                    creatorIds = creatorIds.concat(user.followers);
                });
            }
            creatorIds = creatorIds.distinct();
            resolve(creatorIds);
        });
    });
}

//------------ 下面是无用的---------
var getLogs = function(ids){
    return new Promise(function(resolve, reject){
        getCreatorIds(ids,{
            success:function() {
                console.log("0:" + ids);
                resolve(ids);
            },
            error: function() {
                reject();
            }
        });
    });
};

var getCreatorIds = function(ids,obj){
    //var creatorIds=['2129957A788518AA7842048A'];
    var creatorIds = ids;
    userdb.users.find({'_id':{$in:creatorIds}},function(err,users){
        if(err || !users){
            console.log(err);
            obj.error();
        }else{
            users.forEach(function(user){
                creatorIds = creatorIds.concat(user.followers);
            });
        }
        creatorIds = creatorIds.distinct();
        console.log("1:" + creatorIds);
        obj.success();
    });
}


var getLogsAndResponse = function(creatorIds,res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.writeHead(200, {'Content-Type': 'application/json'});

    logdb.logs.find({'creator.id':{$in:creatorIds}}).sort({datetime:-1}, function(err, logs) {
        console.log('ids: ' + creatorIds);

        if( err || !logs){
            console.log("get logs error! could NOT find logs!");
            console.log(err);
            res.end("[]");
        } else {
            //console.log("there are "+ logs.length +" logs Found!");
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
            //console.log("get logs successed!")
            res.end(str);
        }
    });
}

