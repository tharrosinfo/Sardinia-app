// script.js

    // create the module and name it TharrosApp
    var TharrosApp = angular.module('TharrosApp', ['ngRoute','ui.bootstrap','ngGeolocation','angular-confirm'], function($httpProvider) {
		  // Use x-www-form-urlencoded Content-Type
		  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

		  /**
		   * The workhorse; converts an object to x-www-form-urlencoded serialization.
		   * @param {Object} obj
		   * @return {String}
		   */ 
		  var param = function(obj) {
			var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

			for(name in obj) {
			  value = obj[name];

			  if(value instanceof Array) {
				for(i=0; i<value.length; ++i) {
				  subValue = value[i];
				  fullSubName = name + '[' + i + ']';
				  innerObj = {};
				  innerObj[fullSubName] = subValue;
				  query += param(innerObj) + '&';
				}
			  }
			  else if(value instanceof Object) {
				for(subName in value) {
				  subValue = value[subName];
				  fullSubName = name + '[' + subName + ']';
				  innerObj = {};
				  innerObj[fullSubName] = subValue;
				  query += param(innerObj) + '&';
				}
			  }
			  else if(value !== undefined && value !== null)
				query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
			}

			return query.length ? query.substr(0, query.length - 1) : query;
		  };

		  // Override $http service's default transformRequest
		  $httpProvider.defaults.transformRequest = [function(data) {
			return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
		  }];
	});
	
	
	// configure our routes
    TharrosApp.config(function($routeProvider) {
        $routeProvider

            // route for the home page
            .when('/', {
                templateUrl : 'pages/home.html',
                controller  : 'mainController'
            })
			
			// route for the sites details page
			.when('/detail/:id', {
				templateUrl : 'pages/sites-detail.html',
                controller  : 'detailController'
			})
            // route for the about page
            .when('/about', {
                templateUrl : 'pages/about.html',
                controller  : 'aboutController'
            })

            // route for the contact page
            .when('/contact', {
                templateUrl : 'pages/contact.html',
                controller  : 'contactController'
            });
    });
	
	// create the controller and inject Angular's $scope
    TharrosApp.controller('mainController', function($geolocation, $scope, $http, $filter, $confirm, MyItems) {
		MyItems.checkstate($http,$filter,$confirm).then(function() {
			$geolocation.getCurrentPosition({
				timeout: 60000
			}).then(function(position) {
				$scope.coords = position.coords;
				$scope.mylat = $scope.coords.latitude;
				$scope.mylon = $scope.coords.longitude;
				console.log("My coords "+ $scope.mylat + " , " + $scope.mylon);
						
				MyItems.nearest($scope.mylat,$scope.mylon).then(function(sites){
					$scope.sites = sites;
					$scope.message = "Overzichtslijst" ;
					$scope.distance = function(distacos) { return (Math.acos(distacos) * 6371).toFixed(2)} ;
				});
			});
		});
	});
	
	TharrosApp.controller('detailController', function($geolocation,$sce,$scope, MyItems, $routeParams) {
		$geolocation.getCurrentPosition({
			timeout: 60000
		}).then(function(position) {
			$scope.coords = position.coords;
			$scope.mylat = $scope.coords.latitude;
			$scope.mylon = $scope.coords.longitude;
			console.log("My coords "+ $scope.mylat + " , " + $scope.mylon);
			$scope.sites = [];
			MyItems.getById($routeParams.id).then(function(sites){
				$scope.sites = sites;
				$scope.infohtml = $sce.trustAsHtml(sites.info) ;
				//$scope.distance = function(distacos) { return (Math.acos(distacos) * 6371).toFixed(2)} ;
				$scope.message = "Informatie";
			});
		});
    });

    TharrosApp.controller('aboutController', function($scope) {
        $scope.message = 'Over de app en help bij de app';
    });

    TharrosApp.controller('contactController', function($scope) {
        $scope.message = 'Contact informatie';
    });
	
	TharrosApp.controller("indexController", function($scope, $rootScope) {
	    $scope.leftVisible = false;
	    $scope.rightVisible = false;
	
	    $scope.close = function() {
	        $scope.leftVisible = false;
	        $scope.rightVisible = false;
	    };
	
	    $scope.showLeft = function(e) {
	        $scope.leftVisible = true;
	        e.stopPropagation();
	    };
	
	    $scope.showRight = function(e) {
	        $scope.rightVisible = true;
	        e.stopPropagation();
	    }
	
	    $rootScope.$on("documentClicked", _close);
	    $rootScope.$on("escapePressed", _close);
	
	    function _close() {
	        $scope.$apply(function() {
	            $scope.close(); 
	        });
	    }
		
		
		
	});
	
		
	TharrosApp.run(function($rootScope) {
	    document.addEventListener("keyup", function(e) {
	        if (e.keyCode === 27)
	            $rootScope.$broadcast("escapePressed", e.target);
	    });
	
	    document.addEventListener("click", function(e) {
	        $rootScope.$broadcast("documentClicked", e.target);
	    });
	});
	
	TharrosApp.run(function($window, $rootScope) {
      $rootScope.online = navigator.onLine;
      $window.addEventListener("offline", function() {
        $rootScope.$apply(function() {
          $rootScope.online = false;
        });
      }, false);

      $window.addEventListener("online", function() {
        $rootScope.$apply(function() {
          $rootScope.online = true;
        });
      }, false);
	});
	
	TharrosApp.run(function(db) {
		db.init();
	});
	
	TharrosApp.directive("menu", function() {
	    return {
	        restrict: "E",
	        template: "<div ng-class='{ show: visible, left: alignment === \"left\", right: alignment === \"right\" }' ng-transclude></div>",
	        transclude: true,
	        scope: {
	            visible: "=",
	            alignment: "@"
	        }
	    };
	});
	
	TharrosApp.directive("menuItem", function() {
	     return {
	         restrict: "E",
	         template: "<div ng-click='navigate()' ng-transclude></div>",
	         transclude: true,
	         scope: {
	             hash: "@"
	         },
	         link: function($scope) {
	             $scope.navigate = function() {
	                 window.location.hash = $scope.hash;
	             }
	         }
	     }
	});
	
	
	
	
   