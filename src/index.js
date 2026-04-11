import {fetch_manifest_json, initialize_x_ite_viewer} from "@kshell/manifest-viewer";
import * as manifesto  from "@kshell/manifesto-prezi4" ;
import * as jsonlint   from "@prantlf/jsonlint";


async function load_manifest_text(){
    const manifestText = document.querySelector("textarea#manifest-text").value;
    console.info(`manifest text: ${manifestText.length} characters`);
    try{
        const json     = jsonlint.parse(manifestText);
        const manifest = new manifesto.Manifest(json, {});
        clear_parsing_result();
        await document.dispatchEvent( new CustomEvent("new_manifest", { "detail" : {"manifest" : manifest }}) );
    }
    catch (error ){
        console.info(`jsonlint parse failed with ${error}`);
        show_parsing_error(error);
        return;
    }
    return;
}

const PARSING_RESULT = "load-result-message";
function clear_parsing_result(){
    const result_div = document.getElementById( PARSING_RESULT );
    result_div.innerText = "";
    result_div.className = "success-parsing";
}

function show_parsing_error( errorMessage ){
    const result_div = document.getElementById( PARSING_RESULT );
    result_div.innerHTML = `<pre>${errorMessage.toString().trim()}</pre>`;
    result_div.className = "failed-parsing";
}

document.addEventListener("DOMContentLoaded", async () => {
    document
    .querySelector("button#load-manifest-from-text")
    .addEventListener("click",  async () => {
        await load_manifest_text();
    });
    console.debug("DOMContentLoaded listener added to window");
    
    // Developer note 4/11/2026 : The variable X3D is imported into global scope 
    // by the index.html script element loadeding x_ite.js
    initialize_x_ite_viewer(X3D);
    // if the text already has a manifest, then try to load it
    // the length text is intended to allow putting something
    // like "Insert Manifest here"
    if (document.querySelector("textarea#manifest-text").value.length > 32)
        await load_manifest_text();
});    

