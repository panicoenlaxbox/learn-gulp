var $ = require("jquery");
var angular = require("angular");
var lib = require("./lib");

$("#app").html(lib.foo());
console.log(new lib.Point(5,5).toString());