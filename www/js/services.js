	TharrosApp.constant('DB_CONFIG', {
		name: 'sardinia_db',
		tables: [
			{
				name: 'sites',
				columns: [
					{name: 'id', type: 'integer primary key'},
					{name: 'cat', type: 'varchar(50)'},
					{name: 'image', type: 'varchar(50)'},
					{name: 'place', type: 'varchar(150)'}, 
					{name: 'prov', type: 'varchar(2)'},
					{name: 'name', type: 'varchar(50)'},
					//{name: 'gallery', type: 'integer'},
					//{name: 'sites', type: 'integer'},
					{name: 'coordGlng', type: 'float(8,5)'},
					{name: 'coordGlat', type: 'float(8,5)'},
					{name: 'cos_lat', type: 'float(17,15)'},
					{name: 'sin_lat', type: 'float(17,15)'},
					{name: 'cos_lng', type: 'float(17,15)'},
					{name: 'sin_lng', type: 'float(17,15)'},
					{name: 'description', type: 'longtext'},
					{name: 'info', type: 'longtext'}
					// add fields gallery, sites, icon
				]
			},
			{
				name: 'mystate',
				columns: [
					{name: 'id', type: 'integer primary key'},
					{name: 'lastupdate', type: 'datetime'},
					{name: 'lastcheck', type: 'datetime'},
					{name: 'version', type: 'varchar(10)'}
				]
			}
		]
	});
	
	TharrosApp.factory('appdata', ['$http',function($http) {
		var self = this;
		
		self.getdata = function(language,url,module,id,auth,thisapp ) {
			var uri = url+'api/website/'+language+'/'+module+'/'+id ; 
			// url part variable from config
			return $http({
				method: 'GET',
				headers: ({'Content-Type':'application/x-www-form-urlencoded','X-Authorization':'Basic '+auth+'!','Domain':thisapp}),
				url: uri
			}).then(function successCallback(response) {
				// this callback will be called asynchronously
				console.log("success check");
				return response.data ;
			}, function errorCallback(response) {
				// called asynchronously if an error occurs
				console.log("failure check");
				//console.log(response.data);
				return ;
			});
		};
		
		return self;
	}]);
	
	TharrosApp.factory('myMap', ['myVars',function(myVars) {
		var self = this;
		
		self.setmap = function(zoom,point){
			myVars.mapzoom = zoom;
			myVars.mappoint = point;
		};
		
		return self;
	}]);	
	
	TharrosApp.factory('db', function($q, DB_CONFIG) {
	    var self = this;
	    self.db = null;
		
	    self.init = function() {
	        self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database', 1000000);
			
			//var sqldrop = 'DROP TABLE mystate';
			//self.query(sqldrop);
			//console.log('mystate deleted');
			
			//var sqldrop = 'DROP TABLE sites';
			//self.query(sqldrop);
			//console.log('sites deleted');
			
			angular.forEach(DB_CONFIG.tables, function(table) {
	            var columns = [];
	
	            angular.forEach(table.columns, function(column) {
	                columns.push(column.name + ' ' + column.type);
	            });
					
				var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
	            self.query(query);
	            console.log('Table ' + table.name + ' initialized');
	        });
		};
	
	    self.query = function(query, bindings) {
	        bindings = typeof bindings !== 'undefined' ? bindings : [];
	        var deferred = $q.defer();
	
	        self.db.transaction(function(transaction) {
	            transaction.executeSql(query, bindings, function(transaction, result) {
	                deferred.resolve(result);
	            }, function(transaction, error) {
					console.log(error.message);
	                deferred.reject(error);
	            });
	        });
	
	        return deferred.promise;
	    };
	
	    self.fetchAll = function(result) {
	        var output = [];
	
	        for (var i = 0; i < result.rows.length; i++) {
	            output.push(result.rows.item(i));
	        }
	        
	        return output;
	    };
	
	    self.fetch = function(result) {
	        return result.rows.item(0);
	    };
		
		return self;
	});
	
	TharrosApp.factory('MyItems', function(db) {
	    var self = this;
	    
	    self.all = function() {
			return db.query('SELECT * FROM sites')
	        .then(function(result){
	            return db.fetchAll(result);
	        });
	    };
		
		self.nearest = function(lat,lon) { 
			cur_cos_lat = Math.cos(lat * Math.PI / 180);
			cur_sin_lat = Math.sin(lat * Math.PI / 180);
			cur_cos_lng = Math.cos(lon * Math.PI / 180);
			cur_sin_lng = Math.sin(lon * Math.PI / 180);
			// nearest to current location
	        return db.query('SELECT id,cat,image,place,prov,name,coordGlng,coordGlat,sin_lat,cos_lat,sin_lng,cos_lng,' +
			' (sin_lat * ? + cos_lat * ? * (sin_lng * ? + cos_lng * ?)) AS "distance_acos"' +  
			' FROM sites ORDER BY "distance_acos" DESC' +
			' ',[cur_sin_lat,cur_cos_lat,cur_sin_lng,cur_cos_lng] ) //LIMIT 15
			.then(function(result){
				return db.fetchAll(result);
	        });
	    };
	    
	    self.getById = function(id,lat,lon) {
			cur_cos_lat = Math.cos(lat * Math.PI / 180);
			cur_sin_lat = Math.sin(lat * Math.PI / 180);
			cur_cos_lng = Math.cos(lon * Math.PI / 180);
			cur_sin_lng = Math.sin(lon * Math.PI / 180);
	        return db.query('SELECT *,(sin_lat * ? + cos_lat * ? * (sin_lng * ? + cos_lng * ?)) AS "distance_acos" FROM sites WHERE id = ?', [cur_sin_lat,cur_cos_lat,cur_sin_lng,cur_cos_lng,id])
	        .then(function(result){
	            return db.fetch(result);
	        });
	    };
		
		self.checkstate = function($http, $filter, $translate, lang) {
			console.log("db version checked: "+db.db.version);
			return db.query('SELECT lastupdate,lastcheck FROM mystate WHERE id=1')
	        .then(function(result){
				console.log('Result rows lenght :'+result.rows.length);
				if(result.rows.length > 0){
					curstate = db.fetch(result);
					runupdate = false;
					var lastcheckdate = new Date(curstate.lastcheck) ;
					var newcheckdate = new Date();
					lastcheckdate.setDate(lastcheckdate.getDate() + 1)
					if (lastcheckdate.getTime() < newcheckdate.getTime()){ runupdate = true;}
					console.log('next update time: ' + lastcheckdate + ' current check time: ' + newcheckdate + 'last update time ' + curstate.lastupdate);
				}else{				
					console.log('empty result');
					curstate = '' ;
					runupdate = true;
				}
				console.log('Will run update: ' + runupdate)
				// if runupdate else update lastcheck only with current datetime
				if(runupdate){
					return $http({
						method: 'POST',
						crossDomain: true,
						dataType: "json",
						data: { reg: "xN4p!t92Zy", app: 2, state: curstate.lastupdate}, 
						url: 'https://www.tharros.info/checkapp.php'
					}).then(function successCallback(response) {
						// this callback will be called asynchronously
						console.log("success check " + response.data[0].update);
						// additional response data
						if (response.data[0].update === 0){
							// inform that update is running
							var mydate = new Date();
							var noCache = mydate.getTime();
							$http({
								method: 'POST',
								crossDomain: true,
								dataType: "json",
								data: { reg: "xN4p!t92Zy", lng: lang, cache: noCache},
								url: 'https://www.tharros.info/sitelist.php'
							}).then(function successCallback(response) {
								return self.updatelist(response.data,false).then(function(){
									// update mystate with current date
									console.log("success update");
									state = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
									console.log("date "+state);
									return self.changestate(state,state);
								});
							},function errorCallback(response) {
								console.log("failure update");
							});
							
						}else{
							var check = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
							console.log("No update needed. Update time changed to " + check);
							return self.changestate(curstate.lastupdate,check);
						}
					}, function errorCallback(response) {
						// called asynchronously if an error occurs
						console.log("failure check");
						return ;
					});
				}else{
					console.log('No update needed!');
					return ;
				}
	        });
		};
		
		self.changestate = function(state,check) {
	        return db.query('INSERT OR REPLACE INTO mystate (id,lastupdate,lastcheck,version) VALUES (?,?,?,?)',[1,state,check,"1.2.2"])
	        .then(function(result){
				console.log('Version 1.2.2 updated to ' + state + 'last check: ' + check);
	        });
	    };
		
		self.updatelist = function(sites,dbupdatescheme){
			console.log("Update database scheme: "+dbupdatescheme);
			l = sites.length;
			if(dbupdatescheme == true){
				// add code
				console.log("db scheme will be updated");
			}else{
				console.log("db scheme will not be updated");
			}
			var sql = "INSERT OR REPLACE INTO sites " +
				"(id,cat,image,place,prov,name,coordGlng,coordGlat,sin_lat,cos_lat,sin_lng,cos_lng,description,info) " +
				"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			for (var i = 0; i < l; i++) {
				e = sites[i];
				db.query(sql, [e.id, e.cat, e.image, e.place, e.prov, e.name, e.coordGlng, e.coordGlat, e.sin_lat, e.cos_lat, e.sin_lng, e.cos_lng, e.description,e.info]);
			};
			
			//	var sql = "INSERT OR REPLACE INTO sites " +
			//			"(id,cat,image,place,prov,name,coordGlng,coordGlat,sin_lat,cos_lat,sin_lng,cos_lng,description,info) " +
			//			"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			//	for (var i = 0; i < l; i++) {
			//		e = sites[i];
			//		db.query(sql, [e.id, e.cat, e.image, e.place, e.prov, e.name, 0, 0, e.coordGlng, e.coordGlat, e.sin_lat, e.cos_lat, e.sin_lng, e.cos_lng, e.description,e.info]);
			//	};
			//	var sql = "INSERT OR REPLACE INTO sites " +
			//	        "(id,cat,image,place,prov,name,gallery,sites,coordGlng,coordGlat,sin_lat,cos_lat,sin_lng,cos_lng,description,info) " +
			//	        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			//	for (var i = 0; i < l; i++) {
			//		e = sites[i];
			//		db.query(sql, [e.id, e.cat, e.image, e.place, e.prov, e.name, e.gallery, e.sites, e.coordGlng, e.coordGlat, e.sin_lat, e.cos_lat, e.sin_lng, e.cos_lng, e.description,e.info]);
			//	};
			
			return self.all();
		};
	    
	    return self;
	});