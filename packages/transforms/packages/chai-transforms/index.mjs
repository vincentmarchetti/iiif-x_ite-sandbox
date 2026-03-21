//const type = require('type-detect')
//import {Vector3}'threejs-math').Vector3;

/*
While not mathematically true,
any javascript object with numeric values
of x,y,z properties is considered a Vector3
*/
function isVector3(vect){
    if ( typeof(vect) != "object" ) return false;
    for(let i = 0; i<3;++i){
        const axis = ["x","y","z"][i];
        const coord = vect[axis];
        if ( typeof(coord) != 'number' ) return false;
    }
    return true;
}

function areAlmostEqualVector3s(vA,vB, tolerance ){
    for (let i=0;i<3;++i){
        const axis = ["x","y","z"][i];
        const err = Math.abs( vA[axis] - vB[axis] );
        if (err > tolerance) return false;
    }
    return true;
}

/**
* returns a function to be passed to chai.use
 * @see http://chaijs.com/guide/plugins/
 */
export function chaiTransforms () {
    return function (chai, utils) {
        function overrideAssertEqual (_super) {
            return function assertEqual (val, msg) {
                if (msg) utils.flag(this, 'message', msg);
                if ( isVector3(val) && isVector3(this._obj )){
                    const tolerance = ( () => {
                        const c = utils.flag(this, "tolerance");
                        if ( c == undefined ) return 0.0;
                        return c;})();
                    
                    const result = areAlmostEqualVector3s(val, this._obj, tolerance);
                    
                    //return this.assert(result);
                    return this.assert(result, `expected ${this._obj} to almost-equal ${val}`);
                } else {
                    return _super.apply(this, arguments);
                }
            }
        }    
        chai.Assertion.overwriteMethod('equal', overrideAssertEqual);
        chai.Assertion.overwriteMethod('equals', overrideAssertEqual);
        chai.Assertion.overwriteMethod('eq', overrideAssertEqual);
    }
}

    
