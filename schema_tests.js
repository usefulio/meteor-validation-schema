var doesExist = function (a) {
	return !!a;
};
var simpleSchema = {
	name: 'Simple Object'
	, message: 'must exist'
	, rules: doesExist
	, schema: {
		name: {
			rules: doesExist
		}
		, child: {
			schema: {
				name: {
					rules: doesExist
				}
			}
		}
	}
};

var simpleObject = {
	name: "Joe"
	, child: {
		name: "Sam"
	}
};

var brokenObject = {

};

var brokenChild = {
	name: 'Joe'
	, child: {

	}
};

Tinytest.add('Schema - acts like a rule', function (test) {
	var schema = new Schema(simpleSchema);

	// match function
	test.equal(schema.match(brokenObject), false);
	test.equal(schema.match(simpleObject), true);

	// check function
	try {
		schema.check(brokenObject);
		test.equal(true, false);
	} catch (e) {}
	try {
		schema.check(simpleObject);
	} catch (e) {
		test.equal(true, false);
	}

	// errors function
	test.equal(!!schema.errors(brokenObject)[0], true);
	test.equal(!!schema.errors(simpleObject)[0], false);

	// respects message property
	test.equal(schema.errors()[0].message, 'Simple Object must exist');
});

Tinytest.add('Schema - returns concatenated error messages', function (test) {
	var schema = new Schema(simpleSchema);

	test.equal(schema.errors(brokenObject)[0].message, 'Simple Object name is invalid');
	test.equal(schema.errors(brokenChild)[0].message, 'Simple Object child name is invalid');

	test.equal(schema.errors(brokenChild, null, 'your')[0].message, 'your child name is invalid');
});

Tinytest.add('Schema - child objects are schema instances', function (test) {
	var schema = new Schema(simpleSchema);

	// is instance of Schema
	test.instanceOf(schema.schema.child, Schema);

	// throws properly namespaced errors
	test.equal(schema.schema.child.errors(brokenObject)[0].message, 'child name is invalid');
});

Tinytest.add('Schema - correctly throws rules errors', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			name: {
				rules: new Rule(function (value) {
					return value && typeof value == 'string' && value.length >= 10;
				}, 400, 'must be a string at least 10 characters long')
			}
		}
	});

	test.equal(schema.errors({name: ''})[0].message, 'contact name must be a string at least 10 characters long');
});

Tinytest.add('Schema - property schemas - accepts function', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			name: function (value) {
				return !!value;
			}
		}
	});

	test.equal(schema.errors({name: ''})[0].message, 'contact name is invalid');
});

Tinytest.add('Schema - property schemas - accepts rule', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			name: new Rule(function (value) {
				return !!value;
			})
		}
	});

	test.equal(schema.errors({name: ''})[0].message, 'contact name is invalid');
});

Tinytest.add('Schema - property schemas - accepts array', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			name: [function (value) {
				return !!value;
			}, new Rule(function (value) {
				return typeof value == 'string';
			})]
		}
	});

	test.equal(schema.errors({name: ''})[0].message, 'contact name is invalid');
	test.equal(schema.errors({name: 1})[0].message, 'contact name is invalid');
});

Tinytest.add('Schema - property schemas - accepts raw schema', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			child: {
				name: function (a) {return !!a;}
			}
		}
	});

	test.equal(schema.errors({child:{}})[0].message, 'contact child name is invalid');
});

Tinytest.add('Schema - property schemas - does not incorrectly create raw schema', function (test) {
	var schema = function (a) {
		a.name = function (value) {return !!value;};
		return new Schema({
			name: "name"
			, schema: {
				child: a
			}
		});
	};
	var testObject = {
		child: {
			name: false
		}
	};
	var arrayTestObject = {
		child: [

		]
	};

	test.isFalse(schema({}).match(testObject));

	test.isTrue(schema({rules: []}).match(testObject));
	test.isTrue(schema({rules: {}}).match(testObject));
	test.isTrue(schema({rules: function () {return true;}}).match(testObject));
	test.isTrue(schema({schema: {}}).match(testObject));
	test.isFalse(schema({isArray: {}}).match(arrayTestObject));
	test.isTrue(schema({isArray: false}).match(arrayTestObject));
	test.isTrue(schema({isArray: true}).match(arrayTestObject));
	test.isTrue(schema({arrayRules: {}}).match(arrayTestObject));
	test.isTrue(schema({arrayRules: []}).match(arrayTestObject));
	test.isTrue(schema({arrayRules: function () {return true;}}).match(arrayTestObject));
	test.isFalse(schema({isDict: {}}).match(testObject));
	test.isTrue(schema({isDict: false}).match(testObject));
	test.isTrue(schema({isDict: true}).match(testObject));
	test.isTrue(schema({dictRules: {}}).match(testObject));
	test.isTrue(schema({dictRules: []}).match(testObject));
	test.isTrue(schema({dictRules: function () {return true;}}).match(testObject));
});
Tinytest.add('Schema - property schemas - raw schema returns correct errors', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			child: {
				name: new Rule(function (a) {return !!a;}, 400, 'is required')
			}
		}
	});

	test.equal(schema.errors({child:{}})[0].message, 'contact child name is required');
});

