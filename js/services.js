	TharrosApp.constant('DB_CONFIG', {
		name: 'sardinia_db',
		tables: [
			{
				name: 'categories',
				columns: [
					{name: 'cat', type: 'varchar(1) primary key'},
					{name: 'type', type: 'varchar(50)'}
				]
			},
			{
				name: 'sites',
				columns: [
					{name: 'id', type: 'integer primary key'},
					{name: 'cat', type: 'varchar(1)'},
					{name: 'image', type: 'varchar(50)'},
					{name: 'place', type: 'varchar(150)'}, 
					{name: 'prov', type: 'varchar(2)'},
					{name: 'name', type: 'varchar(50)'},
					{name: 'coordGlng', type: 'float(8,5)'},
					{name: 'coordGlat', type: 'float(8,5)'},
					{name: 'description', type: 'longtext'},
					{name: 'info', type: 'longtext'}
				]
			}
		]
	});
	
	TharrosApp.factory('db', function($q, DB_CONFIG) {
	    var self = this;
	    self.db = null;
	
	    self.init = function() {
	        self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database', -1);
	
	        angular.forEach(DB_CONFIG.tables, function(table) {
	            var columns = [];
	
	            angular.forEach(table.columns, function(column) {
	                columns.push(column.name + ' ' + column.type);
	            });
					var querytemp = 'DROP TABLE ' + table.name ;
					self.query(querytemp);
					console.log('Table ' + table.name + ' deleted');
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
	    
	    self.getById = function(id) {
	        return db.query('SELECT * FROM sites WHERE id = ?', [id])
	        .then(function(result){
	            return db.fetch(result);
	        });
	    };
		
		self.insert = function(sites){
			var sql = "INSERT OR REPLACE INTO sites " +
		            "(id,cat,image,place,prov,name,coordGlng,coordGlat,description,info) " +
		            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			var l = sites.length;
			for (var i = 0; i < l; i++) {
				e = sites[i];
				db.query(sql, [e.id, e.cat, e.image, e.place, e.prov, e.name, e.coordGlng, e.coordGlat,e.description,e.info])
				console.log(e.id + ' initialized');
			};
			return self.all();
		};
	    
	    return self;
	});