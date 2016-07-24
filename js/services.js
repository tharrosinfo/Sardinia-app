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
					{name: 'coordGlng', type: 'float(8,5)'},
					{name: 'coordGlat', type: 'float(8,5)'},
					{name: 'cos_lat', type: 'float(17,15)'},
					{name: 'sin_lat', type: 'float(17,15)'},
					{name: 'cos_lng', type: 'float(17,15)'},
					{name: 'sin_lng', type: 'float(17,15)'},
					{name: 'description', type: 'longtext'},
					{name: 'info', type: 'longtext'}
				]
			},
			{
				name: 'mystate',
				columns: [
					{name: 'id', type: 'integer primary key'},
					{name: 'lastupdate', type: 'datetime'},
					{name: 'version', type: 'varchar(10)'}
				]
			}
		]
	});
	
	TharrosApp.factory('db', function($q, DB_CONFIG) {
	    var self = this;
	    self.db = null;
	
	    self.init = function() {
	        self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database', -1);
			
			//var sqldrop = 'DROP TABLE mystate';
			//self.query(sqldrop);
			//console.log('mystate deleted');
	
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
				//for(var i = 0; i < result.rows.length; i++) {
					//console.log("in km " + Math.acos(result.rows.item(i).distance_acos) * 6371);
                    //console.log("SELECTED -> " + result.rows.item(i).id + " " + result.rows.item(i).distance_acos);
                //}
	            return db.fetchAll(result);
	        });
	    };
	    
	    self.getById = function(id) {
	        return db.query('SELECT * FROM sites WHERE id = ?', [id])
	        .then(function(result){
	            return db.fetch(result);
	        });
	    };
		
		self.checkstate = function($http,$filter,$confirm) {
			return db.query('SELECT lastupdate FROM mystate WHERE id=1')
	        .then(function(result){
				e = JSON.stringify(result, null, 4);
				console.log('Result rows lenght :'+result.rows.length);
				if(result.rows.length > 0){
					curstate = db.fetch(result);
					
				}else{				
					console.log('empty result');
					curstate = '' ;
				}
				return $http({
					method: 'POST',
					crossDomain: true,
					dataType: "json",
					data: { reg: "xN4p!t92Zy", app: 2, state: curstate.lastupdate},
					url: 'http://www.tharros.info/checkapp.php'
				}).then(function successCallback(response) {
					// this callback will be called asynchronously
					//e = JSON.stringify(response, null, 4)
					console.log("success check " + response.data[0].update);
					if (response.data[0].update === 0){
						// ask user if he wants to update
						$confirm({text: 'Wil je nu de lijst bijwerken?', title: 'Bijwerken', ok: 'Ja', cancel: 'Nee'}).then(function(){
							console.log("Update opdracht bevestigd");
						
							var mydate = new Date();
							var noCache = mydate.getTime();
							$http({
								method: 'POST',
								crossDomain: true,
								dataType: "json",
								data: { reg: "xN4p!t92Zy", cache: noCache},
								url: 'http://www.tharros.info/sitelist.php'
							}).then(function successCallback(response) {
								return self.update(response.data).then(function(){
									// update mystate with current date
									console.log("success update");
									state = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
									console.log("date "+state);
									self.changestate(state);
								});
							},function errorCallback(response) {
								console.log("failure update");
							});
						});
					}else{
						console.log("No update needed");
					}
					return response.data[0].update ;
				}, function errorCallback(response) {
					// called asynchronously if an error occurs
					console.log("failure check");
					return response ;
				});
	        });
		};
		
		self.changestate = function(state) {
	        return db.query('INSERT OR REPLACE INTO mystate (id,lastupdate,version) VALUES (?,?,?)',[1,state,"0.9.0"])
	        .then(function(result){
				console.log('Version 0.9.0 updated to '+state);
	        });
	    };
		
		self.update = function(sites){
			var sql = "INSERT OR REPLACE INTO sites " +
		            "(id,cat,image,place,prov,name,coordGlng,coordGlat,sin_lat,cos_lat,sin_lng,cos_lng,description,info) " +
		            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			var l = sites.length;
			for (var i = 0; i < l; i++) {
				e = sites[i];
				db.query(sql, [e.id, e.cat, e.image, e.place, e.prov, e.name, e.coordGlng, e.coordGlat, e.sin_lat, e.cos_lat, e.sin_lng, e.cos_lng, e.description,e.info]);
			};
			return self.all();
		};
	    
	    return self;
	});