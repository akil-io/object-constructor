const _ = require('lodash');
const {deepMerge} = require("./deepMerge");

function Schema(builders) {
	this.builders = builders;
	this.apply = (ctx, initial) => Schema.define(ctx, this.builders, initial);
	return this;
}

Schema.builder = function (name, build, settings) {
	// target: property, method
	// context: internal, external
	return {
		name, build, ...settings
	};
}

Schema.group = function (name, builders) {
	return Schema.builder(name, 'group', {
		builders
	});
}

/**
 * Bind function to context in two variants: bound context to this, or give context to first argument
 * @param func
 * @param isBindable
 * @returns {function(*): *}
 * @private
 */
Schema._boundFunc = (func, isBindable) => context => isBindable ? func.bind(context) : function () { return func(context, ...arguments); };

Schema._proxy = function (get, set, isBindable = false) {
	let settings = {};
	if (get) settings.get = Schema._boundFunc(get, isBindable);
	if (set) settings.set = Schema._boundFunc(set, isBindable);
	return settings;
}

Schema.property = function (name, writable, enumerable, value) {
	let settings = { enumerable };
	if (_.isObject(value) && (value.get || value.set)) {
		Object.assign(settings, Schema._proxy(value));
	} else {
		settings.value = value;
		settings.writable = writable;
	}
	return Schema.builder(name, "property", settings);
}
Schema.public = function (name, value) {
	return Schema.property(name, true, true, value);
}
Schema.protected = function (name, value) {
	return Schema.property(name, true, false, value);
}
Schema.readonly = function (name, value) {
	return Schema.property(name, false, true, value);
}

Schema.method = function (name, func, isBindable = true) {
	return Schema.builder(name, "method", {
		value: Schema._boundFunc(func, isBindable),
		writable: false,
		enumerable: false
	});
}

Schema.flatten = function (builders = [], schemaName = 'Self', result = {}) {
	result[schemaName] = [];
	for (let item of builders) {
		switch (item.build) {
			case "group":
				Schema.flatten(item.builders, item.name, result);
				break;
			default:
				result[item.name] = item;
				result[schemaName].push(item.name);
		}
	}

	return result;
}

Schema.properties = function (options) {
	let { build: type, enumerable, writable, value, get, set, initial, context } = options;
	let properties = {
		enumerable
	};
	if (get !== undefined || set !== undefined) {
		if (get !== undefined) {
			properties.get = get(context);
		}
		if (set !== undefined) {
			properties.set = set(context);
		}
	} else {
		properties.writable = writable;
		if (type === "method" && _.isFunction(value)) {
			properties.value = value(context);
		} else {
			properties.value = (initial !== undefined) ? initial : value;
		}
	}
	return properties;
};

/**
 *
 * @param context
 * @param builders
 * @param initial
 * @returns {any}
 */
Schema.define = function (context, builders, initial = {}) {
	let flattened = Schema.flatten(builders);
	let properties = {};
	let groups = [];

	for (let field in flattened) {
		if (_.isArray(flattened[field])) {
			groups.push(field);
			continue;
		}
		properties[field] = Schema.properties({
			...flattened[field],
			initial: initial[field],
			context
		});
	}

	for (let groupName of groups) {
		let fields = flattened[groupName];
		properties[groupName] = Schema.properties({
			...Schema.protected(groupName, fields),
			context
		});
	}

	Object.defineProperties(context, properties);

	return context;
}

Schema.lock = function (context) {
	Object.seal(context);
};

Schema.ownNames = function (cls) {
	return _.difference(Object.getOwnPropertyNames(cls), ['length','name','prototype','constructor']);
};

Schema.ownFields = function (cls) {
	return _.pick(cls, Schema.ownNames(cls));
};

Schema.mixin = function (ctx, ...mixins) {
	for (let cls of mixins) {
		Object.assign(ctx, Schema.ownFields(cls));
		Object.assign(ctx.prototype, Schema.ownFields(cls.prototype));
	}
};

Schema.deep = function (ctx, name) {
	return (ctx.prototype.__proto__.constructor.name === "Object") ? ctx[name] : deepMerge(ctx.prototype.__proto__.constructor.schema(name), ctx[name]);
}

module.exports = {
	Schema
};