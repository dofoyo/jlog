'use strict';

/* jasmine specs for controllers go here */

describe('controllers', function(){
  beforeEach(module('myApp.controllers'));


  it('should ....', inject(function($controller) {
    //spec body
    var myCtrl1 = $controller('MyCtrl1', { $scope: {} });
    expect(myCtrl1).toBeDefined();
  }));

  it('should ....', inject(function($controller) {
    //spec body
    var myCtrl2 = $controller('MyCtrl2', { $scope: {} });
    expect(myCtrl2).toBeDefined();
  }));
});


describe('tlog controllers', function() {

    beforeEach(function(){
        this.addMatchers({
            toEqualData: function(expected) {
                return angular.equals(this.actual, expected);
            }
        });
    });

    beforeEach(module('myApp.logServices'));

    describe('LogCtrl', function(){
        var scope, ctrl, $httpBackend;
        beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
            $httpBackend = _$httpBackend_;
            $httpBackend.expectGET('log/log_resource/logs.json').respond([{id: '0001'}, {id: '0002'}]);
            scope = $rootScope.$new();
            ctrl = $controller(LogCtrl, {$scope: scope});
        }));

        it('should create "logs" model with 2 logs fetched from xhr', function() {
            //expect(scope.logs).toEqual([]);
            $httpBackend.flush();
            expect(scope.logs).toEqualData([{id: '0001'}, {id: '0002'}]);
        });

    });
});
