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
	
	TharrosApp.constant('GOOGLE_API', (function() {
		var thiskey = "AIzaSyCOqz1QKx6jyq3Q94jABG4-4X2zU_FTpCA";
		var thisplatform = "Windows";
		if(typeof(device) !== 'undefined'){
			if(device.platform == "Android"){
				thiskey = "AIzaSyDxUhuwVOvnmJ64ahlSQU69F_5eRmGO7EY";
			}else if(device.platform == "iOS"){
				thiskey = "AIzaSyDxUhuwVOvnmJ64ahlSQU69F_5eRmGO7EY";
			}
			thisplatform = device.platform;
		}
		return {
			APIKEY: thiskey,
			PLATFORM: thisplatform
		}
	})());;
	
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
		
		self.checkstate = function($http, $filter, $confirm, $translate, lang) {
			console.log("db version checked: "+db.db.version);
			return db.query('SELECT lastupdate,lastcheck FROM mystate WHERE id=1')
	        .then(function(result){
				//e = JSON.stringify(result, null, 4);
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
						//e = JSON.stringify(response, null, 4)
						console.log("success check " + response.data[0].update);
						if (response.data[0].update === 0){
							// ask user if he wants to update
							return $translate(['UPDATE_MESSAGE', 'UPDATE_TITLE', 'NOK']).then(function (translations){
								return $confirm({text: translations.UPDATE_MESSAGE, title: translations.UPDATE_TITLE, ok: 'ok', cancel: translations.NOK}).then(function(){
									console.log("Confirmed update request");
									var mydate = new Date();
									var noCache = mydate.getTime();
									$http({
										method: 'POST',
										crossDomain: true,
										dataType: "json",
										data: { reg: "xN4p!t92Zy", lng: lang, cache: noCache},
										url: 'https://www.tharros.info/sitelist.php'
									}).then(function successCallback(response) {
										return self.update(response.data).then(function(){
											// update mystate with current date
											console.log("success update");
											state = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
											console.log("date "+state);
											return self.changestate(state,state);
										});
									},function errorCallback(response) {
										console.log("failure update");
									});
								},function(){console.log("Cancel pressed");});
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
	        return db.query('INSERT OR REPLACE INTO mystate (id,lastupdate,lastcheck,version) VALUES (?,?,?,?)',[1,state,check,"1.0.1"])
	        .then(function(result){
				console.log('Version 1.0.1 updated to ' + state + 'last check: ' + check);
	        });
	    };
		
		self.update = function(sites){
			console.log("db version: "+db.db.version);
			if(db.db.version == "1.0"){
				//db.changeVersion("", "1", function(t){
				//	t.executeSql("create table ...");
				//});
				console.log("db version checked");
			}
			// count fields: if no. of fields 14 run sql x else run sql y
			var l = sites.length;
			var sql = "INSERT OR REPLACE INTO sites " +
				"(id,cat,image,place,prov,name,coordGlng,coordGlat,sin_lat,cos_lat,sin_lng,cos_lng,description,info) " +
				"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			for (var i = 0; i < l; i++) {
				e = sites[i];
				db.query(sql, [e.id, e.cat, e.image, e.place, e.prov, e.name, e.coordGlng, e.coordGlat, e.sin_lat, e.cos_lat, e.sin_lng, e.cos_lng, e.description,e.info]);
			};
			
			//if(l==14){
			//	var sql = "INSERT OR REPLACE INTO sites " +
			//			"(id,cat,image,place,prov,name,coordGlng,coordGlat,sin_lat,cos_lat,sin_lng,cos_lng,description,info) " +
			//			"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			//	for (var i = 0; i < l; i++) {
			//		e = sites[i];
			//		db.query(sql, [e.id, e.cat, e.image, e.place, e.prov, e.name, 0, 0, e.coordGlng, e.coordGlat, e.sin_lat, e.cos_lat, e.sin_lng, e.cos_lng, e.description,e.info]);
			//	};
			//}
			//if(l==16){
			//	var sql = "INSERT OR REPLACE INTO sites " +
			//	        "(id,cat,image,place,prov,name,gallery,sites,coordGlng,coordGlat,sin_lat,cos_lat,sin_lng,cos_lng,description,info) " +
			//	        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			//	for (var i = 0; i < l; i++) {
			//		e = sites[i];
			//		db.query(sql, [e.id, e.cat, e.image, e.place, e.prov, e.name, e.gallery, e.sites, e.coordGlng, e.coordGlat, e.sin_lat, e.cos_lat, e.sin_lng, e.cos_lng, e.description,e.info]);
			//	};
			//}
			return self.all();
		};
	    
	    return self;
	});