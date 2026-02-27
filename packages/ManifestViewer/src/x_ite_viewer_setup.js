

/*
Creates a Manifest3DViewer instance inside an existing HTMLElement identified
by id xite-view-container
    -- constructing this instance created both an HTML element with tag x3d-canvas
    -- along with the X_ITE browser object
    
Then configures a handler to a custom event new_manifest fired from document    
*/

import {Manifest3DViewer} from "./Manifest3DViewer.ts";

const XITE_VIEW_CONTAINER="xite-view-container";
const XITE_SHOWALL_BUTTON="xite-show-all";

document.addEventListener("new_manifest", async (event) => {
    console.debug("new_manifest event received for X-ITE viewer");
    const container = document.getElementById(XITE_VIEW_CONTAINER);
    if (container === null)
        throw new Error(`X-ITE setup: getElementById(\"${XITE_VIEW_CONTAINER}\") failed`);
   
    // clear any existing canvas, this code not intended to support
    // multiple canvases on a page
    if (container.childElementCount > 0){
        console.log(`X-ITE viewer: clearing current canvas`);
        container.replaceChildren();
    }     
        
    const viewer = new Manifest3DViewer(container);    
    const showAllButton = document.getElementById(XITE_SHOWALL_BUTTON);
    if (showAllButton == null)
        console.warn(`X-ITE setup: getElementById(\"${XITE_SHOWALL_BUTTON}\") failed`);
    else
        viewer.showAllButton = showAllButton;
    await viewer.display( event.detail.manifest );
});    
console.debug("Added X-ITE listener to document \"new_manifest\" event");
