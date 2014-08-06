'use strict';
var pc = angular.module('myApp.processControllers', []);

pc.controller('ProcessCtrl',[
    '$scope',
    '$http',
    '$templateCache',
    '$window',
    '$fileUploader',
    'CommentType',
    'uuid',
    'Processes',
    'User',
    function($scope, $http, $templateCache, $window,$fileUploader,CommentType,uuid,Processes,User){
        $scope.loginUser = $window.sessionStorage.token ?  {
            userId:$window.sessionStorage.loginUserId,
            userName:$window.sessionStorage.loginUserName,
            department:$window.sessionStorage.loginUserDepartment
        } : {
            userId:'',
            userName:'',
            department:''
        };

        $scope.users = {
            list: [],
            keyWord:'',
            refresh:function(){
                User.query({userName:this.keyWord},function(data){
                    $scope.users.list = data;
                });
            }
        };

        $scope.processes ={
            formData:{
                data1:'',
                data2:''
            },
            list:[],
            params:{
                loginUserId:$scope.loginUser.userId,
                keyWord:'',
                offset:0,
                limit:2,
                type:''   //1-create:我创建的，2-toExecute:待处理, 3-toAdvise:待签，4-toRead:待阅,5-completed:已完成，6-notCompleted:未完成，7-stoped：已终止
            },
            index:-1,
            hasMore:false,

            refresh:function(){
                Processes.query(this.params,function(data){
                    $scope.processes.hasMore  = data.length==$scope.processes.params.limit ? true : false;
                    $scope.processes.params.offset += data.length;
                    console.log("data.length: " + data.length)
                    for(var i=0; i<data.length; i++){
                        var process = new Process(data[i],$scope,$http,$templateCache);
                        $scope.processes.list.push(process);
                    };
                })
            },

            selectProcess: function(index){
                var process = this.list[index];
                process.refreshToolbar();
                if(this.index == index){
                    process.div.show = !process.div.show;
                }else{
                    process.div.show = false;
                }
                this.index = index;
            },

            empty:function(){
                this.list = [];
                this.index = -1;
                this.params.offset = 0;
                this.hasMore = false;
            },

            getProcess:function(){
                return this.list[this.index];
            },

            create: function(){
                if($window.sessionStorage.token){
                    var id = uuid;
                    var subject = this.formData.data1.replace(/[\n\r]/g,'').replace(/[\\]/g,'');
                    var description = this.formData.data2.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

                    var process = {
                        id:id,
                        subject:subject,
                        description:description,
                        createDatetime:(new Date()).getTime().toString(),
                        closeDatetime:"",
                        stopDatetime:"",
                        "userId":$scope.loginUser.userId,
                        "userName":$scope.loginUser.userName,
                        "department":$scope.loginUser.department,
                        comments:[],
                        readers:[],
                        advisers:[],
                        executers:[]
                    };

                    var jdata = 'mydata='+JSON.stringify(process);
                    //alert('save ' +jdata );
                    saveData('/process',$http,$templateCache,jdata);

                    this.list.splice(0,0,new Process(process,$scope,$http,$templateCache));

                    this.formData.data1 = '';
                    this.formData.data2 = '';
                }else{
                    alert('请先登录');
                }
            },

            getProcesses: function(type){
                this.empty();
                this.params.type = type;
                this.refresh();
            },

            find: function(){
                this.empty();
                this.refresh();
            }
        };

        $scope.pageState={
            createDiv: false,
            todoDiv: false,
            doneDiv: false,
            showDiv:function(div){
                if(!$window.sessionStorage.token){
                    alert('请登录！');
                } else{
                    var currentDiv = this.createDiv ? 'createDiv': (this.todoDiv ? 'todoDiv' : 'doneDiv');

                    this.createDiv = div == 'createDiv' ? true : false;
                    this.todoDiv   = div == 'todoDiv' ? true : false;
                    this.doneDiv   = div == 'doneDiv' ? true : false;

                    //console.log('showDiv: ' + div);

                    if(this.createDiv){
                        $scope.processes.empty();
                        $scope.processes.params.type = '1'  //我的流程
                        $scope.processes.refresh();
                    }else{
                        $scope.processes.empty();
                    }
                }
            }
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
            var process = $scope.processes.getProcess();
            process.formData = response.url;
            process.supplement();
        });

        uploader.bind('completeall', function (event, items) {
            //alert('Complete all', items);
            uploader.clearQueue();
        });

}]);

