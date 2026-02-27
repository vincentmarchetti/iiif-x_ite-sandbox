import {manifesto} from "manifesto-prezi4";
import {Transform, transformsToPlacements, Rotation, Translation, Placement } from "../packages/transforms/dist";
import {Quaternion, Vector3, MathUtils} from "threejs-math";

// Developer Note: Jan 13 2026, import of render_stub_content is strictly a 
// development feature, not relevant to production level
import {render_stub_content} from "./render_stub_content.ts";
import {expect} from "chai";


/*
Code in this module assumes there is an object X3D in the global context due
to having imported the X_ITE library. This will be sanity-checked in the
constructor for the SceneRender class
*/

/*
SceneHooks will be an instance with a number of elements
referring to HTMLElements inside the scene, or other constructs,
that can be used to client to connect to external UI elements
for the purpose of modifying the scene.

It will support the mechanism by which activating annotations are triggered
by HTML events.
*/
export interface SceneHooks {
    NavigationInfo : any
};


function getTransformsForBody( resource : manifesto.ManifestResource):Transform[] {
    if (resource.isSpecificResource ){
        return (resource.getTransform())
            .map( Transform.from_manifesto_transform );
    };
    return ( [] as Transform[] );
};

function getTransformsForTarget( resource : manifesto.ManifestResource):Transform[] {
    if ( resource.isSpecificResource  || 
        (resource.getSelector && resource.getSelector().isPointSelector()) ){
        const selector : manifesto.PointSelector = (resource as SpecificResource).getSelector();
        return [ Transform.from_manifesto_transform(selector )];
    };
    return ( [] as Transform[] );
};

function thisOrSource(resource: manifesto.ManifestResource):manifesto.ManifestResource{
    if (resource.isSpecificResource )
        return resource.getSource();
    return resource;
}

export class SceneRender {

    private readonly browser:any;
    private readonly scene : manifesto.Scene;
    
    private readonly defaultBackground = {
        red: 236,
        green: 236,
        blue: 236
    };
    
    /*
    Developer note: Jan 13 2026 at initial implementation
    a stored reference to the manifest is being maintained with the
    thought that it may be needed in the future, but at this
    stage there is no explicit reason for keeping it.
    */
    private readonly manifest : manifesto.Manifest;
    
    private hooks: SceneHooks = {
        NavigationInfo: null
    };
    
    public constructor( scene : manifesto.Scene, manifest : manifesto.Manifest, browser : any){
        this.scene =scene;
        this.manifest = manifest;
        this.browser = browser;
        
        if ( X3D == undefined ){
            throw new Error("global X3D not defined in SceneRender.constuctor");
        }
    };
    
    private scene_x = null;
    
    private createNode( tag:string ) {
        if (this.scene_x == null){
            throw new Error("SceneRender.createNode: scene_x not initialized");
        }
        console.debug(`SceneRender.createNode ${tag}`);
        return this.scene_x.createNode(tag);
    }
    
    /*
    Developer note: 13 Jan 2026 Functionally this should be put in the
    constructor, but I have a superstition agains putting a instance constructor
    inside an await loop. 
    Clients should call this function asynchrously after constucting the
    SceneRender instance synchronously
    */
    public async render() : SceneHooks {
        console.debug( `enter SceneRende.render for scene ${this.scene.id}`);
        
        /*
        scene_x is a constructed representation of the scenegraph int he X_ITE 
        context. It is roughly  the Scene element in the X3D as well as the DOM tree. 
        Strictly, it  it is not an X3D node.
        
        Calling it scene_x to avoid confusion with this.scene, the static IIIF resource
        as represented in manifesto
        */
        this.scene_x =  await this.browser.createScene();
        
        this.addNavigationInfo(  this.scene_x.rootNodes );
        this.addDefaultLighting( this.scene_x.rootNodes );
        this.addBackground(      this.scene_x.rootNodes );
        
        this.scene.annotationPages.forEach( (page:manifesto.AnnotationPage) => {
            this.addAnnotationPage(this.scene_x.rootNodes, page);
        });
        
        await this.browser.replaceWorld(this.scene_x); 
        //await render_stub_content(this.browser);
        
        
        return this.hooks;
    }
    
