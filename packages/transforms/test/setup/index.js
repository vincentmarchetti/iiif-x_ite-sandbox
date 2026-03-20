import * as chai from  "chai";
import chaiAlmost from "chai-almost";
import chaiTransforms from "../../packages/chai-transforms/index.js";


chai.use(chaiAlmost());
chai.use(chaiTransforms());


import {Vector3} from "threejs-math";

Vector3.prototype.toString =  function(){
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
};


/*
const chai = require("chai");
const chaiAlmost = require("chai-almost");
const chaiTransforms = require("../packages/chai-transforms/index.js");
chai.use(chaiAlmost());
chai.use(chaiTransforms());
*/

