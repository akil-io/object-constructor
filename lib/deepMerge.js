const _ = require("lodash");

function deepMerge(source, ...target) {
    function customizer(objValue, srcValue) {
        if (_.isArray(objValue)) {
            return objValue.concat(srcValue);
        }
    }

    let result = Object.assign({}, source);
    for (let item of target) {
        result = _.mergeWith(source, item, customizer);
    }

    return result;
}

module.exports = {
    deepMerge
};