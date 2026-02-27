import {manifesto} from "manifesto-prezi4";
import {SceneRender, SceneHooks } from "./SceneRender.ts";

export {manifesto}
export class Manifest3DViewer {

    public readonly browser : any ;
    
    
    public set showAllButton( button:HTMLElement){
        if (button === null){
            logger.warn(`Manifest3DViewer.showAllButton (setter) : null argument`);
        }
        else{
        button.addEventListener("click" , ( event ) => {
            console.debug(`showAllButton click handler fired`);
            this.browser.viewAll();
            });
        }
    };

    
    constructor( container : HTMLElement ){
        const canvas = document.createElement("x3d-canvas");
        container.appendChild(canvas);
        if (canvas.browser == null ){
            throw new Error("Manifest3DViewer.constructor: failed to create X_ITE browser");
        }
        this.browser = canvas.browser;
        console.debug(`created browser: ${this.browser.name}:${this.browser.version}`);
    };
    
    private findAllScenes( manifest : manifesto.Manifest ):Scene[] {
        return manifest.getSequences().map( (seq:Sequence):Scene[] =>{
            return seq.getScenes();
        }).flat();
    };
    
    /*
    intention is that this will be the entry point when a manifest is 
    loaded on startup or through user entry in an editable text box
    */
    public async display( manifest : manifesto.Manifest ):void {
        /*
        manifest will be an instance of Manifest class from manifesto
        */
        console.log(`display manifest ${manifest.id}`);
        /*
        logic is that the first scene will be displayed
        */
        const allScenes = this.findAllScenes(manifest);
        if (allScenes.length > 0){
             await this.renderScene( allScenes[0], manifest);
        } 
        else{
            console.warn("manifest with no Scene resources");
        }        
    };
    
    public async displaySceneById( id : string, manifest: manifesto.Manifest ):void
    {
        
    };
    /*
    Developer note 13 Jan 2026 . THe browser argument is 
    very loosely typed pending figuring out if the X_ITE
    package provides a more explicit type.
    */
    private async renderScene(  scene: manifesto.Scene, 
                                manifest: manifesto.Manifest){
        const scene_handle = new SceneRender(scene, manifest, this.browser);
        const hooks:SceneHooks =  await scene_handle.render();
    };
}