Tinytest.add('Schema - array schemas - processes child schemas', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			children: {
				isArray: true
				, schema: {
					name: {
						rules: function (value) {return !!value;}
					}
				}
			}
		}
	});

	test.equal(schema.errors({children: [
		{}
	]})[0].message
	, 'contact children #1 name is invalid');
});

Tinytest.add('Schema - array schemas - processes child rules', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			children: {
				isArray: true
				, rules: function (a) {return !!a;}
			}
		}
	});

	test.equal(schema.errors({children: [
		null
	]})[0].message
	, 'contact children #1 is invalid');
});

Tinytest.add('Schema - array schemas - processes arrayRules rules', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			children: {
				isArray: true
				, arrayRules: function (a) {return a.length > 0;}
			}
		}
	});

	test.equal(schema.errors({children:[]})[0].message, 'contact children is invalid');
});

Tinytest.add('Schema - array schemas - checks is array', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			children: {
				isArray: true
				, arrayRules: []
			}
		}
	});

	test.equal(schema.errors({children:{}})[0].message, 'contact children must be an array');
	test.equal(schema.errors({children:' '})[0].message, 'contact children must be an array');
	test.equal(schema.errors({children:1})[0].message, 'contact children must be an array');
	test.equal(schema.errors({children:function () {}})[0].message, 'contact children must be an array');
});

Tinytest.add('Schema - array schemas - correctly handles falsy values', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			children: {
				isArray: true
				, arrayRules: []
			}
		}
	});

	test.isTrue(schema.match({}));
	test.isTrue(schema.match({children:null}));
	test.equal(schema.errors({children:''})[0].message, 'contact children must be an array');
	test.equal(schema.errors({children:0})[0].message, 'contact children must be an array');
});

Tinytest.add('Schema - dict schemas - processes child schemas', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			children: {
				isDict: true
				, schema: {
					name: {
						rules: function (value) {return !!value;}
					}
				}
			}
		}
	});

	test.equal(schema.errors({children: {
		joe: {}
	}})[0].message
	, 'contact children #joe name is invalid');
});

Tinytest.add('Schema - dict schemas - processes child rules', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			children: {
				isDict: true
				, rules: function (a) {return !!a;}
			}
		}
	});

	test.equal(schema.errors({children: {
		joe: null
	}})[0].message
	, 'contact children #joe is invalid');
});

Tinytest.add('Schema - dict schemas - processes dictRules rules', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			children: {
				isDict: true
				, dictRules: function (a) {return _.keys(a) > 0;}
			}
		}
	});

	test.equal(schema.errors({children:{}})[0].message, 'contact children is invalid');
});

Tinytest.add('Schema - dict schemas - checks is dict', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			children: {
				isDict: true
				, dictRules: []
			}
		}
	});

	test.equal(schema.errors({children:' '})[0].message, 'contact children must be a dictionary');
	test.equal(schema.errors({children:1})[0].message, 'contact children must be a dictionary');
});

Tinytest.add('Schema - dict schemas - correctly handles falsy values', function (test) {
	var schema = new Schema({
		name: 'contact'
		, schema: {
			children: {
				isDict: true
				, dictRules: []
			}
		}
	});

	test.isTrue(schema.match({}));
	test.isTrue(schema.match({children:null}));
	test.equal(schema.errors({children:''})[0].message, 'contact children must be a dictionary');
	test.equal(schema.errors({children:0})[0].message, 'contact children must be a dictionary');
});

Tinytest.add('Schema - array schemas - provides toArraySchema function', function (test) {
	var rule = _.isString;
	var schema = new Schema({
		schema: {
			name: rule
		}
	});

	test.isTrue(schema.match({name: 'Joe'}));
	test.isFalse(schema.match([{name: 'Joe'}]));

	test.isFalse(schema.toArraySchema().match({name: 'Joe'}));
	test.isTrue(schema.toArraySchema().match([{name: 'Joe'}]));
});

Tinytest.add('Schema - dict schemas - provides toDictSchema function', function (test) {
	var rule = _.isString;
	var schema = new Schema({
		schema: {
			name: rule
		}
	});

	test.isTrue(schema.match({name: 'Joe'}));
	test.isFalse(schema.match({joe: {name: 'Joe'}}));

	test.isFalse(schema.toDictSchema().match({name: 'Joe'}));
	test.isTrue(schema.toDictSchema().match({joe: {name: 'Joe'}}));
});

