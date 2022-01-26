const { Schema } = require('./lib/Schema');
const { deepMerge } = require('./lib/deepMerge');

class StaticSchema {
    static schema (name) {
        return Schema.deep(this, name);
    }

    reset(fields) {
        let schema = this.constructor.schema('fields');
        for (let key in schema) {
            if (fields[key] !== undefined) this[key] = fields[key];
            else this[key] = schema[key];
        }
    }
}

Object.prototype.public = function (name, value) {
    Schema.define(this, [
        Schema.public(name, value)
    ]);
};
Object.prototype.protected = function (name, value) {
    Schema.define(this, [
        Schema.protected(name, value)
    ]);
};
Object.prototype.readonly = function (name, value) {
    Schema.define(this, [
        Schema.readonly(name, value)
    ]);
};
Object.prototype.method = function (name, func, isBindable) {
    Schema.define(this, [
        Schema.method(name, func, isBindable)
    ]);
};

module.exports = {
    Schema,
    deepMerge,
    StaticSchema
};