import * as manifesto from "@kshell/manifesto-prezi4";
import {Quaternion, Euler,  IOrder, MathUtils, Vector3} from "threejs-math";


type AxesValues = [number,number,number];
const AxesNames = ["x", "y", "z"];


Vector3.prototype.toString = function(){
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
}

/*
export function extractAxesValues(obj : object, defaultValue:number) : AxesValues{
    return AxesNames.map( (axis_name):number => {
        const c = obj[axis_name];
        if ( c === undefined ) return defaultValue;
        return Number(c);
    }) as AxesValues;
}
*/

export abstract class Transform{

    public static from_manifesto_transform(t:manifesto.ITransform | manifesto.PointSelector ) : Transform{
        if ((t as any).isRotateTransform ){
            /*
            Developer Note 1 Jan 2026: Remember that in threejs-math; Euler angles are defined
            as intrinsic rotations and as such are precisely referred to as Tait-Bryan angles
            */
            const order:string='XYZ';
            const radianValues = (t as manifesto.ITransform).AxesValues.map( MathUtils.degToRad );
            const eulerArgs = [...radianValues, order] as [number,number,number,IOrder];
            const euler = new Euler().fromArray( eulerArgs  );
            const quat = new Quaternion().setFromEuler(euler);
            return new Rotation(quat);
        }
        
        if ((t as any).isTranslateTransform || (t as any).isPointSelector){
            return new Translation( new Vector3().fromArray(t.AxesValues));
        }
        
        if ((t as any).isScaleTransform ) {
            return new Scaling( t.AxesValues as AxesValues );
        }
        

        throw new TypeError(`Transform.from_manifesto_transform unsupported: ${t}`);
    }
    
    
    abstract isIdentity(tolerance?:number):boolean ;
    
    abstract applyToVector3( coord: Vector3 ):Vector3;
    
    abstract applyToPlacement(placement : Placement ):Placement;
    

    abstract get x3dTransformFields():Record<string,number[]>;
}

export class Translation extends Transform {
    readonly vect :Vector3;
    public constructor( vect : Vector3 ){
        super();
        this.vect = vect;       
    }
    
    isIdentity(tolerance:number=1.0e-8):boolean {
        for( let i = 0; i < 3; ++i){
            if (Math.abs(this.vect.getComponent(i as 0|1|2 )) > tolerance)
                return false;        
        };
        return true;
    }
    
    applyToVector3( a:Vector3 ):Vector3{
        const rv = this.vect.clone().add(a);
        return rv;
    }
    
    applyToPlacement( placement:Placement):Placement{
        const translation = new Translation(this.applyToVector3(placement.translation.vect));
        return new Placement(placement.scaling, placement.rotation, translation);
    }
    
    get x3dTransformFields():Record<string,number[]>  {
        if (this.isIdentity(1.0e-8))
            return {} as Record<string,number[]>;
            
        return {"translation" : [ this.vect.x ,this.vect.y, this.vect.z]};
    }
    
    toString(){
        const axes:string[] = this.vect.toArray().map( (val) => val.toFixed(2) );
        return `T(${axes.join(",")})`;
    }
}
export class Rotation extends Transform{

    readonly quat : Quaternion;
    
    public constructor( quat:Quaternion ){
        super();
        this.quat = quat;        
    }
    
    applyToVector3( vect: Vector3 ):Vector3{
        return vect.clone().applyQuaternion(this.quat);
    }
    
    applyToPlacement(placement:Placement):Placement {
        const translation= new Translation(
            placement.translation.vect.clone().applyQuaternion(this.quat)
        );
        
        const rotation = new Rotation(
            this.quat.clone().multiply( placement.rotation.quat )
        );
        return new Placement(placement.scaling, rotation, translation );
    }
        
    static AxisAngle(quat:Quaternion):[Vector3, number]{
        const vec = new Vector3(quat.x, quat.y, quat.z);
        const vlen:number = vec.length();
        const angle = 2.0 * Math.atan2( vlen , quat.w);
        const axis:Vector3 = (vlen > 0.0)? vec.clone().divideScalar(vlen):
                                           new Vector3(1.0,0.0,0.0);
        return [axis,angle];
    }

    isIdentity(tolerance:number = 0.0):boolean{
        const [axis, angle ] =  Rotation.AxisAngle(this.quat);
        return Math.abs(angle) <= tolerance;
    }
    
    get x3dTransformFields():Record<string,number[]>  {
        const [axis, angle ]:[Vector3, number] =  Rotation.AxisAngle(this.quat);
    
        if (Math.abs(angle) <= 1.0e-6)
           return   {} as Record<string,number[]>;
        
        return {"rotation" : [ axis.x, axis.y, axis.z , angle ]};
    }
    
    toString(){
        const axes:string[] = new Euler().setFromQuaternion(this.quat,"XYZ")
                        .toArray().slice(0,3)
                        .map(MathUtils.radToDeg)
                        .map( (val) => val.toFixed(1));
        return `R(${axes.join(",")})`;
                        
    }
}


export class Scaling extends Transform{
    readonly scales: AxesValues;
    
    public constructor( scales: AxesValues ){
        super();
        for(let i=0; i<3;++i)
            if (scales[i] == 0.0)
                throw new Error("0 valued scale axes not supportd");

        this.scales = scales;    
    };
    
    public static  fromScalar( s:number ):Scaling {
        return new Scaling( [s,s,s]);        
    }
    
    isIdentity = (tolerance:number = 1.0e-6):boolean => {
        return this.scales.reduce( (accum: boolean, x:number):boolean => {
            return accum && (Math.abs(Math.log(x)) <= tolerance)
        }, true);
    };
    