function saveData(url,$http,$templateCache,jdata){
    //alert(jdata);
    var method = 'POST';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
            //alert("save data successed! url:" + url);
        }).
        error(function(response) {
            alert("save data error! url:" + url);
        });
}

function Process(obj,$scope,$http,$templateCache){
    this.id = obj.id;
    this.subject = obj.subject;
    this.description = obj.description;
    this.createDatetime = obj.createDatetime;
    this.closeDatetime = obj.closeDatetime;
    this.stopDatetime = obj.stopDatetime;
    this.userId = obj.userId;
    this.userName = obj.userName;
    this.department = obj.department;
    this.comments = obj.comments;
    this.readers = obj.readers;
    this.advisers = obj.advisers;
    this.executers = obj.executers;

    this.state = this.stopDatetime.length!=0 ? "已终止" : (this.closeDatetime.length!=0 ? "已完成" : "正在执行中...");

    this.formData = '';
    this.toolbar = {
        yesBtn:false,
        noBtn:false,
        userBtn:false,
        supplementBtn:false,
        attachmentBtn:false,
        stopBtn:false,
        restartBtn:false,
        supplementBtnTitle:"补充"
    };
    this.div = {
        show:true,
        yesDiv:true,
        noDiv:true,
        stopDiv:true,
        restartDiv:true,
        userDiv:true,
        supplementDiv:true,
        attachmentDiv:true
    };

    this.isCreator= function(){
        return this.userId==$scope.loginUser.userId ? true : false;
    };

    this.isAdviser = function(){
        for(var i=0; i<this.advisers.length; i++){
            var adviser = this.advisers[i];
            if($scope.loginUser.userId == adviser.userId){
                return true;
            }
        }
        return false;
    };

    this.getAdviseCreateDatetime = function(){
        var datetime = "";
        if(this.advisers.length>0){
            var compare = function (prop) {
                return function (obj1, obj2) {
                    var val1 = obj1[prop];
                    var val2 = obj2[prop];if (val1 < val2) {
                        return -1;
                    } else if (val1 > val2) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            }

            this.advisers.sort(compare("id"));

            for(var i=0; i<this.advisers.length; i++){
                var adviser = this.advisers[i];
                if($scope.loginUser.userId == adviser.userId){
                    datetime = adviser.createDatetime;
                }
                break;
            }
        }
        return datetime;
    }

    this.rebuildAdvisers = function(){
        var newAdvisers = [];
        for(var i=0; i<this.advisers.length; i++){
            var adviser = this.advisers[i];
            if($scope.loginUser.userId != adviser.userId){
                newAdvisers.splice(0,0,adviser);
            }else{
                //alert("finded");
            }
        }
        this.advisers = newAdvisers;
    }

    this.isExecuter = function(){
        for(var i=0; i<this.executers.length; i++){
            var executer = this.executers[i];
            if($scope.loginUser.userId == executer.userId){
                return true;
            }
        }
        return false;
    };

    this.isAuthor = function(){
        var isAuthor = false;
        if(this.executers.length>0){
            var compare = function (prop) {
                return function (obj1, obj2) {
                    var val1 = obj1[prop];
                    var val2 = obj2[prop];if (val1 < val2) {
                        return -1;
                    } else if (val1 > val2) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            }

            this.executers.sort(compare("id"));
            var executer = this.executers[0];
            if($scope.loginUser.userId == executer.userId){
                isAuthor = true;
            }
        }
        return isAuthor;
    };

    this.isRelation = function(){
        var relation = false;
        if(this.comments.length>0){
            for(var i=0; i<this.comments.length; i++){
                var comment = this.comments[i];
                if($scope.loginUser.userId == comment.userId){
                    relation = true;
                    break;
                }
            }
        }
        return relation;
    }

    this.hasStoped = function(){
        return this.stopDatetime.length!=0 ? true : false;
    };

    this.hasClosed = function(){
        return this.closeDatetime.length!=0 ? true : false;
    };

    this.hasCompleted = function(){
        return this.executers.length==0 ? true : false;
    };


    this.refreshToolbar = function(){
        var iscr = this.isCreator();
        var isau = this.isAuthor();
        var isex = this.isExecuter();
        var isad = this.isAdviser();
        var hass = this.hasStoped();
        var hasc = this.hasClosed();
        var hasco = this.hasCompleted();
        var isre = this.isRelation();

        /*
        console.log("isCreator:" + iscr);
        console.log("isAuthor:" + isau);
        console.log("isExecuter:" + isex);
        console.log("isAdviser:" + isad);
        console.log("hasStoped:" + hass);
        console.log("hasClosed:" + hasc);
        console.log("hasCompleted:" + hasco);
        */

        this.state = hass ? "已终止" : (hasc ? "已完成" : "正在执行中...");

        // 未完成、未终止的流程，发起人和当前处理人都可终止流程
        this.toolbar.stopBtn = (iscr || isau) && !hass && !hasc;

        // 已关闭、已终止的流程，发起人和处理人能重启流程
        this.toolbar.restartBtn = (hass || hasc) && (isex || iscr);

        //未关闭、未终止的流程，参与人都可发言，即使是排在后面的处理人，也可先发言。发言并不影响流程的流向
        this.toolbar.supplementBtn = !hass && !hasc && (isex || isad || iscr || isre);
        this.toolbar.supplementBtnTitle = isad ? "会签" : "补充";
        this.toolbar.attachmentBtn = !hass && !hasc && (isex || isad || iscr || isre);

        //未关闭、未终止的流程,发起人和当前处理人可拉会签人和处理人进来
        this.toolbar.userBtn = !hass && !hasc && (isau || iscr);

        //未关闭、未终止的流程，当前的处理人决定流程走向：通过或驳回
        //通过后，当前处理人可以补充发言
        //驳回后，流程处于关闭状态，发起人和处理人可重启流程
        this.toolbar.yesBtn = !hass && !hasc && isau;
        this.toolbar.noBtn = !hass && !hasc && isau;
    };

    this.showDiv = function(div){
        this.div[div] = !this.div[div];
        if(div != 'yesDiv'){
            this.div.yesDiv = true;
        };
        if(div != 'noDiv'){
            this.div.noDiv = true;
        };
        if(div != 'stopDiv'){
            this.div.stopDiv = true;
        };
        if(div != 'restartDiv'){
            this.div.restartDiv = true;
        };
        if(div != 'userDiv'){
            this.div.userDiv = true;
        };
        if(div != 'supplementDiv'){
            this.div.supplementDiv = true;
        };
        if(div != 'attachmentDiv'){
            this.div.attachmentDiv = true;
        };
    };

    this.no = function(){
        var datetime = (new Date()).getTime().toString();
        var executer = this.executers[0];

        var close_Date_time = datetime;

        var msg = this.formData.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

        var comment = {
            processId:this.id,
            closeDatetime: close_Date_time,
            id:datetime,
            type:'0',
            message:'驳回：' + msg,
            createDatetime:executer.createDatetime,
            completeDatetime:datetime,
            "userId":$scope.loginUser.userId,
            "userName":$scope.loginUser.userName,
            "department":$scope.loginUser.department
        };

        var jdata = 'mydata='+JSON.stringify(comment);
        saveData('/process-no',$http,$templateCache,jdata);

        this.comments.splice(0,0,comment);
        this.formData = "";
        this.closeDatetime = close_Date_time;
        this.refreshToolbar();
        this.showDiv('noDiv');
    };

    this.yes = function(){
        var datetime = (new Date()).getTime().toString();
        var executer = this.executers[0];
        var createDatetime = executer.createDatetime;
        var executerId = executer.userId;

        this.executers.splice(0,1);
        var close_Date_time = '';
        if(this.hasCompleted()){
            close_Date_time = datetime;
            this.closeDatetime = datetime;
        }

        //alert('close_Date_time:' + close_Date_time);

        var msg = this.formData.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

        var comment = {
            processId:this.id,
            closeDatetime: close_Date_time,
            executerId:executerId,
            id:datetime,
            type:'0',
            message:'同意并通过：' + msg,
            createDatetime:createDatetime,
            completeDatetime:datetime,
            "userId":$scope.loginUser.userId,
            "userName":$scope.loginUser.userName,
            "department":$scope.loginUser.department
        };

        var jdata = 'mydata='+JSON.stringify(comment);
        saveData('/process-yes',$http,$templateCache,jdata);

        this.comments.splice(0,0,comment);
        this.formData = "";
        this.refreshToolbar();
        this.showDiv('yesDiv');
    };


    this.supplement = function(){
        var datetime = (new Date()).getTime().toString();

        var createDatetime = this.getAdviseCreateDatetime();

        var msg = this.formData.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

        var comment = {
            processId:this.id,
            id:datetime,
            type:'2',
            message:msg,
            createDatetime:createDatetime=="" ? datetime : createDatetime,
            completeDatetime:datetime,
            "userId":$scope.loginUser.userId,
            "userName":$scope.loginUser.userName,
            "department":$scope.loginUser.department
        };

        var jdata = 'mydata='+JSON.stringify(comment);

        saveData('/process-supplement',$http,$templateCache,jdata);

        this.comments.splice(0,0,comment);
        this.rebuildAdvisers();
        this.formData = "";
        this.refreshToolbar();
        this.showDiv('supplementDiv');
    };


    this.addExecuter = function(index){
        var datetime = (new Date()).getTime().toString();
        var user = $scope.users.list[index];
        var executer = {
            id: datetime,
            userId:user.userId,
            userName:user.userName,
            department:user.department,
            createDatetime: datetime
        };
        $scope.users.list.splice(index,1);
        this.executers.push(executer);

        executer.add = true;
        executer.processId = this.id;
        var jdata = 'mydata='+JSON.stringify(executer);
        saveData('/process-executer',$http,$templateCache,jdata);

    }

    this.delExecuter = function(index){
        var executer = this.executers[index];
        var user = {
            userId:executer.userId,
            userName:executer.userName,
            department:executer.department
        };
        $scope.users.list.push(user);

        this.executers.splice(index,1);

        executer.add = false;
        executer.processId = this.id;
        //alert(executer.id);
        var jdata = 'mydata='+JSON.stringify(executer);
        saveData('/process-executer',$http,$templateCache,jdata);
    }

    this.addAdviser = function(index){
        var datetime = (new Date()).getTime().toString();
        var user = $scope.users.list[index];
        var adviser = {
            id:datetime,
            userId:user.userId,
            userName:user.userName,
            department:user.department,
            createDatetime: datetime
        };

        $scope.users.list.splice(index,1);

        this.advisers.push(adviser);

        adviser.add = true;
        adviser.processId = this.id;
        var jdata = 'mydata='+JSON.stringify(adviser);
        saveData('/process-adviser',$http,$templateCache,jdata);

    }

    this.delAdviser = function(index){
        var adviser = this.advisers[index];
        var user = {
            userId:adviser.userId,
            userName:adviser.userName,
            department:adviser.department
        };

        this.advisers.splice(index,1);
        $scope.users.list.push(adviser);

        adviser.add = false;
        adviser.processId = this.id;
        var jdata = 'mydata='+JSON.stringify(adviser);
        saveData('/process-adviser',$http,$templateCache,jdata);
    }

    this.stop = function(){
        var datetime = (new Date()).getTime().toString();
        var msg = this.formData.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

        var comment = {
            processId:this.id,
            id:datetime,
            type:'0',
            message:'终止流程：' + msg,
            completeDatetime:datetime,
            "userId":$scope.loginUser.userId,
            "userName":$scope.loginUser.userName,
            "department":$scope.loginUser.department
        };

        var jdata = 'mydata=' + JSON.stringify(comment);
        saveData('/process-stop',$http,$templateCache,jdata);

        this.comments.splice(0,0,comment);
        this.formData = "";
        this.stopDatetime = datetime;
        this.refreshToolbar();
        this.showDiv('stopDiv');
    }

    this.restart = function(){
        var datetime = (new Date()).getTime().toString();
        var msg = this.formData.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

        var comment = {
            processId:this.id,
            id:datetime,
            type:'0',
            message:'重启流程：' + msg,
            completeDatetime:datetime,
            "userId":$scope.loginUser.userId,
            "userName":$scope.loginUser.userName,
            "department":$scope.loginUser.department
        };

        var jdata = 'mydata=' + JSON.stringify(comment);
        saveData('/process-restart',$http,$templateCache,jdata);

        this.comments.splice(0,0,comment);
        this.formData = "";
        this.stopDatetime = '';
        this.closeDatetime = '';
        this.refreshToolbar();
        this.showDiv('restartDiv');
    }
}