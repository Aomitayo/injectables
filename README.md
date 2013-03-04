# injectables

A Dependency manager for nodejs applications


## Getting Started
Install the module with: `npm install injectables`

```javascript
var injectables = require('injectables');
//Retrieve a dependency 
injectables.get('dep1'); // "awesome"
```

## Documentation

It manages dependencies for modules and factory functions. by  maintaining an
internal registry of dependencies. The dependencies may then by injected into
modules or factory functions via the API.

### dependency names

Every module or Dependency is assigned a unique name which can later be used
to retrive it.
The names may be explicitly specified(via the name parameter), deduced from
the specification of the dependency or randomly generated.
The name for every every dependency is assigned to the '__injectorName'
property of the dependency


### Dependency specifications

A dependency specification is used to find, load and name a dependency.
It can be a string, factory function, or an array combination of strings
and a factory function.

String Specs come in 3 flavours:
 1. File path: - An absolute or relative path to a node.js module, or directory containing modules
 2.	Package path: A package name or partial path that specifies a submodule or subdirectory
 of the package. The String should be in the format:
     ::<package_name>/<relative_path_to_module>
	3. A package or module property: specified in the format
		::<package_name>::<dot_notation_path>

A factory function is a function that creates and returns an instance of the dependency.
An array spec is an array of strings followed by a factory function.
The strings in the lower indexes are resolved and passed as arguments to
the factory function at the last index.

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Adedayo Omitayo  
Licensed under the MIT license.
