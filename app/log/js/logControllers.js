'use strict';

function LogCtrl($scope, Log, $window, $http, $templateCache) {
    //alert('hello, i am here.');
    var str = "#工作总结#             \n\n#工作计划#\n";
    $scope.message = str;

    $scope.loginUser = parseProfile($window.sessionStorage.token);

    $scope.logs = Log.query();

    $scope.toggleCommentState = function(index){
        $scope.selectedIndex = index;
    };

    $scope.submitComment = function(index){
        var log = $scope.logs[index];
        var comment = {
            id:"",
            message:log.comment,
            datetime:new Date(),
            creator:{
                "id":$scope.loginUser.id,
                "name":$scope.loginUser.username,
                "department":$scope.loginUser.department
            }
        };
        log.comments.splice(0,0,comment);
        log.comment = "";
    };

    $scope.submitMesasage = function(){
        var message = {
            id:"",
            message:$scope.message,
            datetime:new Date(),
            creator:{
                "id":$scope.loginUser.id,
                "name":$scope.loginUser.username,
                "department":$scope.loginUser.department
            },
            comments:[]
        };

        var jdata = 'mydata='+JSON.stringify(message);

        var method = 'POST';
        var url = '/log';
        alert('begin save log ......');
        $http({
            method: method,
            url: url,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                alert("save log successed!");
                $scope.codeStatus = response.data;
                console.log($scope.codeStatus);

            }).
            error(function(response) {
                alert("save log error!");
                $scope.codeStatus = response || "Request failed";
                console.log($scope.codeStatus);
            });

        alert('end save!');

        $scope.logs.splice(0,0,message);
        $scope.message = str;
    };

}

function parseProfile(token){
    var profile = {};
    if (token) {
        var encodedProfile = token.split('.')[1];
        profile = JSON.parse(url_base64_decode(encodedProfile));
    }
    return profile;
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