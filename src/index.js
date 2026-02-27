require("ManifestViewer/src/x_ite_viewer_setup.js");

/*
Developer note 12/17/2025 : manifesto is being brought in here
for the purpose of allowing the function handle_manifest_json to
construct an instance of manifesto.Manifest

It is not intended to put manifesto or its contents into global scope
but for all I know that's an unintended consequence.
*/
const manifesto = require("manifesto-prezi4");


import {fetch_manifest_json} from "ManifestViewer/src/fetch_manifest_json.ts";

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

const FALLBACK_MANIFEST_URL="https://spri-open-resources.s3.us-east-2.amazonaws.com/iiif3dtsg/tipped_astronaut/tipped_and_rotated_astronaut.json";
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
