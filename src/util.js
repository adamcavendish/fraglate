'use strict';

// check `value` is null or undefined
module.exports.isNil = function(value) {
    return value == null;
};

// check `value` is null
module.exports.isNull = function(value) {
    return value === null;
};
