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