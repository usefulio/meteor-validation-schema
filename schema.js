Schema = function (options) {
	_.extend(this, options);
	Schema.applyConstructorToChildren(this.schema);

	// Schema for array
	if (options.isArray || options.arrayRules) {
		this.errors = Schema.errorsForArray;
	}

	// Schema for dictionary
	if (options.isDict || options.dictRules) {
		this.errors = Schema.errorsForDictionary;
	}
};

Schema.applyConstructorToChildren = function (schema) {
	_.each(schema, function (a, i) {
		var childSchema;
		if (a && typeof a == 'object') {
			if (typeof a.errors == 'function') {
				// we assume this is a custom object implementing the rule api
				// we leave it in place so it can be called by our normal
				// validation logic.
				childSchema = a;
			} else if (
				(a.schema && typeof a.schema == 'object') ||
				(a.rules && typeof (a.rules == 'object' || typeof a.rules == 'function'))
				) {
				// we treat this as a child schema definition

				// it's intersting to note that if the user intended to 
				// define a rule object here that will still work because of
				// the close link between the rule and schema apis

				childSchema = new Schema(a);
			} else if (_.isArray(a)) {
				// we treat this as a collection of rules

				// we could have allowed the array to include an object specifying
				// the child object's schema, but there doesn't seem to be any
				// point in encouraging the user to mix rule and schema objects
				// in an array when the could just as easily define the schema
				// explictly

				childSchema = new Schema({
					rules: a
				});

			} else {
				// we treat this as a raw (unwrapped) schema
				childSchema = new Schema({
					schema: a
				});
			}
		} else if (typeof a == 'function') {
			// we treat this as a rule, but we wrap it in a schema object to
			// be sure that the name property is respected.
			childSchema = new Schema({
				rules: a
			});
		} else {
			// we don't want to simply erase this schema object, it might 
			childSchema = new Schema({
				_invalidSchema: true
				, _developerNotes: a
			});
		}

		_.defaults(childSchema, {name: i});

		schema[i] = childSchema;
	});
};

// We want to implement the same api as the rule object
Schema.prototype = _.clone(Rule.prototype);

// The rule object only has one fundemental 
Schema.prototype.errors = function(value, context, path, shortCircut) {
	// Generate a 'path' so errors thrown on child objects make sense
	if (!path) path = [this.name];
	if (!_.isArray(path)) path = [path];

	// Start with any item level validations.
	var errors = Rule.prototype.errors.call(this, value, context, path, shortCircut);

	// Enforce the shortCircut rule
	if (shortCircut && errors.length) return errors;

	if (value) _.find(this.schema, function (descriptor, name) {
		// XXX support array validation
		var childValue = value[name];
		var childPath = path.concat(name);

		// XXX we should probably default context to the parent value
		// context = context || value;

		_.each(descriptor.errors(childValue, context, childPath, shortCircut), function (error) {
			errors.push(error);
		});
		// Enforce the shortCircut rule
		if (shortCircut && errors.length) return true;
	});

	return errors;
};

Schema.errorsForArray = function (value, context, path, shortCircut) {
	// Generate a 'path' so errors thrown on child objects make sense
	if (!path) path = [this.name];

	var self = this;

	var errors = [];

	// XXX perform array level validation. The arrayRules property contains
	// rules which should be run against the array as a whole. (the rules
	// property contains rules which will be run against each array element)

	if (!_.isArray(value)) {
		errors.push(this.makeError({
			errorMessage: "must be an array"
			, statusCode: 400
		}));
		return errors;
	}
	_.find(value, function (item, key) {
		_.each(Schema.prototype.errors.call(
			self
			, item
			, context
			, path.concat("#" + key)
			, shortCircut
			), function (e) {
			errors.push(e);
		});
		if (shortCircut && errors.length) {
			return true;
		}
	});

	return errors;
};

Schema.errorsForDictionary = function (value, context, path, shortCircut) {
	// XXX implement this function - same as errorsForArray but specific to
	// dictionaries. Should validate the value is an object and should run
	// any dictRules against the value as a whole, see the comment for arrayRules	
};