"use strict";
BigInt.prototype.toJSON = function () {
    return this.toString();
};
