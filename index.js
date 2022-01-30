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

const ObjectExtension = Schema([
    Schema.method('definePublic', function (ctx, name, value) {
        Schema.define(ctx, [
            Schema.public(name, value)
        ]);
    }),
    Schema.method('defineProtected', function (ctx, name, value) {
        Schema.define(ctx, [
            Schema.protected(name, value)
        ]);
    }),
    Schema.method('defineReadonly', function (ctx, name, value) {
        Schema.define(ctx, [
            Schema.readonly(name, value)
        ]);
    }),
    Schema.method('defineMethod', function (ctx, name, func, isBindable) {
        Schema.define(ctx, [
            Schema.method(name, func, isBindable)
        ]);
    })
]);

ObjectExtension.apply(Object);

module.exports = {
    Schema,
    deepMerge,
    StaticSchema
};