    private addNavigationInfo(container):void {
        const navInfo = this.createNode("NavigationInfo");
        navInfo.headlight = new X3D.SFBool(true);
        this.hooks.NavigationInfo = navInfo;
        container.push(navInfo);
    }
    
    private addBackground(container):void {
        const rgb = this.scene.getBackgroundColor() ?? this.defaultBackground;
                                
        // convert red, green, blue values of rgn to 
        // floats in range [0.0,1.0]
        const values:number[] = [rgb.red, rgb.green, rgb.blue]
                                .map( (v) => Math.min(Math.round(v/0.255)*0.001, 1.0));
        const backGround = this.createNode("Background");
        backGround.skyColor = new X3D.MFColor(new X3D.SFColor(...values));
        container.push(backGround);
    }
    
    private addAnnotationPage(container, page: manifesto.AnnotationPage):void {
        const group  = this.createNode("Group");
        page.getAnnotations().forEach( (anno:manifesto.Annotation):void => {
            this.addAnnotation( group.children , anno );
        });
        container.push(group);
    }
    
    private addDefaultLighting(container):void {
        const directionData = [ [0.0 , -0.81649658, -0.57735027] ,
                                [-0.5, -0.81649658,  0.28867513],
                                [+0.5, -0.81649658,  0.28867513]];
        directionData.forEach( (vec) => {
            const light = this.createNode("DirectionalLight");
            light.direction = new X3D.SFVec3f(...vec);
            light.global =    new X3D.SFBool(true);
            light.intensity = new X3D.SFFloat(1.0);
            light.ambientIntensity = new X3D.SFFloat(0.5);
            container.push(light);        
        });
    }
    
    private addAnnotation(container, anno:manifesto.Annotation):void {
        console.debug(`enter SceneRender.addAnnotation ${anno.id}`);
        const bodyOrNull = this.chooseBody( anno.getBody());
        if (bodyOrNull == null) return
        
        
        const body:manifesto.ManifestResource = bodyOrNull as manifesto.ManifestResource;
        expect(body, "SceneRender.addAnnotation  body").to.exist;
        const bodySource:ManifestResource = thisOrSource(body);
        const target = anno.getTarget();
        
        //if (bodySource instanceof manifesto.Model)
        if (bodySource.isModel())
            return this.addModel(container, anno, body,target);

        if (bodySource.isCamera )
            return this.addCamera(container, anno, body, target);
            
        console.warn(`unsupported body type`);
        return;
    }
    
    private addModel(   container, 
                        anno : manifesto.Annotation,
                        body : manifesto.ManifestResource, 
                        target: manifesto.ManifestResource):void{
                        
        const prettyPrint = (tlist:Transform[]):string => {
            const subs = tlist.map( (t:Transform):string =>
                {return t.toString();});
            return subs.join();
        }
        
        const model:manifesto.Model = thisOrSource(body);
        console.debug(`adding model ${model.id}`);
        
        const inline = this.createNode("Inline");
        inline.url = new X3D.MFString([ model.id ]);
            
        const net_transforms =  [   ...getTransformsForBody(body),
                                    ...getTransformsForTarget(target) ];
        ( (to_console:bool) => {
            const items:string[] = net_transforms.map((item) => item.toString());
            const msg:string = `SceneRender.addModel net_transforms: ${items.join()}`;
            if (to_console) console.debug(msg);
        })(true);
                                    
        const placements = transformsToPlacements( net_transforms );
        
        ( (to_console:bool) => {
            const items:string[] = placements.map((item) => item.toString());
            const msg:string = `SceneRender.addModel placements: ${items.join()}`;
            if (to_console) console.debug(msg);
        })(true);
        
        const setTransformNodeField = {
            "translation"   : ((node, c) => {node.translation = new X3D.SFVec3f(...c);}),
            "rotation"      : ((node, c) => {node.rotation =    new X3D.SFRotation(...c);}),
            "scale"         : ((node, c) => {node.scale =       new X3D.SFVec3f(...c);})
        };
        
        const outerNode = placements.reduce( (accum, placement: Placement) => {
            const x3dFields:Record<string,number[]> = placement.x3dTransformFields;
            const entries = Object.entries(x3dFields);
            if (entries.length > 0){
                const newNode = this.createNode("Transform");

                entries.forEach( (entry )=> {
                    const [name, value] = entry;
                    if      (name === "rotation") 
                        newNode.rotation = new X3D.SFRotation(...value);
                    else if (name === "translation")
                        newNode.translation = new X3D.SFVec3f(...value);
                    else if (name === "scale")
                        newNode.scale = new X3D.SFVec3f(...value);
                    else 
                        throw new Error(`SceneRender.addModel : unrecognized Transform field name ${name}`);
                    
                });
                
                newNode.children.push(accum);
                return newNode;
            }
            return accum;
        },
        inline);        
        container.push(outerNode);
        return;                       
    }

