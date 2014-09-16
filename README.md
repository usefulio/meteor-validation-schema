Meteor Schema Validation
==========================
It's easy to use the schema package:

1. Create a schema:

        var personSchema = new Schema({
            // The schema name, this field is used when generating errors
            // and it is good practice to put a descriptive name for the kind
            // of object being validated here.
            name: 'person'
            , schema: {
                name: [Rule.isString]
                , age: [Rule.isNumber]
                , username: [Rule.isString, Rule.maxLength(10)]
                , email: [Rule.isEmail]
            }
        });

2. Check an object against the schema:

        personSchema.check({
            name: "Joe Smith"
            , age: 'fifty five'
            , email: 'joe@email.com'
            , username: 'joesmith'
        });
        // throws an error 'person age must be a number'

3. Schemas inherit the methods available on a Rule object:

    - match(value) - returns true if the value passes the schema check
    - errors(value) - returns an array of errors, one for each failed validation check.

4. Schemas handle subdocuments:

        var personSchema = new Schema({
            name: 'person'
            , address: {
                schema: {
                    'name': [Rule.isString]
                    , 'street1': [Rule.isString]
                    , 'street2': [Rule.isString]
                    , 'city': [Rule.isString]
                    , 'state': [Rule.isString]
                    , 'zip': [Rule.isString]
                    , 'country': [Rule.isString]
                }
            }
        });

5. Subdocuments definitions may be specified in a more compact form:

        var person Schema = new Schema({
            name: 'person'
            , schema: {
                location: {
                    coordinates: {
                        lat: [Rule.isNumber]
                        , lng: [Rule.isNumber]
                    }
                }
            }
        });

6. The structure of a schema object is very simple, but very flexible:

        // top level schema document:
        {
            // descriptive name, used in error reporting
            name: 'person'

            // rules to be run on entire object
            rules: [Rule.instanceOf(Person)]

            // a dictionary of sub-schemas/rules to run on object properties
            schema: {
                // the key represents the name/property/field to be validated,
                // i.e. myObject.name will be validated based on the rule below
                name: [Rule.isString]

                // the value may be any object, array or function which the schema
                // library knows how to turn into a Schema instance or Rule
                // instance, this includes:

                // any object with a rules property - will be converted to an
                // instance of Schema
                , deposit: {
                    rules: [Rule.isString]
                }

                // any object with a schema property - will be converted to an
                // instance of Schema
                , address: {
                    schema: {
                        // ...
                    }
                }
                
                // any object with one of the 4 remaining 'schema' identifying
                // properties, arrayRules, isArray, dictRules, isDict

                // any object with an errors property which is a function
                , specialSauce: {
                    errors: function () {return ['I always error!'];};
                }

                // this is intended for use with actual Rule or Schema
                // instances:
                , orderId: Rules.isNumber
                , shippingInfo: Schema.shippingInfo

                // a function:
                , phoneNumber: function (value) {return value.length == 10;}

                // an object without any schema identifying keys (rules, schema
                // arrayRules, isArray, dictRules, isDict):
                , simpleObject: {
                    name: Rules.isString
                }
            }
        }

7. The schema package depends on the rules package, and if you add both to your project you can create and reuse custom rules and schemas

        var shippingInfo = new Schema({
            name: 'shipping info'
            , schema: {
                adressee: Rule.isString
                , streetAddress1: Rule.isString
                , streetAddress2: Rule.isString
                , city: Rule.isString
                , state: Rule.isString
            }
        });

        // you can now use this schema in multiple places:
        var orderInfo = new Schema({
            name: 'order info'
            , schema: {
                _id: Rule.isString
                , shippingInfo: shippingInfo
            }
        });

        var returnInfo = new Schema({
            name: 'item return info'
            , schema: {
                _id: Rule.isString
                , orderId: Rule.isString
                , returnReason: Rule.isString
                , returnAddress: shippingInfo
            }
        });

        // you can use custom defined rules to validate your objects:
        // (Remember this example depends on the rules package.)
        var noUserMetadata = new Rule(function (value) {
            var allowedFields = ['name', 'userId', 'amount'];
            return _.all(_.keys(value), function (a) {
                return _.allowedFields.contains(a);
            });
        }, 400, 'may not contain user metadata');

        var isUserId = new Rule(function (value) {
            return !!Users.findOne(value);
        }, 404, "must be an existing user's id");

        // Notice how we can use these custom rules to validate the whole object
        // or to validate one of the properties of that object.
        var transactionInfo = new Schema({
            name: 'transaction'
            , rules: noUserMetadata
            , schema: {
                name: Rule.isString
                , amount: Rule.isNumber
                , userId: isUserId
            }
        });
