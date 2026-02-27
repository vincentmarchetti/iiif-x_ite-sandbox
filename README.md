
# iiif-x_ite-demo
## edge-growing-bug

This branch illustrates an odd behavior when opening the sandbox page in Edge browser. The left side column, with the x3d-canvas, continues to grow in height after loading the generated 3D scene.

To investigate: Does this behavior also occur with a simple X3D scene loaded from static file?

This may be related to this issue: https://github.com/philipwalton/flexbugs/issues/42

Note added 27 Feb 2026

At

commit 71c7911c579f8a4f62568532efd022c06e20b801 (HEAD -> edge-growing-bug)
Author: Vincent Marchetti <vmarchetti@kshell.com>
Date:   Fri Feb 13 15:21:23 2026 -0500

See the behavior in Edge 145.0.3800 on Windows, 

Not in Firefox. Safari, Chrome on Mac

