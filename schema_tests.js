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

	test.equal(schema.errors({name: ''})[0].reason, 'contact name must be a string at least 10 characters long');
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
	test.isTrue(schema({arrayRules: {}}).match(arrayTestObject));
	test.isTrue(schema({arrayRules: []}).match(arrayTestObject));
	test.isTrue(schema({arrayRules: function () {return true;}}).match(arrayTestObject));
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

	test.equal(schema.errors({child:{}})[0].reason, 'contact child name is required');
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
				, arrayRules: function (a) {return a.length > 0;}
			}
		}
	});

	test.equal(schema.errors({children:{}})[0].reason, 'contact children must be an array');
	test.equal(schema.errors({children:' '})[0].reason, 'contact children must be an array');
	test.equal(schema.errors({children:1})[0].reason, 'contact children must be an array');
	test.equal(schema.errors({children:function () {}})[0].reason, 'contact children must be an array');
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
	test.equal(schema.errors({children:''})[0].reason, 'contact children must be an array');
	test.equal(schema.errors({children:0})[0].reason, 'contact children must be an array');
});