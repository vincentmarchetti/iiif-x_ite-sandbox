import {expect} from "chai";

import {Transform, transformsToPlacements} from  "@kshell/transforms";
import {S,R,T} from "./setup/build_manifesto_transform.js";
import {Vector3} from "threejs-math";

function applyListToVector3(operatorList, vect){
    return operatorList.reduce( function(accum,operator){
        return operator.applyToVector3(accum);
    },
    vect);
}

/*
const testCases = [
        [S(1,1,1),R(90,0,0),T(1.0,2.0,3.0)],
        [T(1.0,2.0,3.0),R(90,0,0),S(1,1,1)],
        [T(1.0,2.0,3.0),R(90,0,0),R(0,45.0,0),S(1,1,1)]
    ];
*/

describe(`transformsToPlacements`, function(){

    [
        [[S(1,1,1),R(90,0,0),T(1.0,2.0,3.0)],              1],
        [[T(1.0,2.0,3.0),R(90,0,0),S(1,1,1)],              1],
        [[T(1.0,2.0,3.0),R(90,0,0),R(0,45.0,0),S(1,1,1)],  1],
        [[S(2,3,4)],                                       1],
        [[S(1,2,1),T(1.9,-2,0),R(0,30,0),S(-1,0.5,2)],     2]
    ].forEach( function(testCase){
        const [manifestoList, exact_placements_length] = testCase;
        it(`argument [${manifestoList}]`, function(){        
            const transformsList = manifestoList.map(Transform.from_manifesto_transform);
            expect(transformsList).to.be.a('array');
            
            let placements = transformsToPlacements(transformsList);
            expect(placements).to.be.a('array');
            expect(placements).to.have.lengthOf(exact_placements_length);
            
            const testCoords = [0.0,1.0];
            for (let i = 0; i<2;++i)
            for (let j = 0; j<2;++j)
            for (let k = 0; k<2;++k){
                const target = new Vector3(testCoords[i],testCoords[j],testCoords[k]);
                const applied_transforms = applyListToVector3(transformsList, target);
                const applied_placements = applyListToVector3(placements    , target);
                expect(applied_placements).to.almost.equal(applied_transforms);
            }
        });
    });
});




