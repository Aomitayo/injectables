var Injectables = require('../lib/injectables.js');
var expect = require('chai').expect;
var path = require('path');

describe('Injectables', function(){
  var injector = new Injectables({
    dep1:'dep1'
  });

  it('Should retrive preloaded dependencies', function(){
    expect(injector.get('dep1')).to.equal('dep1');
  });

  it('Should be able to load node packages', function(){
    var path = require('path');
    expect(injector.get('path')).to.equal(path);
  });

  it('Should be able to search dependencies', function(){
    var res = injector.find('dep1');
    expect(res).to.be.instanceOf(Array);
    expect(res).to.have.length(1);
    expect(injector.find('dep1', true)).to.be.equal('dep1');
    expect(injector.find(/dep/, true)).to.be.equal('dep1');
  });

  it('Should load and register 3rd-party packages', function(){
    var dep = require('injectr');
    expect(injector.get('injectr')).to.equal(dep);
    expect(injector.find('injectr', true)).to.equal(dep);
  });

  it('Should detect improperly typed dependency spec', function(){
    var fn = function(){
      injector.get({});
    };
    expect(fn).to.Throw(Error);
  });

  it('Should load and automaticaly name modules from an absolute path', function(){
    var mdl = injector.get(path.join(__dirname, 'fixtures/simple-module.js'));
    expect(mdl).to.not.be.null;
    expect(mdl).to.have.property('prop1', 'prop1_value');
    expect(injector.get('simple-module')).to.equal(mdl);
    expect(injector.find('simple-module', true)).to.equal(mdl);

  });

  it('Should load and automaticaly name modules from a relative path', function(){
    var path = require('path');
    var mdlPath = './' +  path.relative(process.cwd(), path.join(__dirname, 'fixtures/simple-module.js'));
    var mdl = injector.get(mdlPath);
    expect(mdl).to.not.be.null;
    expect(mdl).to.have.property('prop1', 'prop1_value');
    expect(injector.get('simple-module')).to.equal(mdl);
    expect(injector.find('simple-module', true)).to.equal(mdl);

  });

  it('Should be able to rename a module loaded from a file path', function(){
    var path = require('path');
    var mdl = injector.get(path.join(__dirname, 'fixtures/simple-module.js'), 'different-name');
    expect(mdl).to.not.be.null;
    expect(mdl).to.have.property('prop1', 'prop1_value');
    expect(injector.get('different-name')).to.equal(mdl);
    expect(injector.find('different-name', true)).to.equal(mdl);

  });

  it('Should be able to load module from a package path', function(){
    var mdl = injector.get('::injectr/injectr.js', 'injectr');
    expect(mdl).to.not.be.null;
    expect(typeof mdl).to.equal('function');
    expect(injector.get('injectr')).to.equal(mdl);
  });

  it('Should be able to load dependencies loaded from a package property spec', function(){
    var mdl = injector.get('::mocha::interfaces.bdd', 'mocha');
    expect(mdl).to.not.be.null;
    expect(injector.get('mocha/interfaces/bdd')).to.equal(mdl);
  });

  it('Should be able to get nested poperties', function(){
    var obj = {
      root:{
        intermediate:{
          destination:'value'
        }
      }
    };
    expect(injector.getNestedProperty(obj, '')).to.equal(obj);
    expect(injector.getNestedProperty(obj, 'root.intermediate.destination')).to.equal('value');
  });

  it('Should support direct dependency registration', function(){
    var dep = {'directProp':'directPropValue'};
    injector.register('directDep', dep);
    expect(injector.get('directDep')).to.equal(dep);
  });

  it('Should support the specification of a base path' , function(){
    injector.basePath = path.resolve(__dirname, 'fixtures');
    var mdl = injector.get('./simple-module.js');
    expect(mdl).to.not.be.null;
    expect(mdl).to.have.property('prop1', 'prop1_value');
  })
});