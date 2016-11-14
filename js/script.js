// script.js

    // create the module and name it TharrosApp
    var TharrosApp = angular.module('TharrosApp', ['ngRoute','ui.bootstrap','ngGeolocation','angular-confirm','ngSanitize','pascalprecht.translate'], function($httpProvider) {
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
	
	TharrosApp.value('myVars', {
		lang:(navigator.language) ? navigator.language : navigator.userLanguage
		//lang: 'it' // en , it , nl
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
	
	// configuration for languages
	TharrosApp.config(function($translateProvider) {
		$translateProvider.translations('en', {
			SITES: 'Sites and Events',
			HELP: 'Help/About',
			CONTACT: 'Contact',
			LIST: 'A list of Sites and Events to visit',
			INFO: 'Detailed information',
			ABOUT: 'About and Help on this app',
			CONTACT_TEXT: 'How to contact us',
			VISIT: 'Visit the website of Tharros.info',
			DISTANCE: 'Distance',
			UPDATE_MESSAGE: 'Do you want to update the list now?',
			UPDATE_TITLE: 'Update',
			NOK: 'No'
		})
		.translations('nl', {
			SITES: 'Sites en Musea',
			HELP: 'Help/Over',
			CONTACT: 'Contact',
			LIST: 'Lijst van bezienswaardigheden en evenementen',
			INFO: 'Detail informatie',
			ABOUT: 'Over de app en help bij deze app',
			CONTACT_TEXT: 'Contact opnemen met ons',
			VISIT: 'Bezoek de website van Tharros.info',
			DISTANCE: 'Afstand',
			UPDATE_MESSAGE: 'Wil je nu de lijst bijwerken?',
			UPDATE_TITLE: 'Bijwerken',
			NOK: 'Nee'
		})
		.translations('it', {
			SITES: 'Siti e Eventi',
			HELP: 'Aiuto/Info',
			CONTACT: 'Contatta',
			LIST: 'Elenco dei siti e degli eventi da visitare',
			INFO: 'Informazioni dettagliate',
			ABOUT: 'Informazioni su e Aiuto per l\'app',
			CONTACT_TEXT: 'Come contattarci',
			VISIT: 'Visita il sito web di Tharros.info',
			DISTANCE: 'Distanza',
			UPDATE_MESSAGE: 'Vuoi aggiornare la lista adesso?',
			UPDATE_TITLE: 'Aggiornare',
			NOK: 'No'
		});
		$translateProvider.preferredLanguage('en');
		$translateProvider.useSanitizeValueStrategy('escape');
	});
	
	// create the controller and inject Angular's $scope
    TharrosApp.controller('mainController', function($geolocation, $scope, $http, $filter, $confirm, $translate, MyItems, myVars) {
		console.log(myVars.lang);
		$scope.dataLoaded = false ;
		$translate.use(myVars.lang);
		MyItems.checkstate($http,$filter,$confirm,$translate,myVars.lang).then(function() {
			$geolocation.getCurrentPosition({
				timeout: 60000
			}).then(function(position) {
				$scope.coords = position.coords;
				$scope.mylat = $scope.coords.latitude;
				$scope.mylon = $scope.coords.longitude;
				console.log("My coords "+ $scope.mylat + " , " + $scope.mylon);
				MyItems.nearest($scope.mylat,$scope.mylon).then(function(sites){
					$scope.sites = sites;
					$scope.distance = function(distacos) { return (Math.acos(distacos) * 6371).toFixed(2)} ;
					$scope.dataLoaded = true;
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
			});
		});
    });

    TharrosApp.controller('aboutController', function($scope, myVars) {
		$scope.shownl = false;
		$scope.showit = false;
		$scope.showen = false;
		if(myVars.lang == 'nl'){
			$scope.shownl = true;
		}else if (myVars.lang == 'it'){
			$scope.showit = true;
		}else{
			$scope.showen = true;
		}
	});

    TharrosApp.controller('contactController', function($scope, myVars) {
        $scope.shownl = false;
		$scope.showit = false;
		$scope.showen = false;
		if(myVars.lang == 'nl'){
			$scope.shownl = true;
		}else if (myVars.lang == 'it'){
			$scope.showit = true;
		}else{
			$scope.showen = true;
		}
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
	
	
	
	
   