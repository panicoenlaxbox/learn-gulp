declare var global: any;
import Vue = require("vue");
import * as lib from "./lib";
var app = new Vue({
    el: '#app',
    data: {
        message: lib.foo()
    }
});
global.app = app;
var point = new lib.Point(3,5);
console.log(point.toString());