const { Schema, deepMerge, StaticSchema } = require('../');
const _ = require("lodash");

class Model {
    static fields = {
        id: null,
        uid: null,
        __owner: null,
        __access: {},
        __version: 0,
        __created: null,
        __changed: null,
        __deleted: null
    };
    static views = {
        default: ['uid']
    };

    constructor(fields = {}) {
        this.reset(fields);
    }

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

    view(name = 'default') {
        let views = this.constructor.schema('views');
        return _.pick(this, views[name]);
    }
}

class User extends Model {
    static fields = {
        name: ""
    };
    static views = {
        default: ['name']
    };

    constructor(fields) {
        super(fields);
    }
}

let u = new User();
console.log(`user: `, u);
console.log(`user default: `, u.view());


let testObj = {};
Object.definePublic(testObj, 'val1', 78);
console.log(testObj);
