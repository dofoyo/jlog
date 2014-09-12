var express = require('express');

// ------- for authenticate
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var secret = 'this is the secret secret secret 12356';

//--------- for mongodb
var databaseUrl = "jlog"; // "username:password@example.com/mydb"
var userCollections = ["users"];
var logCollections = ["logs"];
var taskCollections = ["tasks"];
var userdb = require("mongojs").connect(databaseUrl, userCollections);
var logdb = require("mongojs").connect(databaseUrl, logCollections);
var taskdb = require("mongojs").connect(databaseUrl, taskCollections);


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

//--- for task begin -------
app.post('/task-readed', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var taskId = jdata.taskId;
    var datetime = (new Date()).getTime().toString();

    var comment = new Object();
    comment.id = datetime;
    comment.type = '2';
    comment.message = '已阅';
    comment.createDatetime = datetime;
    comment.completeDatetime = datetime;
    comment.userId = jdata.userId;
    comment.userName = jdata.userName;
    comment.department = jdata.department;

    taskdb.tasks.findAndModify({
        query: { _id: taskId },
        update: {
            $pull: { readers:{userId:jdata.userId}},
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="task read comments not added";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "task read comments added.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});


app.post('/task-no', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var taskId = jdata.taskId;
    var close_Date_time = jdata.closeDatetime;
    var createDatetime = jdata.createDatetime;
    var datetime = (new Date()).getTime().toString();

    var comment = new Object();
    comment.id = jdata.id;
    comment.type = jdata.type;
    comment.message = jdata.message;
    comment.createDatetime = createDatetime;
    comment.completeDatetime = datetime;
    comment.userId = jdata.userId;
    comment.userName = jdata.userName;
    comment.department = jdata.department;

    taskdb.tasks.findAndModify({
        query: { _id: taskId },
        update: {
            $set:{closeDatetime:close_Date_time,readers:jdata.readers},
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="task_no not added";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "task_no added.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.post('/task-yes', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var taskId = jdata.taskId;
    var executerId = jdata.executerId;
    var datetime = (new Date()).getTime().toString();

    var comment = new Object();
    comment.id = jdata.id;
    comment.type = jdata.type;
    comment.message = jdata.message;
    comment.createDatetime = jdata.createDatetime;
    comment.completeDatetime = datetime;
    comment.userId = jdata.userId;
    comment.userName = jdata.userName;
    comment.department = jdata.department;

    taskdb.tasks.findAndModify({
        query: { _id: taskId },
        update: {
            $set:{closeDatetime:jdata.closeDatetime,readers:jdata.readers},
            $pull: { executers:{userId:executerId}},
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="task yes not added";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "task yes added.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.post('/task-stop', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var taskId = jdata.taskId;
    var datetime = (new Date()).getTime().toString();

    var comment = new Object();
    comment.id = jdata.id;
    comment.type = jdata.type;
    comment.message = jdata.message;
    comment.createDatetime = datetime;
    comment.completeDatetime = datetime;
    comment.userId = jdata.userId;
    comment.userName = jdata.userName;
    comment.department = jdata.department;

    taskdb.tasks.findAndModify({
        query: { _id: taskId },
        update: {
            $set: {stopDatetime: datetime,readers:jdata.readers},
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="task stop not success.";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "task stopped.";
            console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.post('/task-restart', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var taskId = jdata.taskId;
    var datetime = (new Date()).getTime().toString();

    var comment = new Object();
    comment.id = jdata.id;
    comment.type = jdata.type;
    comment.message = jdata.message;
    comment.createDatetime = datetime;
    comment.completeDatetime = datetime;
    comment.userId = jdata.userId;
    comment.userName = jdata.userName;
    comment.department = jdata.department;

    taskdb.tasks.findAndModify({
        query: { _id: taskId },
        update: {
            $set: {stopDatetime: '', closeDatetime:'',readers:jdata.readers},
            $addToSet: { comments:comment }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="task restart not success.";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "task restarted.";
            console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.post('/task-reader', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var taskId = jdata.taskId;
    var d = new Date()

    if(jdata.add){
        var reader = new Object();
        reader.id = jdata.id;
        reader.userId = jdata.userId;
        reader.userName = jdata.userName;
        reader.department = jdata.department;
        reader.createDatetime = d.getTime().toString();
        taskdb.tasks.findAndModify({
            query: { _id: taskId },
            update: {
                $addToSet: { readers:reader }
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if( err ){
                var msg ="task reader not added";
                console.log(msg);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
            }else{
                var msg = "task reader added.";
                console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
    }else{
        taskdb.tasks.findAndModify({
            query: { _id: taskId },
            update: {
                $pull: { readers:{userId:jdata.userId}}
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if( err ){
                var msg ="task reader " + jdata.userId + "," + jdata.createDatetime + " not deleted";
                console.log(msg);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
            }else{
                //console.log(doc);
                var msg = "task reader " + jdata.userId + "," + jdata.createDatetime  + " deleted.";
                console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
    }
});


app.post('/task-adviser', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var taskId = jdata.taskId;
    var d = new Date()

    if(jdata.add){
        var adviser = new Object();
        adviser.id = jdata.id;
        adviser.userId = jdata.userId;
        adviser.userName = jdata.userName;
        adviser.department = jdata.department;
        adviser.createDatetime = d.getTime().toString();
        taskdb.tasks.findAndModify({
            query: { _id: taskId },
            update: {
                $addToSet: { advisers:adviser }
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if( err ){
                var msg ="task adviser not added";
                console.log(msg);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
            }else{
                var msg = "task adviser added.";
                console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
    }else{
        taskdb.tasks.findAndModify({
            query: { _id: taskId },
            update: {
                $pull: { advisers:{id:jdata.id}}
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if( err ){
                var msg ="task adviser " + jdata.id + "," + jdata.createDatetime + " not deleted";
                console.log(msg);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
            }else{
                //console.log(doc);
                var msg = "task adviser " + jdata.id + "," + jdata.createDatetime  + " deleted.";
                console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
    }
});

app.post('/task-executer', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var taskId = jdata.taskId;
    var d = new Date()

    if(jdata.add){
        var executer = new Object();
        executer.id = jdata.id;
        executer.userId = jdata.userId;
        executer.userName = jdata.userName;
        executer.department = jdata.department;
        executer.createDatetime = d.getTime().toString();
        executer.completeDatetime = '';
        taskdb.tasks.findAndModify({
            query: { _id: taskId },
            update: {
                $addToSet: { executers:executer }
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if( err ){
                var msg ="task executer not added";
                console.log(msg);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
            }else{
                var msg = "task executer added.";
                console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
    }else{
        taskdb.tasks.findAndModify({
            query: { _id: taskId },
            update: {
                $pull: { executers:{id:jdata.id}}
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if( err ){
                var msg ="task executer " + jdata.id + "," + jdata.createDatetime + " not deleted";
                console.log(msg);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(msg);
            }else{
                //console.log(doc);
                var msg = "task executer " + jdata.id + "," + jdata.createDatetime  + " deleted.";
                console.log(msg);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(msg);
            }
        });
    }
});

app.post('/task-supplement', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jdata = JSON.parse(req.body.mydata);
    var taskId = jdata.taskId;
    var userId = jdata.userId;
    var datetime = (new Date()).getTime().toString();

    var comment = new Object();
    comment.id = jdata.id;
    comment.type = jdata.type;
    comment.message = jdata.message;
    comment.createDatetime = jdata.createDatetime;
    comment.completeDatetime = datetime;
    comment.userId = jdata.userId;
    comment.userName = jdata.userName;
    comment.department = jdata.department;

    taskdb.tasks.findAndModify({
        query: { _id: taskId },
        update: {
            $set:{readers:jdata.readers},
            $addToSet: { comments:comment },
            $pull: { advisers:{userId:userId}}
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if( err ){
            var msg ="task supplement not added";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "task supplement added.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.post('/task', function (req, res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    var jsonData = JSON.parse(req.body.mydata);
    var d = new Date();

    taskdb.tasks.save({
        _id:jsonData.id,
        type:jsonData.type,
        subject:jsonData.subject,
        description:jsonData.description,
        userId:jsonData.userId,
        userName:jsonData.userName,
        department:jsonData.department,
        createDatetime:d.getTime().toString(),
        closeDatetime:'',
        stopDatetime:'',
        comments:[{id:jsonData.id,type:0,message:'发起',createDatetime:d.getTime().toString(),completeDatetime:d.getTime().toString(),userId:jsonData.userId,userName:jsonData.userName,department:jsonData.department}],
        readers:[],
        advisers:[],
        executers:[]
        }, function(err, saved) {
        if( err || !saved ){
            var msg ="task not saved";
            console.log(msg);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(msg);
        }else{
            var msg = "task saved.";
            //console.log(msg);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(msg);
        }
    });
});

app.get('/tasks',function(req,res){
    console.log("/tasks");
    //console.log(req.param('userName'));
    //console.log('type: ' + req.param('type'));
    var type = 1*req.param("type");
    var keyWord = req.param('keyWord');
    var offset = req.param('offset') ? 1*req.param('offset') : 0;
    var limit = req.param('limit') ? 1*req.param('limit') : 20;
    var loginUserId = req.param('loginUserId');

    console.log(keyWord);

    var finder;
    switch (type){
        case 1:     //1-create:我创建的
            console.log("1-create:我创建的");
            finder = {
                $and:[
                    {'subject':{$regex:keyWord}},
                    {'userId':loginUserId}
                ]
            };
            break;
        case 2:     //2-toExecute:待处理
            console.log("2-toExecute:待处理");
            finder = {
                $and:[
                    {'subject':{$regex:keyWord}},
                    {'closeDatetime':''},
                    {'stopDatetime':''},
                    {'executers':{$elemMatch:{"userId":loginUserId}}}
                ]
            };
            break;
        case 3:     //3-toAdvise:待签
            console.log("3-toAdvise:待签");
            finder = {
                $and:[
                    {'subject':{$regex:keyWord}},
                    {'closeDatetime':''},
                    {'stopDatetime':''},
                    {'advisers':{$elemMatch:{"userId":loginUserId}}}
                ]
            };
            break;
        case 23:     //2-toExecute:待处理
            console.log("23-toExecute&Adviser:待处理+待签");
            finder = {
                $and:[
                    {'subject':{$regex:keyWord}},
                    {'closeDatetime':''},
                    {'stopDatetime':''},
                    {$or:[{'executers':{$elemMatch:{"userId":loginUserId}}},{'advisers':{$elemMatch:{"userId":loginUserId}}}]}
                ]
            };
            break;
        case 4:     //4-toRead:待阅
            console.log("4-toRead:待阅");
            finder = {
                $and:[
                    {'subject':{$regex:keyWord}},
                    {'readers':{$elemMatch:{"userId":loginUserId}}}
                ]
            };
            break;
        case 6:     //6-completed:已完成
            console.log("6-completed:已完成");
            finder = {
                $and:[
                    {'subject':{$regex:keyWord}},
                    {'closeDatetime':{$ne:''}},
                    {'comments':{$elemMatch:{"userId":loginUserId}}}
                ]
            };
            break;
        case 5:     //5-notCompleted:未完成
            console.log("5-notCompleted:未完成");
            finder = {
                $and:[
                    {'subject':{$regex:keyWord}},
                    {'closeDatetime':''},
                    {'stopDatetime':''},
                    {'comments':{$elemMatch:{"userId":loginUserId}}}
                ]
            };
            break;
        case 7:     //7-stoped：已终止
            console.log("7-stoped：已终止");
            finder = {
                $and:[
                    {'subject':{$regex:keyWord}},
                    {'stopDatetime':{$ne:''}},
                    {'comments':{$elemMatch:{"userId":loginUserId}}}
                ]
            };
            break;
        case 567:     //7-stoped：已终止
            console.log("7-stoped：已终止");
            finder = {
                $and:[
                    {'subject':{$regex:keyWord}},
                    {'comments':{$elemMatch:{"userId":loginUserId}}}
                ]
            };
            break;
    }

    getTasks(finder,offset,limit,res);
});

var getTasks = function(finder,offset,limit,res){
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    taskdb.tasks.
        find(finder).
        skip(offset).
        limit(limit).
        sort({createDatetime:-1},
        function(err, tasks) {
            if( err || !tasks){
                console.log("get taskes error! could NOT find tasks!");
                console.log(err);
                res.writeHead(500, {'Content-Type': 'application/text'});
                res.end("[]");
            } else {
                console.log("there are "+ tasks.length +" tasks Found!");
                var str='[';
                if(tasks.length>0){
                    tasks.forEach( function(task) {
                        str += '{';
                        str += '"id":"' + task._id + '",';
                        str += '"type":"' + task.type + '",';
                        str += '"subject":"' + task.subject + '",';
                        str += '"description":"' + task.description + '",';
                        str += '"createDatetime":"' + task.createDatetime + '",';
                        str += '"closeDatetime":"' + task.closeDatetime + '",';
                        str += '"stopDatetime":"' + task.stopDatetime + '",';
                        str += '"userId":"' + task.userId + '",';
                        str += '"userName":"' + task.userName + '",';
                        str += '"department":"' + task.department + '",';
                        str += '"comments":[';
                            for(var i=task.comments.length-1; i>-1; i--){
                                var comment = task.comments[i];
                                if(comment.type != '2'){
                                    str += '{';
                                    str += '"id":"' + comment.id + '",';
                                    str += '"type":"' + comment.type + '",';
                                    str += '"message":"' + comment.message + '",';
                                    str += '"createDatetime":"' + comment.createDatetime + '",';
                                    str += '"completeDatetime":"' + comment.completeDatetime + '",';
                                    str += '"userId":"' + comment.userId + '",';
                                    str += '"userName":"' + comment.userName + '",';
                                    str += '"department":"' + comment.department + '"';
                                    str += '},';
                                }
                            }
                            if(task.comments.length>0){
                                str = str.trim();
                                str = str.substring(0,str.length-1);
                            }
                        str += '],';

                        str += '"readers":[';
                            for(var i=task.readers.length-1; i>-1; i--){
                                var reader = task.readers[i];
                                str += '{';
                                str += '"userId":"' + reader.userId + '",';
                                str += '"userName":"' + reader.userName + '",';
                                str += '"department":"' + reader.department + '",';
                                str += '"createDatetime":"' + reader.createDatetime + '"';
                                str += '},';
                            }
                            if(task.readers.length>0){
                                str = str.trim();
                                str = str.substring(0,str.length-1);
                            }
                        str += '],';
                        str += '"advisers":[';
                            for(var i=task.advisers.length-1; i>-1; i--){
                                var adviser = task.advisers[i];
                                str += '{';
                                str += '"id":"' + adviser.id + '",';
                                str += '"userId":"' + adviser.userId + '",';
                                str += '"userName":"' + adviser.userName + '",';
                                str += '"department":"' + adviser.department + '",';
                                str += '"createDatetime":"' + adviser.createDatetime + '"';
                                str += '},';
                            }
                            if(task.advisers.length>0){
                                str = str.trim();
                                str = str.substring(0,str.length-1);
                            }
                        str += '],';
                        str += '"executers":[';
                            for(var i=task.executers.length-1; i>-1; i--){
                                var executer = task.executers[i];
                                str += '{';
                                str += '"id":"' + executer.id + '",';
                                str += '"userId":"' + executer.userId + '",';
                                str += '"userName":"' + executer.userName + '",';
                                str += '"department":"' + executer.department + '",';
                                str += '"createDatetime":"' + executer.createDatetime + '"';
                                str += '},';
                            }
                            if(task.executers.length>0){
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

//--- for task begin -------

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
