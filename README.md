# development branch
This branch will refactor the structure so that the webpage code is at, the ManifestViewer code will be in a subpackage. Eventually the ManifestViewer will be spun into a separate github repo and deployed as a submodule; and that is how webpage variants will be supported.

# iiif-x_ite-demo

IIIF 3D manifest viewer implemented in X_ITE viewer

This project is a Single-Page application which renders a Scene as represented in a IIIF Presentation 4 manifest -- in November 2025 Presentation 4  was a specification in development in IIIF.

The 3D rendering will be accomplished by building an X3D conforming scenegraph within the X_ITE X3D viewer.

Links:
- [IIIF 3D Technical Study Group](https://iiif.io/community/groups/3d/)
- [X_ITE Viewer](https://create3000.github.io/x_ite/)


On initial clone into a local repository

Initialize and checkout the three submodules within
git submodule init
git submodule update

optionally, in any or each submodule
git checkout main
git pull


then in each submodule
- npm install
- npm run build

in this order, required for dependencies
manifesto-prezi4
x3d_transforms
manifest-viewer_