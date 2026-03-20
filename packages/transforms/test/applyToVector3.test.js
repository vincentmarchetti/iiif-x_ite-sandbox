import {expect} from "chai";

import {Transform} from  "@kshell/transforms";
import {S,R,T} from "./setup/build_manifesto_transform.js";
import {Vector3} from "threejs-math";

const testCases = [
        [T(1.0,2.0,3.0), new Vector3(4.0, 5.0, 6.0), new Vector3(5.0,7.0,9.0)],
        [R(90 ,0 , 0 ),  new Vector3(0.0, 1.0, 0.0), new Vector3(0.0,0.0,1.0)],
        [R(90 ,90, 0 ),new Vector3(0.0, 1.0, 0.0), new Vector3(0.0,0.0,1.0)],
        [S(2, 3, 4),  new Vector3(1.0, 2.0, 3.0), new Vector3(2.0, 6.0, 12.0)]
    ];
describe("test applyToVector3", function(){

    testCases.forEach( function(testcase) {
        const [man_trans, target, exact_result] = testcase;
        it(`argument: ${man_trans} on ${target}`, function(){
            const transform = Transform.from_manifesto_transform(man_trans);
            expect(transform).to.exist;
            const test_result = transform.applyToVector3(target);
            expect(test_result).to.exist;
            expect(test_result).to.almost.equal(exact_result);            
        });
    });

});