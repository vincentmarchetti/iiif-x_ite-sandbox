import {expect} from "chai";

import {Transform, transformsToPlacements, Placement} from  "@kshell/transforms";
import {S,R,T} from "./setup/build_manifesto_transform.js";
import {Vector3} from "threejs-math";


describe("x3dTransformFields", function(){
    it("empty object test", function(){
        const placement = new Placement();
        const fields = placement.x3dTransformFields;
        
        expect(fields).to.exist;
        expect(Object.keys(fields)).to.have.lengthOf(0);
    });
    
    /*
    Developer Note Jan 2 2026: Checked X3DV4 Transform node spec
    at https://www.web3d.org/documents/specifications/19775-1/V4.0/Part01/components/grouping.html#Transform
    to confirm that "scale" "translation" and "rotation" are the correct field names
    */
    /*
    The testcase data are (2,) arrays. In each testcase:
    element 0 is either a singleton from the [T,R,S] calls, that is a single manifesto.Transform
                instance OR an array of such instances.
    element 1 is the correct dictionary of X3D Transform node fields. The rotation field
            is a SFRotation data; 4 values
    */
    [
        [[S(2.0,2.0,2.0), R(0,180,0),T(-0.3,0.1,-0.2)],{"scale":[2,2,2], "rotation":[0,1,0,3.1415925], "translation":[-0.3,0.1,-0.2]}],
        [ S(2.0,2.0,2.0), {"scale" : [2,2,2]}],
        [ R(0,180,0),     {"rotation" : [0,1,0,3.1415925]}],
        [ T(-0.3,0.1,-0.2),{"translation":[-0.3,0.1,-0.2]}],
        [ R(0, 75, 15 ),    {"rotation" : [0.12867778, 0.97740474, 0.16769614, 1.33113625]}] ,
        [ S(2,3,4),        {"scale":[2,3,4]}] , 
        [[S(2,3,4)],        {"scale":[2,3,4]}] ,        
    ].forEach(function(tc){
        const [testCase,exactfields] = tc;
        it(`test ${testCase}`, function(){
            
            const x3dfields = function(){
                if (Array.isArray(testCase)){
                    const manifestoList = testCase;
                    const transformsList = manifestoList.map(Transform.from_manifesto_transform);
                    const placements = transformsToPlacements(transformsList);
                    expect(placements).to.be.an('array');
                    expect(placements).to.have.lengthOf(1);
                    return placements[0].x3dTransformFields;
                } else {
                    const transform = Transform.from_manifesto_transform(testCase);
                    return transform.x3dTransformFields;
                }
            }();
            expect(x3dfields).to.exist;
            ["translation","rotation","scale"].forEach( function(field){
                const exactfield = exactfields[field];
                if (exactfield === undefined){
                    expect(x3dfields[field]).to.equal(undefined);
                } else {
                    expect(x3dfields[field]).to.almost.deep.equal(exactfield);
                }
            });
        });
    });
});