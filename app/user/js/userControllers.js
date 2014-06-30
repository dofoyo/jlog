'use strict';

function UserFilterCtrl($scope, userFilterService) {
    $scope.userFilterService = userFilterService;
}

function UserCtrl($scope, User, $window, userFilterService) {
    $scope.userFilterService = userFilterService;
    $scope.loginUser = parseProfile($window.sessionStorage.token);
    $scope.users = User.query();

    $scope.refresh = function(){
        var username = $scope.loginUser.username;
        //alert(username);
        for(var i=0; i<$scope.users.length; i++){
            var user = $scope.users[i];
            user.isMyBoss = user.bosses.indexOf(username)==-1 ? false : true;
            user.isMyFollower = user.followers.indexOf(username)==-1 ? false : true;
            user.tobeMyBoss = user.tobeBosses.indexOf(username)==-1 ? false : true;
            user.isMyself = user.name==username ? true : false;
        }
    }

    $scope.addFollower = function(index){
        var username = $scope.loginUser.username;
        var user = $scope.users[index];
        user.followers = user.followers + "," + username;
        user.isMyFollower = true;
    }

    $scope.deleteFollower = function(index){
        var username = $scope.loginUser.username;
        var user = $scope.users[index];
        user.followers.replace(username,"");
        user.isMyFollower = false;
    }
    $scope.addBoss = function(index){
        var username = $scope.loginUser.username;
        var user = $scope.users[index];
        user.bosses = user.bosses + "," + username;
        user.isMyBoss = true;
    }

    $scope.deleteBoss = function(index){
        var username = $scope.loginUser.username;
        var user = $scope.users[index];
        user.bosses.replace(username,"");
        user.isMyBoss = false;
    }

    $scope.agreeMyBoss = function(index){

    }

    $scope.disagreeMyBoss = function(index){

    }
}

function UserListCtrl($scope, $http, $templateCache) {

    var method = 'POST';
    var inserturl = '/user';
    $scope.search = {};
    $scope.search.username = '';
    $scope.codeStatus = "";
    $scope.save = function() {
        var formData = {
            'userid':uuid(24,11),
            'username' : this.username,
            'password' : this.password,
            'department' : this.department,
            'bosses':'',
            'followers':''
        };
        this.userid = '';
        this.username = '';
        this.password = '';
        this.department = '';
        this.bosses = '';
        this.followers = '';


        var jdata = 'mydata='+JSON.stringify(formData);

        $http({
            method: method,
            url: inserturl,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                alert("save user successed!");
                $scope.codeStatus = response.data;
                console.log($scope.codeStatus);

            }).
            error(function(response) {
                alert("save user error!");
                $scope.codeStatus = response || "Request failed";
                console.log($scope.codeStatus);
            });
        $scope.list();
        return false;
    };

    $scope.list = function() {
        $http.get('/users',{params:{username:$scope.search.username}}).
            success(function(data,status,headers,config) {
                //alert("get users success!");
                $scope.users = data;
            }).
            error(function(data,status,headers,config){
                alert("get users error!");
            });
    };
    $scope.list();
}


function uuid(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}
