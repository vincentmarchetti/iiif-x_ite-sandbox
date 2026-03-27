import {fetch_manifest_json} from "@kshell/manifest-viewer";
import * as manifesto  from "@kshell/manifesto-prezi4" ;



/*
    handle_manifest_json is called when an object has
    been parsed from manifest json text.
    
    It is intended to be defined in the global scope so that
    it can be invoked dynamically over the course of a pages lifescycle,
    such as 
        -- on document loading, when a manifest is fetched from a url defined 
           in window.location
        -- on user request to fetch a manifest from a url entered into HTML input
        -- on user request when manifest text is entered or copied into HTML input
*/

const FALLBACK_MANIFEST_URL="https://raw.githubusercontent.com/IIIF/3d/refs/heads/main/manifests/3_lights/multiple_lights_with_intensities_and_colors.json";
async function load_manifest(){
    const data = await ( async () => {
        try{
            return await fetch_manifest_json(window.location, FALLBACK_MANIFEST_URL);
        }  catch (error){
            const message = ( (e) => {
                if (e instanceof Error ) return e.message;
                return String(e);
            })(error);
            window.alert(message);
            console.error(message);
            return null;
        }
    })();
    
    if (data != null){
        const manifest = new manifesto.Manifest(data, {});
        document.dispatchEvent( new CustomEvent("new_manifest", { "detail" : {"manifest" : manifest }}) );
    } else {
        console.error(`load_manifest: no url provided to load`);
    }
}



document.addEventListener("DOMContentLoaded", async () => {
    await load_manifest();
})
