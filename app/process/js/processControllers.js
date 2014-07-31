'use strict';

function ProcessCtrl($scope, $http, $templateCache, $window,$fileUploader) {
    $scope.processes = new Array();

    $scope.process = {
        subject:'',
        description:'',
        comment:''
    };

    $scope.pageState={
        keyWord:'',
        userName:'',
        users:[],
        findShow: false,
        createShow: false,
        todoShow: false,
        downShow: false,
        hasMore:true,

        yesBtnShow:true,
        noBtnShow:true,
        transferBtnShow:true,
        setUserBtnShow:true,
        sayBtnShow:true,
        stopBtnShow:true,
        restartBtnShow:true,

        detailDivShow:false,
        commentDivShow:true,
        attachmentDivShow:true,
        userDivShow:true,

        initDivShow: function(){
            $scope.pageState.commentDivShow=true;
            $scope.pageState.attachmentDivShow=true;
            $scope.pageState.userDivShow=true;
        },

        index:-1,
        offset:0,
        level:0,
        limit:20
    };

    $scope.loginUser = $window.sessionStorage.token ?
    {
        userId:$window.sessionStorage.loginUserId,
        userName:$window.sessionStorage.loginUserName,
        department:$window.sessionStorage.loginUserDepartment
    }:
    {
        userId:'',
        userName:'',
        department:''
    };

    $scope.getMore = function(){
        $scope.pageState.offset = $scope.logs.length;
        $scope.getProceses();
    }

    $scope.getAdvises = function(){
        alert('getAdvises');
    }

    $scope.getReads = function(){
        alert('getReads');
    }

    $scope.getCompleted = function(){
        alert('getComplete');
    }

    $scope.getNotCompleted = function(){
        alert('getNotComplete');
    }

    $scope.getStoped = function(){
        alert('getStoped');
    }

    $scope.setDivShow = function(divClass){
        var state = $scope.pageState[divClass];
        $scope.pageState.initDivShow();
        $scope.pageState[divClass] = !state;
    }

    $scope.getUsers = function(){
        var params = {
            userName:$scope.pageState.userName
        };
        $http.get('/users',{params:params}).
            success(function(data,status,headers,config) {
                //alert("get users success!");
                $scope.pageState.users = data;
            }).
            error(function(data,status,headers,config){
                alert("get users error!");
            });
    }
    $scope.addExecuter = function(index){
        var user = $scope.pageState.users[index];
        var executer = {
            id:user.userId,
            name:user.userName,
            department:user.department,
            createDatetime: new Date(),
            completeDatetime:''
        };
        $scope.pageState.users.splice(index,1);
        var process = $scope.processes[$scope.pageState.index];
        process.executers.push(executer);

        executer.add = true;
        executer.processId = process.id;
        var jdata = 'mydata='+JSON.stringify(executer);
        saveProcessExecuter($http,$templateCache,jdata);

    }
    $scope.delExecuter = function(index){
        var process = $scope.processes[$scope.pageState.index];
        var executer = process.executers[index];
        process.executers.splice(index,1);
        var user = {
            userId:executer.id,
            userName:executer.name,
            department:executer.department
        };
        $scope.pageState.users.push(user);

        executer.del = true;
        executer.processId = process.id;
        //alert(executer.id);
        var jdata = 'mydata='+JSON.stringify(executer);
        saveProcessExecuter($http,$templateCache,jdata);
    }

    $scope.addAdviser = function(index){
        var user = $scope.pageState.users[index];
        var adviser = {
            id:user.userId,
            name:user.userName,
            department:user.department,
            createDatetime: new Date(),
            completeDatetime:''
        };

        $scope.pageState.users.splice(index,1);
        var process = $scope.processes[$scope.pageState.index];
        process.advisers.push(adviser);
    }
    $scope.delAdviser = function(index){
        var process = $scope.processes[$scope.pageState.index];
        var adviser = process.advisers[index];
        var user = {
            userId:executer.id,
            userName:executer.name,
            department:executer.department
        };

        process.advisers.splice(index,1);
        $scope.pageState.users.push(adviser);
    }

    $scope.getProceses = function(){
        var params = {
            creatorId:$scope.loginUser.userId,
            offset:$scope.pageState.offset,
            limit:$scope.pageState.limit,
            level:$scope.pageState.level,
            keyWord:$scope.pageState.keyWord
        };
        var url = '/processes';
        getProcesesByHttp($scope,$http,url,params);
    };

    $scope.find = function(){
        alert('find by key ' + $scope.pageState.keyWord);
        /*
        $scope.processes = new Array();
        $scope.pageState.offset = 0;
        $scope.getProcesses();
        */

    }

    $scope.getProceses();

    $scope.setDetailDivShow = function(index){
        if($scope.pageState.index == index){
            $scope.pageState.detailDivShow = ! $scope.pageState.detailDivShow;
        }

        $scope.pageState.index = index;

        if(!$scope.pageState.detailDivShow){
            $scope.setYesBtn();
            $scope.setNoBtn();
            $scope.setTransferBtn();
            $scope.setUserBtn();
            $scope.setSayBtn();
            $scope.setStopBtn();
            $scope.setRestartBtn();
        }
    };

    $scope.submitComment = function(index){
        var process = $scope.processes[index];

        var msg = process.comment;
        var msg = msg.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

        var comment = {
            processId:process.id,
            message:msg,
            datetime:new Date(),
            creator:{
                "id":$scope.loginUser.userId,
                "name":$scope.loginUser.userName,
                "department":$scope.loginUser.department
            }
        };

        var jdata = 'mydata='+JSON.stringify(comment);

        saveProcessComment($http,$templateCache,jdata);

        process.comments.splice(0,0,comment);
        process.comment = "";
    };

    $scope.create = function(){
        if($window.sessionStorage.token){
            var subject = $scope.process.subject;
            var description = $scope.process.description;

            subject = subject.replace(/[\n\r]/g,'').replace(/[\\]/g,'');
            description = description.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

            var process = {
                id:uuid(24,11),
                subject:subject,
                description:description,
                createDatetime:new Date(),
                completeDatetime:"",
                closeDatetime:"",
                stopDatetime:"",
                creator:{
                    "id":$scope.loginUser.userId,
                    "name":$scope.loginUser.userName,
                    "department":$scope.loginUser.department
                },
                comments:[],
                readers:[],
                advisers:[],
                executers:[]
            };

            var jdata = 'mydata='+JSON.stringify(process);
            //alert('save ' +jdata );
            saveProcess($http,$templateCache,jdata);

            $scope.processes.splice(0,0,process);
            $scope.pageState.createShow = false;
            $scope.process.subject = '';
            $scope.process.description = '';

        }else{
            alert('请先登录');
        }
    };

    $scope.setCreateShow = function(){
        $scope.pageState.createShow = !$scope.pageState.createShow;
        $scope.pageState.todoShow = false;
        $scope.pageState.doneShow = false;
    };

    $scope.setTodoShow = function(){
        $scope.pageState.createShow = false;
        $scope.pageState.todoShow = !$scope.pageState.todoShow;
        $scope.pageState.doneShow = false;
    };

    $scope.setDoneShow = function(){
        $scope.pageState.createShow = false;
        $scope.pageState.todoShow = false;
        $scope.pageState.doneShow = !$scope.pageState.doneShow;
    };

    //-------- file upload-----------
    var uploader = $scope.uploader = $fileUploader.create({
        scope: $scope,                          // to automatically update the html. Default: $rootScope
        url: '/upload',
        formData: [
            { key: 'value' }
        ]
    });

    // REGISTER HANDLERS
    uploader.bind('success', function (event, xhr, item, response) {
        var process = $scope.processes[$scope.pageState.index];
        process.comment = response.url;
        $scope.submitComment($scope.pageState.index);

        //alert('Success', xhr, item, response);
    });

    uploader.bind('completeall', function (event, items) {
        //alert('Complete all', items);
        uploader.clearQueue();
    });
    /*
    uploader.bind('afteraddingfile', function (event, item) {
        //alert('After adding a file', item);
    });

    uploader.bind('whenaddingfilefailed', function (event, item) {
        //alert('When adding a file failed', item);
    });

    uploader.bind('afteraddingall', function (event, items) {
        //alert('After adding all files', items);
    });

    uploader.bind('beforeupload', function (event, item) {
        //alert('Before upload', item);
    });

    uploader.bind('progress', function (event, item, progress) {
        //alert('Progress: ' + progress, item);
    });
    uploader.bind('cancel', function (event, xhr, item) {
        //alert('Cancel', xhr, item);
    });

    uploader.bind('error', function (event, xhr, item, response) {
        //alert('Error', xhr, item, response);
    });

    uploader.bind('progressall', function (event, progress) {
       //alert('Total progress: ' + progress);
    });

     uploader.bind('complete', function (event, xhr, item, response) {
        //alert('Complete', xhr, item, response);
         //item.remove();
     });
    */



    $scope.isCreator = function(){
        var process = $scope.processes[$scope.pageState.index];
        return process.creator.id==$scope.loginUser.userId ? true : false;
    };

    $scope.isAdviser = function(){
        var process = $scope.processes[$scope.pageState.index];
        for(var i=0; i<process.advisers.length; i++){
            var adviser = process.advisers[i];
            if($scope.loginUser.userId == adviser.id) return true;
        }
        return false;
    };

    $scope.isExecuter = function(){
        var process = $scope.processes[$scope.pageState.index];
        for(var i=0; i<process.executers.length; i++){
            var executer = process.executers[i];
            if($scope.loginUser.userId == executer.id){
                return true;
            }
        }
        return false;
    };

    $scope.isAuthor = function(){
        var process = $scope.processes[$scope.pageState.index];
        for(var i=0; i<process.executers.length; i++){
            var executer = process.executers[i];
            if($scope.loginUser.userId == executer.id
                && executer.createDateTime.length != 0
                && executer.completeDateTime.length == 0
                ){
                return true;
            }
        }
        return false;
    };

    $scope.hasStoped = function(){
        var process = $scope.processes[$scope.pageState.index];
        return process.stopDateTime.length!=0 ? true : false;
    };

    $scope.hasClosed = function(){
        var process = $scope.processes[$scope.pageState.index];
        return process.closeDateTime.length!=0 ? true : false;
    };

    // 未关闭、未终止的流程，发起人和当前处理人都可终止流程
    $scope.setStopBtn = function(){
        $scope.pageState.stopBtnShow = ($scope.isCreator() || $scope.isAuthor()) && !$scope.hasStoped() && !$scope.hasClosed();
    };

    // 已关闭或终止的流程，发起人和处理人都能重启流程
    $scope.setRestartBtn = function(){
        $scope.pageState.restartBtnShow = ($scope.hasStoped() || $scope.hasClosed()) && ($scope.isExecuter() || $scope.isCreator());
    };

    //未关闭、未终止的流程，参与人都可发言，即使是排在后面的处理人，也可先发言。发言并不影响流程的流向
    $scope.setSayBtn = function(){
        $scope.pageState.sayBtnShow = !$scope.hasStoped() && !$scope.hasClosed() && ($scope.isExecuter() || $scope.isAdviser() || $scope.isCreator());
    };

    //参与人随时都可拉会签人和处理人进来，即使该流程已关闭或终止
    $scope.setUserBtn = function(){
        $scope.pageState.setUserBtnShow = $scope.isExecuter() || $scope.isAdviser() || $scope.isCreator();
    };

    //未关闭、未终止的流程，当前的处理人将处理权转给其他人
    $scope.setTransferBtn = function(){
        $scope.pageState.transferBtnShow = !$scope.hasStoped() && !$scope.hasClosed() && $scope.isAuthor();
    };

    //未关闭、未终止的流程，当前的处理人决定流程走向
    $scope.setYesBtn = function(){
        $scope.pageState.yesBtnShow = !$scope.hasStoped() && !$scope.hasClosed() && $scope.isAuthor();
    };

    //未关闭、未终止的流程，当前的处理人决定流程走向
    $scope.setNoBtn = function(){
        $scope.pageState.noBtnShow = !$scope.hasStoped() && !$scope.hasClosed() && $scope.isAuthor();
    };
}

function getProcesesByHttp($scope, $http,url, params){
    $http.get(url,{params:params}).
        success(function(data,status,headers,config) {
            //alert("get Proceses successed! " + data);
            var j = data.length;
            $scope.pageState.hasMore  = j==$scope.pageState.limit ? true : false;
            for(var i=0; i<j; i++){
                $scope.processes.push(data[i]);
            }
        }).
        error(function(data,status,headers,config){
            alert("get Proceses By Http error!" + data);
        });
}

function saveProcessComment($http,$templateCache,jdata ){
    var method = 'POST';
    var url = '/process-comment';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
            //alert("save process successed!");
        }).
        error(function(response) {
            alert("save comment error!");
        });
}


function saveProcessExecuter($http,$templateCache,jdata ){
    var method = 'POST';
    var url = '/process-executer';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
            alert("save process-executer successed!");
        }).
        error(function(response) {
            alert("save process-executer error!");
        });
}

function saveProcess($http,$templateCache,jdata ){
    //alert(jdata);
    var method = 'POST';
    var url = '/process';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
            //alert("save process successed!");
        }).
        error(function(response) {
            alert("save process error!");
        });
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
