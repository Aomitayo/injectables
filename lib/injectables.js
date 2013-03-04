/*
 * injectables
 * https://github.com/Aomitayo/injectables
 *
 * Copyright (c) 2013 Adedayo Omitayo
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var injectr = require('injectr');

/**
 * Constructor
 */
function Injectables(deps){
	var self = this;
	this.registry = {
		injector: this
	};
	Object.keys(deps|| {}).forEach(function(k){
		if(k == 'injectables') return;
		self.registry[k] = deps[k];
	});
	self.basePath = process.cwd();
}
module.exports = Injectables;

/**
 * Retrieves or loads dependencies.
 *
 * @param  {String | function | Array} spec A specification of the dependency to be retireved or loaded.
 * @param  {String} name A unique name for the dependency
 * @return {Object | Array}      the dependency or an array of dependencies that match the spec;
 */
Injectables.prototype.get = function(spec, name){
	
	if(!Array.isArray(spec) && typeof spec != "string" && typeof spec !== 'function'){
		throw new Error('Dependency specification should be a string or an array');
	}

	var self = this;
	var dep;
		
	
	if(typeof spec == "string"){
		//previously loaded dependency
		if(self.contains(spec)){
			return self.registry[spec];
		}
		//get a simple package
		if(/^\w+$/.test(spec)){
			self.registry[name || spec] = require(spec);
			return self.registry[name || spec];
		}
		//load from file path
		if(/(^\/)|(^\.\/)|(^\.\.\/)/.test(spec)){
			var deps = [];
			var depPath = /^\//.test(spec)? spec : path.resolve(self.basePath, spec);
			depPath = path.normalize(depPath);
			self.loadFromPath(depPath, '', function(moduleName, mdl){
				if(name){
					moduleName = moduleName.replace(/^[\w~\-.]+/, name);
				}
				self.registry[moduleName] = mdl;
				deps.push(mdl);
			});
			return deps.length == 1? deps[0] : deps.length > 0? deps : undefined;
		}

		//load from package path
		var parts = /^::([~\w.\-_]+)\/((\.|\.\.|\w).*)/.exec(spec),
			packageName = parts? parts[1] : '',
			packagePath = parts? parts[2] : '',
			packageDeps = [];
		if(parts){
			var resolvedPath = path.resolve(path.dirname(require.resolve(packageName)), packagePath || '');
			self.loadFromPath(resolvedPath, '', function(moduleName, mdl){
				if(name){
					moduleName = moduleName.replace(/^[\w~\-.]+/, name);
				}
				self.registry[moduleName] = mdl;
				packageDeps.push(mdl);
			});
			return packageDeps.length == 1? packageDeps[0] : packageDeps.length > 0? packageDeps : undefined;
		}

		//load from package properties
		parts = /^::([~\w.\-_]+)::(\w+(\.\w+|\*)*)/.exec(spec);
		packageName = parts? parts[1] : '';
		var	propertyPath = parts? parts[2] : '';
		var	propDeps = [];
		if(parts){
			var thePackage = self.get(packageName);
			var prefix = name? name : packageName;

			if(!thePackage) return undefined;
			
			var baseDep = self.getNestedProperty(thePackage, propertyPath.replace(/\.\*$/, ''));
			if(!baseDep) return undefined;
			if(/\.\*/.test(propertyPath)){
				prefix = prefix + path.sep + propertyPath.replace('.', path.sep);
				Object.getOwnPropertyNames(baseDep).forEach(function(prop){
					self.registry[prefix + path.sep + prop] = baseDep[prop];
					propDeps.push(baseDep[prop]);
				});
			}
			else{
				self.registry[prefix + path.sep + propertyPath.replace('.', path.sep)] = baseDep;
				propDeps.push(baseDep);
			}
			return propDeps.length == 1? propDeps[0] : propDeps.length > 0? propDeps : undefined;
		}

		return undefined;
	}
};

/**
 * Directly registers a dependency.
 * Will indicate whether a dependecy was displaced by the operation
 *
 * @param  {String} name the name under which the dependecy is registered
 * @param  {Object} dep  The dependency
 * @return {boolean}      true if a dependency was formerly registed under the
 *                             given name; false otherwise.
 */
Injectables.prototype.register = function(name, dep){
	var ret = this.registry[name]? true: false;
	this.registry[name] = dep;
	return ret;
};
/**
 * Determines if the injector contains a dependency. The dependency  is specifed
 * by dependency identifier
 *
 * @param  {String} obj a string that identifies the dependency
 * @return {Boolean}     true if the injector contains the specifed dependency
 */
Injectables.prototype.contains = function(obj){
	return this.registry[obj]? true :false;
};

/**
 * Retrives dependencies that match the specifed id.
 * @param  {String | RegEx } id 	A string or regular expression against
 *                   which dependency ids are matched.
 * @param  {Boolean} single    Specifes weather to return one dependency or an
 *                            array of all matching dependencies
 * @return {Object}          An array of Objects if single is false or an array
 *                              of objects otherwise. Null if no dependencies match.
 */
Injectables.prototype.find = function(id, single){
	var self = this;
	var depRe = typeof id === 'string'? new RegExp(id) : id;
	var matchingDeps = Object.keys(self.registry).filter(function(name){
		return depRe.test(name);
	})
	.map(function(name){
		return self.registry[name];
	});
	var ret = matchingDeps.length > 0? matchingDeps : null;
	ret = ret && single? ret[0] : ret;
	return ret;
};


Injectables.prototype.loadFromPath = function(filesPath, prefix, callback){
	var self = this;
	callback = callback || function(moduleName, m){};

	self._walkPath(filesPath, function(filePath, stats, depth ){
		if(stats.isDirectory()){return;}
		var moduleName = (prefix? prefix + path.sep : '') + filePath.split(path.sep).slice(0 -(depth + 1)).join(path.sep);
		moduleName = moduleName.replace('.js', '');

		var injectrContext = {};
		Object.keys(global).forEach(function(k){
			if(['global', 'GLOBAL', 'require', 'module'].indexOf(k) == -1){
				injectrContext[k] = global[k];
			}
		});
		injectrContext.__dirname = path.dirname(filePath);
		injectrContext.__filename = filePath;
		
		var m = injectr(filePath, self.registry, injectrContext);

		callback(moduleName, m);
	});
};

Injectables.prototype._walkPath = function(pathName, callback, currentDepth, maxDepth){
	if(!fs.existsSync(pathName) ){
		throw new Error('File ' + pathName + ' does not exists');
	}
	
	var self = this;
	
	currentDepth = currentDepth >= 0 ? currentDepth + 1 : 0;
	var stats = fs.statSync(pathName);
	callback(pathName, stats, currentDepth);

	var doRecurse = maxDepth? (maxDepth > 0) : true;
	if(stats.isDirectory() && doRecurse){
		maxDepth = maxDepth? maxDepth - 1 : maxDepth;
		fs.readdirSync(pathName).sort().forEach(function(name){
			self._walkPath(path.join(pathName, name), callback, currentDepth, maxDepth );
		});
	}
};

Injectables.prototype.getNestedProperty = function(obj, propPath){
	var value = obj;
	propPath.split('.').forEach(function(name_part){
		if(value === ''){ return; }
		if(!name_part) return;
		var name_part_parts = /(\w+)(\[(\d*)\])?/.exec(name_part);
		value = value[ name_part_parts[1] ] || '';
		if(name_part_parts[2] && value){
			value = value[parseInt(name_part_parts[3], 10)];
		}
	});
	return value;
};