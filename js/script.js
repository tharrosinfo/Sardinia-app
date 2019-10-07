// script.js

    // create the module and name it TharrosApp
    var TharrosApp = angular.module('TharrosApp', ['ngRoute','ui.bootstrap','ngGeolocation','angular-confirm','ngSanitize','pascalprecht.translate','ngMap'], function($httpProvider) {
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
            .when('/map', {
                templateUrl : 'pages/map.html',
                controller  : 'mapController as vm'
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
			MAP: 'Map',
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
			NOK: 'No',
			FILTER: 'Filter by'
		})
		.translations('nl', {
			SITES: 'Sites en Musea',
			MAP: 'Kaart',
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
			NOK: 'Nee',
			FILTER: 'Filter op'
		})
		.translations('it', {
			SITES: 'Siti e Eventi',
			MAP: 'Mappa',
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
			NOK: 'No',
			FILTER: 'Filtra su'
		});
		$translateProvider.preferredLanguage('en');
		$translateProvider.useSanitizeValueStrategy('escape');
	});
	
	// create the controller and inject Angular's $scope
    TharrosApp.controller('mainController', function($geolocation, $rootScope, $scope, $http, $filter, $confirm, $translate, $location, MyItems, myVars) {
		$rootScope.siteinfo = false;
		$scope.dataLoaded = false ;
		$translate.use((myVars.lang).split("-")[0]); //(myVars.lang).split("-")[0]
		MyItems.checkstate($http,$filter,$confirm,$translate,myVars.lang).then(function() {
			$geolocation.getCurrentPosition({
				timeout: 60000
			}).then(function(position) {
				$scope.coords = position.coords;
				$scope.mylat = $scope.coords.latitude;
				$scope.mylon = $scope.coords.longitude;
				MyItems.nearest($scope.mylat,$scope.mylon).then(function(sites){
					$scope.sites = sites;
					$scope.distance = function(distacos) { return (Math.acos(distacos) * 6371).toFixed(2)} ;
					$scope.go = function ( path ) {$location.path( path );};
					$scope.dataLoaded = true;
				});
			},function(error){
				console.log("Geo location error "+error.error.message);
				// default values Cagliari
				$scope.mylat = 39.21333;
				$scope.mylon = 9.11223;
				MyItems.nearest($scope.mylat,$scope.mylon).then(function(sites){
					$scope.sites = sites;
					$scope.distance = function(distacos) { return (Math.acos(distacos) * 6371).toFixed(2)} ;
					$scope.go = function ( path ) {$location.path( path );};
					$scope.dataLoaded = true;
				});
			});
		});
	});
	
	TharrosApp.controller('detailController', function($geolocation,$sce,$rootScope,$scope, MyItems, myVars, $routeParams) {
		$rootScope.siteinfo = true;
		$scope.sites = [];
		// geolocation
		$geolocation.getCurrentPosition({
			timeout: 60000
		}).then(function(position) {
			$scope.coords = position.coords;
			$scope.mylat = $scope.coords.latitude;
			$scope.mylon = $scope.coords.longitude;
			MyItems.getById($routeParams.id,$scope.mylat,$scope.mylon).then(function(sites){
				$scope.sites = sites;
				$scope.siteCoords = $scope.sites.coordGlat+','+$scope.sites.coordGlng;
				$scope.siteLang = myVars.lang;
				$scope.infohtml = $sce.trustAsHtml(sites.info) ;
				$scope.distance = function(distacos) { return (Math.acos(distacos) * 6371).toFixed(2)} ;
			});
		});
	});
	
	TharrosApp.controller('mapController', function($compile,NgMap,$geolocation,$sce,$rootScope,$scope, MyItems, myVars, $routeParams,mapapi) {
		var vm = this;
		$scope.sites = [];
		NgMap.getMap().then(function(map) {
			vm.map = map;
			MyItems.all().then(function(sites){
				$scope.sites = sites;
				vm.sites = sites;
				$scope.siteLang = myVars.lang;
			});
		});
		vm.googleMapsUrl = mapapi.init(window.device); 
		vm.template = {
			cached: 'info.html',
		};
		vm.showSite = function(evt, siteId) {
			vm.site = vm.sites[siteId];
			vm.map.showInfoWindow('cached', this);
		};
	});

    TharrosApp.controller('aboutController', function($scope, myVars) {
		$scope.shownl = false;
		$scope.showit = false;
		$scope.showen = false;
		if((myVars.lang).split("-")[0] == 'nl'){
			$scope.shownl = true;
		}else if ((myVars.lang).split("-")[0] == 'it'){
			$scope.showit = true;
		}else{
			$scope.showen = true;
		}
	});

    TharrosApp.controller('contactController', function($scope, myVars) {
        $scope.shownl = false;
		$scope.showit = false;
		$scope.showen = false;
		if((myVars.lang).split("-")[0] == 'nl'){
			$scope.shownl = true;
		}else if ((myVars.lang).split("-")[0] == 'it'){
			$scope.showit = true;
		}else{
			$scope.showen = true;
		}
	});
	
	TharrosApp.controller("indexController", function($scope, $rootScope, myVars) {
		
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
	
	TharrosApp.filter("convertDecimalToMin",function() {
		return function(nlatlng, lang) {
			var sDeg;
			if(nlatlng != undefined){
				/* 
					Input:  Lat and Lng 
					Output: String with Latitude & Longitude in Degree Minute Second 
					Compass format 
					strLng defined as global var but you can also use language detection instead
				*/
				var partsOfStr = nlatlng.toString().split(','); 
				if (lang == "nl"){
				   strNorth = "NB" ;
				   strSouth = "ZB" ;
				   strEast = "OL" ;
				   strWest = "WL" ;
				}else if (lang == "it"){
				   strNorth = "N" ;
				   strSouth = "S" ;
				   strEast = "E" ;
				   strWest = "O" ;
				}else{
				   strNorth = "N" ;
				   strSouth = "S" ;
				   strEast = "E" ;
				   strWest = "W" ;
				}
				var lat = parseFloat(partsOfStr[0]); 
				var lng = parseFloat(partsOfStr[1]); 
				var dirLat; 
				var dirLng; 
				if (lat > 0) { 
					dirLat = strNorth; 
				}else { 
					dirLat = strSouth; 
					lat = lat * -1; 
				} 
				if (lng > 0) { 
					dirLng = strEast; 
				}else { 
					dirLng = strWest; 
					lng = lng * -1; 
				} 

				var degLat = parseInt(lat); 
				var degLng = parseInt(lng); 
				var decLat = lat - degLat; 
				var decLng = lng - degLng; 
				var dmnLat = 60 * decLat; 
				var dmnLng = 60 * decLng; 
				var minLat = parseInt(dmnLat);
				var minLng = parseInt(dmnLng);
				var dscLat = dmnLat - minLat; 
				var dscLng = dmnLng - minLng; 
				var secLat = parseInt(60 * dscLat);
				var secLng = parseInt(60 * dscLng);
				var sDeg = degLat + '\xB0' + minLat + "'" + secLat + '" ' + dirLat + ", " + degLng + '\xB0' + minLng + "'" + secLng + '" ' + dirLng; 
			}
			return sDeg; 
		}
		
	});
	