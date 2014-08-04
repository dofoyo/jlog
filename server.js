var express = require('express');

// ------- for authenticate
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var secret = 'this is the secret secret secret 12356';

//--------- for mongodb
var databaseUrl = "jlog"; // "username:password@example.com/mydb"
var userCollections = ["users"];
var logCollections = ["logs"];
var processCollections = ["processes"];
var userdb = require("mongojs").connect(databaseUrl, userCollections);
var logdb = require("mongojs").connect(databaseUrl, logCollections);
var processdb = require("mongojs").connect(databaseUrl, processCollections);


//------- for fileupload
var formidable = require('formidable');
var util = require('util');
var fs=require('fs');

var Promise = require('es6-promise').Promise;

//var pinyin = require("pinyin");

var app = express();

// We are going to protect /api routes with JWT
app.use('/api', expressJwt({secret: secret}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

// 开发调试可用(1)，可以看e2e测试结果。正式运行可用（2）
var working_path =  '';     // (1)
//var working_path =  'app/';  //  (2)
app.use('/', express.static(__dirname + '/' + working_path));

app.use(function(err, req, res, next){
  if (err.constructor.name === 'UnauthorizedError') {
    res.send(401, 'Unauthorized');
  }
});

//---- for fileupload---------
var upload_path = working_path + "uploads/";
app.post('/upload',function(req,res){
    var form = new formidable.IncomingForm();
    form.uploadDir = upload_path + "tmp";

    form.parse(req, function(err, fields, files) {
        //console.log(util.inspect({files: files}));
        if(err){
            console.log(err);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end('parse upload error!');
        }else{
            var d = new Date();
            var t = d.getTime().toString();
            var filename = files.file.name;
            var old_path = files.file.path;
            var new_path = upload_path + t;
            fs.mkdir(new_path,function(err){
                if(err){
                    console.log(err);
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end('{}');
                }else{
                    new_path += '/' + filename;
                    //console.info('filename:' + filename);
                    //console.info('old_path:' + old_path);
                    //console.info('new_path:' + new_path);
                    fs.rename(old_path,new_path,function(err){
                        if(err){
                            console.log(err);
                            res.writeHead(500, {'Content-Type': 'application/json'});
                            res.end('{}');
                        }else{
                            //console.log('fs.rename complete');
                            var str = "{";
                            str += '"filename":' + '"' + filename + '"';
                            str += ',"url":' + '"' + new_path + '"';
                            str += "}";
                            //console.log(str);
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.end(str);
                        }
                    })

                }
            });
        }
    });
});

// ---------for  authenticate begin--------
app.post('/authenticate', function (req, res) {
    userdb.users.find({userName:req.body.userName,password:req.body.password}, function(err, users) {
        if( err || !users || users.length==0){
            res.send(401, 'Wrong user or password');
            //console.log("authenticate: wrong user or password!");
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
            //console.log("authenticate: succeeded!");
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
// ---------for  authenticate begin--------

//--- for process begin -------

app.post('/process-no', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var processId = jdata.processId;
    var close_Date_time = jdata.closeDatetime;
    var createDatetime = jdata.createDatetime;
    var datetime = (new Date()).getTime().toString();

    var comment = new Object();
    comment.id = jdata.id;
    comment.type = jdata.type;
    comment.message = jdata.message;
    comment.createDatetime = createDatetime;
    comment.completeDatetime = datetime;
    comment.creator = jdata.creator;

    processdb.processes.findAndModify({
        query: { _id: processId },
        update: {
            $set:{closeDatetime:close_Date_time},
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="process_no not added";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "process_no added.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});


app.post('/process-yes', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var processId = jdata.processId;
    var close_Date_time = jdata.closeDatetime;
    var createDatetime = jdata.createDatetime;
    var executerId = jdata.executerId;
    var datetime = (new Date()).getTime().toString();

    var comment = new Object();
    comment.id = jdata.id;
    comment.type = jdata.type;
    comment.message = jdata.message;
    comment.createDatetime = createDatetime;
    comment.completeDatetime = datetime;
    comment.creator = jdata.creator;

    processdb.processes.findAndModify({
        query: { _id: processId },
        update: {
            $set:{closeDatetime:close_Date_time},
            $pull: { executers:{id:executerId}},
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="process yes not added";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "process yes added.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.post('/process-stop', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var processId = jdata.processId;
    var datetime = (new Date()).getTime().toString();

    var comment = new Object();
    comment.id = jdata.id;
    comment.type = jdata.type;
    comment.message = jdata.message;
    comment.createDatetime = datetime;
    comment.completeDatetime = datetime;
    comment.creator = jdata.creator;

    processdb.processes.findAndModify({
        query: { _id: processId },
        update: {
            $set: {stopDatetime: datetime},
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="process stop not success.";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "process stopped.";
            console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.post('/process-restart', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var processId = jdata.processId;
    var datetime = (new Date()).getTime().toString();

    var comment = new Object();
    comment.id = jdata.id;
    comment.type = jdata.type;
    comment.message = jdata.message;
    comment.createDatetime = datetime;
    comment.completeDatetime = datetime;
    comment.creator = jdata.creator;

    processdb.processes.findAndModify({
        query: { _id: processId },
        update: {
            $set: {stopDatetime: '', closeDatetime:''},
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="process restart not success.";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "process restarted.";
            console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.post('/process-adviser', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var processId = jdata.processId;
    var d = new Date()

    if(jdata.add){
        var adviser = new Object();
        adviser.id = jdata.id;
        adviser.userId = jdata.userId;
        adviser.userName = jdata.userName;
        adviser.department = jdata.department;
        adviser.createDatetime = d.getTime().toString();
        processdb.processes.findAndModify({
            query: { _id: processId },
            update: {
                $addToSet: { advisers:adviser }
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if( err ){
                var msg ="process adviser not added";
                console.log(msg);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
            }else{
                var msg = "process adviser added.";
                console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
    }else{
        processdb.processes.findAndModify({
            query: { _id: processId },
            update: {
                $pull: { advisers:{id:jdata.id}}
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if( err ){
                var msg ="process adviser " + jdata.id + "," + jdata.createDatetime + " not deleted";
                console.log(msg);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
            }else{
                //console.log(doc);
                var msg = "process adviser " + jdata.id + "," + jdata.createDatetime  + " deleted.";
                console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
    }
});

app.post('/process-executer', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var processId = jdata.processId;
    var d = new Date()

    if(jdata.add){
        var executer = new Object();
        executer.id = jdata.id;
        executer.userId = jdata.userId;
        executer.userName = jdata.userName;
        executer.department = jdata.department;
        executer.createDatetime = d.getTime().toString();
        executer.completeDatetime = '';
        processdb.processes.findAndModify({
            query: { _id: processId },
            update: {
                $addToSet: { executers:executer }
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if( err ){
                var msg ="process executer not added";
                console.log(msg);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
            }else{
                var msg = "process executer added.";
                console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
    }else{
        processdb.processes.findAndModify({
            query: { _id: processId },
            update: {
                $pull: { executers:{id:jdata.id}}
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if( err ){
                var msg ="process executer " + jdata.id + "," + jdata.createDatetime + " not deleted";
                console.log(msg);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
            }else{
                //console.log(doc);
                var msg = "process executer " + jdata.id + "," + jdata.createDatetime  + " deleted.";
                console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
    }
});

app.post('/process-comment', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var processId = jdata.processId;
    var d = new Date()

    var comment = new Object();
    comment.id = jdata.id;
    comment.type = jdata.type;
    comment.message = jdata.message;
    comment.createDatetime = d.getTime().toString();
    comment.completeDatetime = d.getTime().toString();
    comment.creator = jdata.creator;

    processdb.processes.findAndModify({
        query: { _id: processId },
        update: {
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="process comment not added";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "process comment added.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.post('/process', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jsonData = JSON.parse(req.body.mydata);
    var d = new Date();

    processdb.processes.save({
        _id:jsonData.id,
        subject:jsonData.subject,
        description:jsonData.description,
        creator: jsonData.creator,
        createDatetime:d.getTime().toString(),
        closeDatetime:'',
        stopDatetime:'',
        comments:[],
        readers:[],
        advisers:[],
        executers:[]
        }, function(err, saved) {
        if( err || !saved ){
            var msg ="process not saved";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "process saved.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.get('/processes',function(req,res){
    console.log("/processes");
    getProcesses(req,res);
});

var getProcesses = function(req,res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log(req.param('userName'));
    //console.log(req.param('keyWord'));
    var keyWord = req.param('keyWord');
    var offset = req.param('offset') ? 1*req.param('offset') : 0;
    var limit = req.param('limit') ? 1*req.param('limit') : 20;
    processdb.processes.
        find({'subject':{$regex:keyWord}}).
        skip(offset).
        limit(limit).
        sort({createDatetime:-1},
        function(err, processes) {
            if( err || !processes){
                console.log("get processed error! could NOT find processes!");
                console.log(err);
                res.writeHead(500, {'Content-Type': 'application/text'});
                res.end("[]");
            } else {
                console.log("there are "+ processes.length +" processes Found!");
                var str='[';
                if(processes.length>0){
                    processes.forEach( function(process) {
                        str += '{';
                        str += '"id":"' + process._id + '",';
                        str += '"subject":"' + process.subject + '",';
                        str += '"description":"' + process.description + '",';
                        str += '"createDatetime":"' + process.createDatetime + '",';
                        str += '"closeDatetime":"' + process.closeDatetime + '",';
                        str += '"stopDatetime":"' + process.stopDatetime + '",';
                        str += '"creator":{';
                        str += '"id":"' + process.creator.id + '",';
                        str += '"name":"' + process.creator.name + '",';
                        str += '"department":"' + process.creator.department + '"';
                        str += '},';
                        str += '"comments":[';
                            for(var i=process.comments.length-1; i>-1; i--){
                                var comment = process.comments[i];
                                str += '{';
                                str += '"id":"' + comment.id + '",';
                                str += '"type":"' + comment.type + '",';
                                str += '"message":"' + comment.message + '",';
                                str += '"createDatetime":"' + comment.createDatetime + '",';
                                str += '"completeDatetime":"' + comment.completeDatetime + '",';
                                str += '"creator":{';
                                str += '"id":"' + comment.creator.id + '",';
                                str += '"name":"' + comment.creator.name + '",';
                                str += '"department":"' + comment.creator.department + '"';
                                str += '}},';
                            }
                            if(process.comments.length>0){
                                str = str.trim();
                                str = str.substring(0,str.length-1);
                            }
                        str += '],';

                        str += '"readers":[],';
                        str += '"advisers":[';
                            for(var i=process.advisers.length-1; i>-1; i--){
                                var adviser = process.advisers[i];
                                str += '{';
                                str += '"id":"' + adviser.id + '",';
                                str += '"userId":"' + adviser.userId + '",';
                                str += '"userName":"' + adviser.userName + '",';
                                str += '"department":"' + adviser.department + '",';
                                str += '"createDatetime":"' + adviser.createDatetime + '",';
                                str += '"completeDatetime":"' + adviser.completeDatetime + '"';
                                str += '},';
                            }
                            if(process.advisers.length>0){
                                str = str.trim();
                                str = str.substring(0,str.length-1);
                            }
                        str += '],';
                        str += '"executers":[';
                            for(var i=process.executers.length-1; i>-1; i--){
                                var executer = process.executers[i];
                                str += '{';
                                str += '"id":"' + executer.id + '",';
                                str += '"userId":"' + executer.userId + '",';
                                str += '"userName":"' + executer.userName + '",';
                                str += '"department":"' + executer.department + '",';
                                str += '"createDatetime":"' + executer.createDatetime + '",';
                                str += '"completeDatetime":"' + executer.completeDatetime + '"';
                                str += '},';
                            }
                            if(process.executers.length>0){
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
                //console.log(str);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(str);
            }
        });
}

//--- for process begin -------

//------ for log begin --------
app.get('/logs/own', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getLogs(creatorIds,req,res);
});

app.get('/logs/one', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getNextLevelCreatorIds(creatorIds)
        .then(function(creatorIds){getLogs(creatorIds,req,res)})
        ;
});

app.get('/logs/two', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getNextLevelCreatorIds(creatorIds)
        .then(function(creatorIds){return getNextLevelCreatorIds(creatorIds)})
        .then(function(creatorIds){getLogs(creatorIds,req,res)})
        ;
});

app.get('/logs/three', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getNextLevelCreatorIds(creatorIds)
        .then(function(creatorIds){return getNextLevelCreatorIds(creatorIds)})
        .then(function(creatorIds){return getNextLevelCreatorIds(creatorIds)})
        .then(function(creatorIds){getLogs(creatorIds,req,res)})
        ;
});

app.get('/logs/four', function (req, res) {
    var creatorIds = [req.param('creatorId')];
    getNextLevelCreatorIds(creatorIds)
        .then(function(creatorIds){return getNextLevelCreatorIds(creatorIds)})
        .then(function(creatorIds){return getNextLevelCreatorIds(creatorIds)})
        .then(function(creatorIds){return getNextLevelCreatorIds(creatorIds)})
        .then(function(creatorIds){getLogs(creatorIds,req,res)})
        ;
});

app.post('/log', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jsonData = JSON.parse(req.body.mydata);
    var d = new Date();

    logdb.logs.save({_id:jsonData.id,message:jsonData.message, creator: jsonData.creator,datetime:d.getTime().toString(),comments:[]}, function(err, saved) {
        if( err || !saved ){
            var msg ="log not saved";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "log saved.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.post('/log-comment', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var logId = jdata.logId;
    var d = new Date()
    //console.log(jdata);
    var comment = new Object();
    comment.message = jdata.message;
    comment.datetime = d.getTime().toString();
    comment.creator = jdata.creator;


    logdb.logs.findAndModify({
        query: { _id: logId },
        update: {
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="log comment not added";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "log comment added.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

var getNextLevelCreatorIds = function(creatorIds){
    return new Promise(function(resolve){
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

var getLogs = function(creatorIds,req,res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log(req.param('userName'));
    //console.log(req.param('keyWord'));
    var keyWord = req.param('keyWord');
    var userName = req.param('userName');
    var offset = req.param('offset') ? 1*req.param('offset') : 0;
    var limit = req.param('limit') ? 1*req.param('limit') : 20;
    logdb.logs.
        find({'creator.id':{$in:creatorIds},'creator.name':{$regex:userName},'message':{$regex:keyWord}}).
        skip(offset).
        limit(limit).
        sort({datetime:-1},
        function(err, logs) {
        //console.log('ids: ' + creatorIds);
        if( err || !logs){
            console.log("get logs error! could NOT find logs!");
            console.log(err);
            res.writeHead(500, {'Content-Type': 'application/json'});
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
                    for(var i=log.comments.length-1; i>-1; i--){
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
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(str);
        }
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

//------ for log end --------


//------------- for user begin -----------
app.get('/user', function (req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    console.log("userId: " + req.param("userId"))
    userdb.users.findOne({_id:req.param("userId")}, function(err, user) {
        if( err || !user){
            console.log("No users found");
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end('{}');
        }else{
            var str='{';
            str += '"userId":"'         + user._id              + '"'              + ',';
            str += '"userName":"'       + user.userName         + '"'        + ',';
            str += '"pinyin":"'       + user.pinyin         + '"'        + ',';
            str += '"password":"'       + user.password         + '"'          + ',';
            str += '"department":"'     + user.department     + '"'          +  '';
            str += '}';
            console.log("get user successed!")
            //console.log(str);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end( str);
        }
    });
});

app.get('/users', function (req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    console.log("get users by " + req.param('userName'));
    userdb.users.find({userName:{$regex:req.param("userName")}}, function(err, users) {
        if( err || !users){
            console.log("No users found");
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end( "[]");
        }else{
            console.log('finded ' + users.length + ' users');
            var str='[';
            if(users.length>0){
                users.forEach( function(user) {
                    str += '{';
                    str += '"userId":"'         + user._id                                                                    + '"'       + ',';
                    str += '"userName":"'       + user.userName                                                              + '"'       + ',';
                    str += '"pinyin":"'       + user.pinyin                                                              + '"'       + ',';
                    str += '"password":"'       + user.password                                                               + '"'       + ',';
                    str += '"department":"'     + user.department                                                           + '"'       +  '';
                    str += '},' +'\n';
                });
                str = str.trim();
                str = str.substring(0,str.length-1);
            }
            str = str + ']';
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end( str);
        }
    });
});

app.get('/executers', function (req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    //console.log("term:" + req.param('term'));
    userdb.users.find({$or:[{userName:{$regex:req.param("term")}},{pinyin:{$regex:req.param("term")}}]}, function(err, users) {
        if( err || !users){
            console.log("No users found");
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end( "[]");
        }else{
            var str='[';
            if(users.length>0){
                users.forEach( function(user) {
                    str += '{';
                    str += '"userId":"'         + user._id                                                                    + '"'       + ',';
                    str += '"userName":"'       + user.userName                                                              + '"'       + ',';
                    str += '"pinyin":"'       + user.pinyin                                                              + '"'       + ',';
                    str += '"department":"'     + user.department                                                           + '"'       +  ',';
                    str += '"value":"' +  user.userName + ':' + user.department                                                           + '"'       +  '';
                    str += '},' +'\n';
                });
                str = str.trim();
                str = str.substring(0,str.length-1);
            }
            str = str + ']';
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end( str);
        }
    });
});

app.post('/user', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jsonData = JSON.parse(req.body.mydata);

    userdb.users.save(
        {
            _id:jsonData.userId,
            userName: jsonData.userName,
            pinyin: jsonData.pinyin,
            password: jsonData.password,
            department: jsonData.department,
            followers:[],
            tobeFollowers:[]
        }, function(err, saved) {
            if( err || !saved ){
                var msg ="User not saved";
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
                console.log(msg);
            }else{
                var msg = "User saved.";
                //console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
});
//------------- for user end -----------


//-------------- for user relation begin ------------

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
    userdb.users.find({followers:[req.param("userId")]}, function(err, users) {
        if( err || !users){
            console.log("No users found");
            res.writeHead(500, {'Content-Type': 'application/json'});
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
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end( str);
        }
    });
});

app.get('/users/tobeboss', function (req, res) {
    //console.log(req.param("userId"));
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    userdb.users.find({tobeFollowers:[req.param("userId")]}, function(err, users) {
        if( err || !users){
            console.log("No users found");
            res.writeHead(500, {'Content-Type': 'application/json'});
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
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end( str);
        }
    });
});

app.get('/users/unrelated',function(req,res){
    getUnrelated(req,res,getUnrelatedCallback1,getUnrelatedCallback2,getUnrelatedCallback3);
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
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "tobefollower added.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
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
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
            console.log(msg);
        }else{
            var msg = "follower added.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
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
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
            console.log(msg);
            console.log(err);
        }else{
            var msg = " follower or tobeFollower has deleted.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

function getUnrelated(req,res,callback1,callback2,callback3){
    var userId = req.param('userId');
    userdb.users.findOne({_id:userId}, function(err, user) {
        if( err || !user){
            //console.log("could not find user by id: " + userId);
            res.writeHead(500, {'Content-Type': 'application/json'});
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
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    userdb.users.find({_id:{$nin:relatedIds}}, function(err, users) {
        if( err || !users){
            //console.log("the user has no followers");
            res.writeHead(500, {'Content-Type': 'application/json'});
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
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(str);
        }
    });
}

function getFollowers(req,res,callback){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var userId = req.param('userId');
    userdb.users.findOne({_id:userId}, function(err, user) {
        if( err || !user){
            //console.log("could not find user.followers by id: " + userId);
            res.writeHead(500, {'Content-Type': 'application/json'});
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
    var userId = req.param('userId');
    userdb.users.findOne({_id:userId}, function(err, user) {
        if( err || !user){
            //console.log("could not find user by id: " + userId);
            res.writeHead(500, {'Content-Type': 'application/json'});
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
            res.writeHead(500, {'Content-Type': 'application/json'});
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
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(str);
        }
    });
}

function getTobeFollowersCallback(userIds,res) {
    userdb.users.find({_id:{$in:userIds}}, function(err, users) {
        if( err || !users){
            //console.log("the user has no followers");
            res.writeHead(500, {'Content-Type': 'application/json'});
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
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(str);
        }
    });
}

//-------------- for user relation begin ------------

app.listen(8080, function () {
    console.log('server started,  http://localhost:8080');
});
