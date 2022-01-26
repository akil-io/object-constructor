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

module.exports = {
    Schema,
    deepMerge,
    StaticSchema
};