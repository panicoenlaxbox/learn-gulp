import $ from "jquery";
import angular from "angular";
import * as lib from "./lib";

$("#app").html(lib.foo());
console.log(new lib.Point(5, 5).toString());