Tinytest.add('Schema - dict schemas - provides toItemSchema function', function (test) {
	var rule = _.isString;
	var schema = new Schema({
		schema: {
			name: rule
		}
		, isArray: true
	});

	test.isFalse(schema.match({name: 'Joe'}));
	test.isTrue(schema.match([{name: 'Joe'}]));

	test.isTrue(schema.toItemSchema().match({name: 'Joe'}));
	test.isFalse(schema.toItemSchema().match([{name: 'Joe'}]));

	schema = new Schema({
		schema: {
			name: rule
		}
		, isDict: true
	});

	test.isFalse(schema.match({name: 'Joe'}));
	test.isTrue(schema.match({joe: {name: 'Joe'}}));

	test.isTrue(schema.toItemSchema().match({name: 'Joe'}));
	test.isFalse(schema.toItemSchema().match({joe: {name: 'Joe'}}));
});

// XXX implement and test toArraySchema and toDictionarySchema methods of Schema object
// these methods convert a schema which validates a single object into a schema
// which validates an array of those objects

// XXX also visa versa for the above methods: we need to add a toItemSchema method

// XXX implement and test default context when running validation tests
// the default context should always be an object with the following keys:
// schema: the schema object who's errors function is calling the validation rule
// rule: the rule object currently being executed
// item: the object being validated
// value: the value being validated

// XXX we need to update the schema api to be more consistent about the way it
// returns errors.
// errors should return objects like so: 
// {
//   message: 'schema field is invalid'
//   , statusCode: 400
// }
// (this way all objects returned by the errors object are consistent)
// check should only throw meteor errors on the server

Tinytest.add('Schema - big complex schema', function (test) {
	var required = new Rule(function (value) {
		return !(_.isNull(value) || _.isUndefined(value) || value === '');
	}, 400, 'is required');
	var minLength = function (length) {
		return new Rule(function (value) {
			return !value || value.length >= length;
		}, 400, 'must be a minimum of ' + length + ' long');
	};
	var maxLength = function (length) {
		return new Rule(function (value) {
			return !value || value.length <= length;
		}, 400, 'may be a maximum of ' + length + ' long');
	};
	var number = new Rule(function (value) {
		return _.isNumber(value) || _.isUndefined(value);
	}, 400, 'must be a number');
	var person = new Schema({
		name: 'person'
		, rules: [
			new Rule(function (value) {
				return value.age > 55 ? !!value.ssn : true;
			}, 400, 'people over 55 must have a social security number')
			, new Rule(function (value) {
				return value.isCriminal ? !!value.fingerprints : true;
			}, 400, 'criminals must have fingerprints')
		]
		, schema: {
			name: [required, minLength(10)]
			, age: [required, number]
			, ssn: [number]
			, isCriminal: [required]
			, fingerprints: [minLength(100)]
		}
	});

	var contact = new Schema({
		name: 'contact card'
		, schema: {
			name: [required]
			, friends: {
				arrayRules: maxLength(5)
				, rules: person.rules
				, schema: person.schema
			}
			, family: {
				isDict: true
				, rules: person.rules
				, schema: person.schema
			}
			, enemies: {
				isArray: true
			}
		}
	});

	var messyContact = {
		name: 'Joe Jones'
		, friends: [
			{
				name: 'short'
				, age: 10
				, isCriminal: false
			}
			, {
				name: 'Joseph Ohlman'
				, age: 10
				, isCriminal: false
			}
			, {
				name: 'Mr. Criminal in disguise'
				, age: 10
			}
			, {
				name: 'Mr. Criminal in jail'
				, age: 10
				, isCriminal: true
				, fingerprints: Random.id()
			}
			, {
				name: 'Mr. Criminal in jail'
				, age: 10
				, isCriminal: true
				, fingerprints: Random.id(100)
			}
			, {
				name: 'Mr. Criminal in jail'
				, isCriminal: false
			}
		]
		, family: {
			'wife': {
				name: 'Mrs. Joe Jones'
				, isCriminal: false
				, age: 20
			}
			, 'kid': {
				name: 'Joe Jones, Jr.'
				, isCriminal: false
				, age: 2
			}
			, 'other kid': {
				isCriminal: false
				, age: 'three'
			}
			, 'dad': {
				name: 'Mr. Joe Jones, Sr.'
				, age: 60
			}
		}
		, enemies: {
			'nemesis': {
				name: 'my enemy'
			}
		}
	};

	var errors = contact.errors(messyContact);

	var expectedErrors = [
		'contact card friends may be a maximum of 5 long'
		, 'contact card friends #1 name must be a minimum of 10 long'
		, 'contact card friends #3 isCriminal is required'
		, 'contact card friends #4 fingerprints must be a minimum of 100 long'
		, 'contact card friends #6 age is required'
		, 'contact card family #other kid name is required'
		, 'contact card family #other kid age must be a number'
		, 'contact card family #dad people over 55 must have a social security number'
		, 'contact card family #dad isCriminal is required'
		, 'contact card enemies must be an array'
	];

	test.equal(errors.length, expectedErrors.length);

	_.each(expectedErrors, function (e, i) {
			test.equal(errors[i].message, e);
		});
});
