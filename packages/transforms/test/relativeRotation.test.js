import {expect} from "chai";

import {relativeRotation, Transform } from  "@kshell/transforms";
import {S,R,T} from "./setup/build_manifesto_transform.js";
import {Vector3} from "threejs-math";




describe("relativeRotation test", function(){

    const testCases=[
        [T(3.0,-2.,2.)],
        [T(0.0,2.0,0.0)],
        [T(-1,4,2)],        // this one is above the aimAt
        [T(3, -5, -7)]
    ];
    
    testCases.forEach(function(testcase){
        const [manifesto_base] = testcase;
        const manifesto_aimAt = T(-1,0,2);
        it(`base : ${manifesto_base} aimAt : ${manifesto_aimAt}`, function(){                    
        
            const base = Transform.from_manifesto_transform(manifesto_base);
            const aimAt= Transform.from_manifesto_transform(manifesto_aimAt);
            
            const unit_direction = new Vector3().subVectors(base.vect,aimAt.vect).normalize();
            
            const x_axis = new Vector3(1,0,0);
            const y_axis = new Vector3(0,1,0);
            const z_axis = new Vector3(0,0,1);
            const rotation = relativeRotation(base, aimAt);

            const [camera_x_axis,camera_y_axis,camera_z_axis] =
                [x_axis,y_axis,z_axis].map( (v) =>
                    v.clone().applyQuaternion( rotation.quat) );
                    
            // geometric tests
            // camera_z_axis is anti-parallel to unit_direction
            expect( 
                new Vector3().crossVectors(camera_z_axis, unit_direction).length()
            ).almost.equal(0.0);
            
            expect(camera_z_axis.dot(unit_direction)).to.almost.equal(-1.0);
            
            
            // camera_x_axis perpendicular to world y_axis
            expect( camera_x_axis.dot(y_axis)).to.almost.equal(0.0);
            
            // unless the direction is straight up or down (parallel
            // or antiparallel to y_axis)
            // want camera_y_axis to have a positive component along the y_axis
            if ( new Vector3().crossVectors(unit_direction, y_axis).length() > 1.0-7){
                expect(y_axis.dot(camera_y_axis)).to.be.above(0.0);
            }
            
        });
    });
        
    it(`edge case: base and aimAt at same location`, function(){
        const location = Transform.from_manifesto_transform( T(-3.45, 0.456,1.0) );
        expect(location).to.exist;
        const result = relativeRotation(location, location);
        expect(result).to.equal(null);
    });

});