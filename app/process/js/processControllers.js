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
    function($scope, $http, $templateCache, $window,$fileUploader,CommentType,uuid,Processes){
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
                var params = {
                    userName:this.keyWord
                };
                $http.get('/users',{params:params}).
                    success(function(data,status,headers,config) {
                        //alert("get users success!");
                        $scope.users.list = data;
                    }).
                    error(function(data,status,headers,config){
                        alert("get users error!");
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
                    saveData('/process',$http,$templateCache,jdata);

                    this.list.splice(0,0,new Process(process,$scope,$http,$templateCache));

                    this.formData.data1 = '';
                    this.formData.data2 = '';
                }else{
                    alert('请先登录');
                }
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

                    if(this.createDiv && currentDiv!=div){
                        $scope.processes.empty();
                        $scope.processes.params.type = '1'  //我的流程
                        $scope.processes.refresh();
                    }

                    if(this.todoDiv && currentDiv!=div){
                        $scope.processes.empty();
                        $scope.processes.params.type = '2'  //todo的默认为待处理
                        $scope.processes.refresh();
                    }

                    if(this.doneDiv && currentDiv!=div){
                        $scope.processes.empty();
                        $scope.processes.params.type = '6'  //done的默认为未完成
                        $scope.processes.refresh();
                    }
                }
            }
        };

        $scope.getAdvises = function(){
            alert('getAdvises, processType=' + $scope.pageState.processType);
        }

        $scope.getReads = function(){
            alert('getReads, processType=' + $scope.pageState.processType);
        }

        $scope.getCompleted = function(){
            alert('getComplete, processType=' + $scope.pageState.processType);
        }

        $scope.getNotCompleted = function(){
            alert('getNotComplete, processType=' + $scope.pageState.processType);
        }

        $scope.getStoped = function(){
            alert('getStoped, processType=' + $scope.pageState.processType);
        }

        $scope.find = function(){
            alert('find by key ' + $scope.pageState.keyWord);
            /*
             $scope.processes = new Array();
             $scope.pageState.offset = 0;
             $scope.getProcesses();
             */

        }

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
    this.creator = obj.creator;
    this.comments = obj.comments;
    this.readers = obj.readers;
    this.advisers = obj.advisers;
    this.executers = obj.executers;

    this.formData = '';
    this.toolbar = {
        yesBtn:false,
        noBtn:false,
        userBtn:false,
        supplementBtn:false,
        attachmentBtn:false,
        stopBtn:false,
        restartBtn:false
    };
    this.div = {
        show:true,
        yesDiv:true,
        noDiv:true,
        userDiv:true,
        supplementDiv:true,
        attachmentDiv:true
    };

    this.isCreator= function(){
        return this.creator.id==$scope.loginUser.userId ? true : false;
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
        for(var i=0; i<this.executers.length; i++){
            var executer = this.executers[i];
            if($scope.loginUser.userId == executer.userId
                && executer.createDatetime.length != 0
                && executer.completeDatetime.length == 0
                ){
                return true;
            }
        }
        return false;
    };

    this.authorIndex = function(){
        for(var i=0; i<this.executers.length; i++){
            var executer = this.executers[i];
            if($scope.loginUser.userId == executer.userId
                && executer.createDatetime.length != 0
                && executer.completeDatetime.length == 0
                ){
                return i;
            }
        }
        return -1;
    };

    this.hasStoped = function(){
        return this.stopDatetime.length!=0 ? true : false;
    };

    this.hasClosed = function(){
        return this.closeDatetime.length!=0 ? true : false;
    };

    this.hasCompleted = function(){
        for(var i=0; i<this.executers.length; i++){
            var executer = this.executers[i];
            if(executer.completeDatetime.length == 0){
                return false;
            }
        }
        return true;
    };


    this.refreshToolbar = function(){
        var iscr = this.isCreator();
        var isau = this.isAuthor();
        var isex = this.isExecuter();
        var isad = this.isAdviser();
        var hass = this.hasStoped();
        var hasc = this.hasClosed();
        var hasco = this.hasCompleted();


        // 未完成、未终止的流程，发起人和当前处理人都可终止流程
        this.toolbar.stopBtn = (iscr || isau) && !hass && !hasc;

        // 已关闭、已终止的流程，发起人和处理人都能重启流程
        this.toolbar.restartBtn = (hass || hasc) && (isex || iscr);

        //未关闭、未终止的流程，参与人都可发言，即使是排在后面的处理人，也可先发言。发言并不影响流程的流向
        this.toolbar.supplementBtn = !hass && !hasc && (isex || isad || iscr);

        //未关闭、未终止的流程，参与人都可发附件，即使是排在后面的处理人，也可先发言。发言并不影响流程的流向
        this.toolbar.attachmentBtn = !hass && !hasc && (isex || isad || iscr);

        //未关闭、未终止的流程,发起人和当前处理人可拉会签人和处理人进来
        this.toolbar.userBtn = !hass && !hasc && (isau || iscr);

        //未关闭、未终止的流程，当前的处理人决定流程走向
        this.toolbar.yesBtn = !hass && !hasc && isau;

        //未关闭、未终止的流程，当前的处理人决定流程走向
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

    this.yes = function(){
        var i = this.authorIndex();
        if(i != -1){
            var datetime = (new Date()).getTime().toString();
            var executer = this.executers[i];
            executer.completeDatetime = datetime;

            var close_Date_time = '';
            if(this.hasCompleted()){
                close_Date_time = datetime;
                this.closeDatetime = datetime;
            }

            var msg = this.formData.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

            var comment = {
                processId:this.id,
                closeDatetime: close_Date_time,
                executerId:executer.id,
                id:datetime,
                type:'0',
                message:'同意并通过：' + msg,
                createDatetime:executer.createDatetime,
                completeDatetime:datetime,
                creator:{
                    "id":$scope.loginUser.userId,
                    "name":$scope.loginUser.userName,
                    "department":$scope.loginUser.department
                }
            };

            var jdata = 'mydata='+JSON.stringify(comment);
            saveData('/process-yes',$http,$templateCache,jdata);

            this.comments.splice(0,0,comment);
            this.formData = "";
            this.refreshToolbar();
        }
    };


    this.supplement = function(){
        var datetime = (new Date()).getTime().toString();

        var msg = this.formData.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

        var comment = {
            processId:this.id,
            id:datetime,
            type:'2',
            message:msg,
            createDatetime:datetime,
            completeDatetime:datetime,
            creator:{
                "id":$scope.loginUser.userId,
                "name":$scope.loginUser.userName,
                "department":$scope.loginUser.department
            }
        };

        var jdata = 'mydata='+JSON.stringify(comment);

        saveData('/process-comment',$http,$templateCache,jdata);

        this.comments.splice(0,0,comment);
        this.formData = "";
    };


    this.addExecuter = function(index){
        var datetime = (new Date()).getTime().toString();
        var user = $scope.users.list[index];
        var executer = {
            id: datetime,
            userId:user.userId,
            userName:user.userName,
            department:user.department,
            createDatetime: datetime,
            completeDatetime:''
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
            createDatetime: datetime,
            completeDatetime:''
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
        this.stopDatetime = (new Date()).getTime().toString();
        this.refreshToolbar();
        var data = {};
        data.processId = this.id;
        var jdata = 'mydata=' + JSON.stringify(data);
        saveData('/process-stop',$http,$templateCache,jdata);
    }

    this.restart = function(){
        this.stopDatetime = '';
        this.closeDatetime = '';
        this.refreshToolbar();
        var data = {};
        data.processId = this.id;
        var jdata = 'mydata=' + JSON.stringify(data);
        saveData('/process-restart',$http,$templateCache,jdata);
    }
}