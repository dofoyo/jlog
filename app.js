var express = require('express');
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var secret = 'this is the secret secret secret 12356';

var databaseUrl = "jlog"; // "username:password@example.com/mydb"
var collections = ["users"]
var db = require("mongojs").connect(databaseUrl, collections);

var app = express();

// We are going to protect /api routes with JWT
app.use('/api', expressJwt({secret: secret}));

app.use(express.json());
app.use(express.urlencoded());

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
   db.users.find({username:req.body.username,password:req.body.password}, function(err, users) {
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

app.listen(8080, function () {
  console.log('server started,  http://localhost:8080');
});


