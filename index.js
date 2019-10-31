const _ = require('lodash');

function Schema(name, builders) {
	Schema[name] = builders;
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
Schema._boundFunc = func => context => (func.prototype === undefined && func.constructor.name != 'AsyncFunction') ? function () { return func(context, ...arguments); } : func.bind(context);

Schema._proxy = function (get, set) {
	let settings = {};
	if (get) settings.get = Schema._boundFunc(get);
	if (set) settings.set = Schema._boundFunc(set);
	return settings;
}

Schema.property = function (name, writable, enumerable, value) {
	let settings = { enumerable };
	if (_.isObject(value) && (value.get || value.set)) {
		Object.assign(settings, value);
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

Schema.method = function (name, func) {
	return Schema.builder(name, "method", {
		value: Schema._boundFunc(func),
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

Schema.apply = function (context, builders, initial = {}) {
	let flattened = Schema.flatten(builders);
	let properties = {};
	let groups = [];

	for (let field in flattened) {
		if (_.isArray(flattened[field])) {
			groups.push(field);
			continue;
		}
		let { build: type, enumerable, writable, value, get, set } = flattened[field];

		properties[field] = {
			enumerable
		};

		if (get !== undefined || set !== undefined) {
			if (get !== undefined) {
				properties[field].get = get(context);
			}
			if (set !== undefined) {
				properties[field].set = set(context);
			}
		} else {
			properties[field].writable = writable;
			if (type == "method" && _.isFunction(value)) {
				properties[field].value = value(context);
			} else {
				properties[field].value = (initial[field] !== undefined) ? initial[field] : value;
			}
		}
	}

	Object.defineProperties(context, properties);

	return context;
}

Schema.lock = function (context) {
	Object.seal(context);
};

module.exports = {
	Schema
};