    private addCamera(  container, 
                        anno : manifesto.Annotation,
                        body : manifesto.ManifestResource, 
                        target: manifesto.ManifestResource):void{
        
        const net_transforms =  [   ...getTransformsForBody(body),
                                    ...getTransformsForTarget(target) ];
        ( (to_console:bool) => {
            const items:string[] = net_transforms.map((item) => item.toString());
            const msg:string = `SceneRender.addModel net_transforms: ${items.join()}`;
            if (to_console) console.debug(msg);
        })(true);
                                    
        const placements = transformsToPlacements( net_transforms );
        if (placements.length > 1){
            console.warn(`invalid transforms for Camera body`);
        } 
        const cameraLocation:[number,number,number] = 
            placements[0]?.translation.x3dTransformFields.translation ?? [0.0,0.0,0.0];
        console.debug(`cameraLocation ${cameraLocation}`);
          
        const camera:manifesto.Camera = thisOrSource(body);     
        const lookAt =   camera.LookAt;
        
        const cameraTransform:Rotation  = ( lookAt == null )?
                this.cameraOrientationFromTransform(placements):
                this.cameraOrientationFromLookat( cameraLocation, lookAt); 
        const cameraOrientation: [number,number,number,number] = 
            cameraTransform.x3dTransformFields.rotation ?? [0.0,0.0,1.0,0.0];
        console.debug(`cameraOrientation ${cameraOrientation}`);
                
        const cameraCenterTransform:Translate = (lookAt == null)?
            this.centerFromTarget(target):
            this.centerFromLookat(lookAt);
        const cameraCenterOfRotation:[number,number,number] =
            cameraCenterTransform.x3dTransformFields.translation ?? [0.0,0.0,0.0];
        console.debug(`cameraCenterOfRotation ${cameraCenterOfRotation}`);
        
        const cameraNode = this.buildCameraNode( camera);
        cameraNode.orientation = new X3D.SFRotation(...cameraOrientation);
        cameraNode.position = new X3D.SFVec3f(...cameraLocation);
        cameraNode.centerOfRotation = new X3D.SFVec3f( ...cameraCenterOfRotation);
        container.push( cameraNode );
        return;
    }
       
    private cameraOrientationFromTransform(placements: Placement[]):Rotation {
        return placements[0]?.rotation ?? new Rotation( new Quaternion());
    }
    
    private cameraOrientationFromLookat( cameraLocation, lookAt):Rotation {
        throw new Error("SceneRender.cameraOrientationFromLookat unimplemented");
    }
    
    private buildCameraNode( camera ){
        if (camera.isPerspectiveCamera){
            let retVal = this.createNode("Viewpoint");
            let fov = camera.FieldOfView ?? 45.0;
            let fov_rad = MathUtils.degToRad( fov );
            retVal.fieldOfView = new X3D.SFFloat(fov_rad);
            return retVal;
        }
        throw new Error(`SceneRender.buildCameraNode unsupported camera`);
    };
    
    private centerFromTarget(target){
        const placements = transformsToPlacements(getTransformsForTarget(target));
        if (placements.length == 0) return new Translation(new Vector3());
        return placements[0].translation;
    }
    
    private centerFromLookat(lookat){
        throw new Error(`SceneRender.centerFromLookat not implemented`);
    }
    
    private chooseBody( resources : manifesto.ManifestResource[] ): ManifestResource | null {
        if (resources.length == 0) return null;
        return resources[0];
    }
}