    isUniform = (tolerance:number = 0.0): boolean => {
        const testUniform = Math.abs(this.scales[0] );
        for (let i=1; i < 3; ++i)
            if ( Math.abs( Math.abs(this.scales[i]) - testUniform) > tolerance)
                return false;
        return true;
    }
    
    applyToVector3( coord: Vector3 ):Vector3{
        return new Vector3().fromArray(
            this.scales.map( (val:number, index:0 | 1 | 2):number =>{
                return val * coord.getComponent(index);
            })
        );
    }  
    
    /*
    Developer note 2 Jan 2026: The following implementation of applying
    a Scaling transform to a p;acement, an ordered listing of Scaling, Rotation, and
    Translation transforms, relies on one of the following be true:
    1) the existing Rotation in the placement is the identity, so that rotation
       commutes with any scaling.
       OR
    2) the applied Scaling instance ("this") is uniform, the absolute values of the
       scale factors are equal; in this case the Scaling can be decomposed into a
       Rotation and a Scaling which is proportional to +/- the identity. That combination
       can be commute with an arbitray Rotation component of the placement.
       
    For future reference: with some addition implementaton, I think we could handle the
    additional case of a not-uniform scaling commmuting with a placement.rotation which is
    all right-angle turns, equivalent to permutation of axes.
    */
    applyToPlacement(placement : Placement ):Placement {
        
        if ( !this.isUniform() ){
            if ( placement.rotation.isIdentity() ){
                const new_placement:Placement = new Placement();
                new_placement.scaling = new Scaling(
                    this.scales.map( function(val:number,index:number):number{
                        return val * placement.scaling.scales[index];
                    }) as AxesValues
                ) ;
                
                new_placement.rotation = placement.rotation;
                
                new_placement.translation = new Translation(
                    this.applyToVector3(placement.translation.vect)
                );
                return new_placement;
            } else {
                throw new Error("pre contract: cannot apply non-uniform scaling to Placement with rotation");
            }
        }
            
            
        const uscale = Math.abs( this.scales[0]);
        
        const neg_count = this.scales.reduce( (accum:number, value:number):number =>{
                    if (value < 0.0) return accum+1;
                    return accum;
                    }, 0);

        const translation  = new Translation(
            this.applyToVector3(placement.translation.vect)
        );

        const scaling_component:Scaling = (neg_count % 2 == 0)? Scaling.fromScalar(uscale):
                                                      Scaling.fromScalar(-uscale);
                                                      
        const rotation_component : Rotation = ( () => {
            if ( neg_count == 0 || neg_count == 3)
                return new Rotation( new Quaternion() );
                
            const axis = new Vector3(0,0,0);
            const angle:number = Math.PI;
            
            for (let i = 0; i<3;++i){
                if (neg_count == 1 && this.scales[i] > 0.0) continue;
                if (neg_count == 2 && this.scales[i] < 0.0) continue;
                axis.setComponent(i as 0|1|2, 1.0); 
                break;
            }
            return new Rotation(
                new  Quaternion().setFromAxisAngle(axis,angle)
            );
        })();
        
        const rotation = new Rotation(
            rotation_component.quat.clone().multiply( placement.rotation.quat )
        );

        const scaling = new Scaling(
            placement.scaling.scales.map( (v:number, index:number):number =>
                {return v * scaling_component.scales[index as 0|1|2];}
                ) as AxesValues
        );
        return new Placement(scaling, rotation, translation);
    } 
    
    get x3dTransformFields():Record<string,number[]>{
        if (this.isIdentity(1.0e-6))
            return {} as Record<string,number[]>;
        return {"scale" : [this.scales[0] , this.scales[1] , this.scales[2]]};
    }
    
    toString(){
        const axes:string[] = this.scales.map( (val) => val.toFixed(1) );
        return `S(${axes.join(",")})`;
    }
}



export class Placement {
    scaling : Scaling;
    rotation : Rotation;
    translation : Translation;
    
    public constructor( scaling? : Scaling, rotation? : Rotation, translation? : Translation ){
        this.scaling = scaling || new Scaling([1.0,1.0,1.0]);
        this.rotation = rotation || new Rotation( new Quaternion() );
        this.translation = translation || new Translation( new Vector3() );
    }
    
    applyToVector3( coord: Vector3 ):Vector3{
        return this.translation.applyToVector3(
            this.rotation.applyToVector3(
                this.scaling.applyToVector3( coord )
            )
        );
    }
    
    get x3dTransformFields():Record<string,number[]>  {
        
        return [this.translation, this.rotation, this.scaling].reduce(
            function( accum:Record<string,number[]>, t:Transform){
                const x3dfields:Record<string,number[]> = t.x3dTransformFields;
                Object.keys(x3dfields).forEach(function(key:string){
                    accum[key] = x3dfields[key];
                });
                return accum;
            }, {} as Record<string,number[]>
        );
    }
    
    toString(){
        const items:string[] = [this.scaling,this.rotation,this.translation]
                                .map( (t) => t.toString() );
        return `Placement( ${items.join(",")})`;
    }
}

export function transformsToPlacements( transforms:Transform[]):Placement[]{
    const retVal= transforms.reduce( (accum:Placement[], t:Transform, index:number ):Placement[] =>{
        const active_index = accum.length - 1;
        const last_placement:Placement = accum[active_index];
        if ( (t instanceof Scaling) && !((t as Scaling).isUniform()) && !(last_placement.rotation.isIdentity()))
        {
            accum.push( new Placement( t as Scaling) );
            return accum;
        }
        
        accum[active_index] = t.applyToPlacement( last_placement );
        return accum;
    }, [new Placement()]);
    return retVal;
}
