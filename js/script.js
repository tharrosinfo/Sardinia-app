// script.js

    // create the module and name it TharrosApp
    var TharrosApp = angular.module('TharrosApp', ['ngRoute','ui.bootstrap']);
	
	// configure our routes
    TharrosApp.config(function($routeProvider) {
        $routeProvider

            // route for the home page
            .when('/', {
                templateUrl : 'pages/home.html',
                controller  : 'mainController'
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
    TharrosApp.controller('mainController', function($scope, MyItems) {
        // Get all the documents
		$scope.sites = [];
		MyItems.addSample().then(function(message){
			$scope.message = "Updated";
		});
		MyItems.all().then(function(sites){
			$scope.sites = sites;
			$scope.message = "Update list";
		});
    });

    TharrosApp.controller('aboutController', function($scope) {
        $scope.message = 'Look! I am an about page.';
    });

    TharrosApp.controller('contactController', function($scope) {
        $scope.message = 'Contact us! JK. This is just a demo.';
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
	
	
	
	
   