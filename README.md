# voxel-glslgen #

Push voxel terrain generation to the GPU using a GLSL shader. This is just
a WIP and an experiment with offloading computation to a shader, so no
guarantees that it is *actually* faster than vanilla JavaScript - but feel
free to submit a Pull Request with performance/API improvements.

## Installation ##

``` bash
npm install voxel-glslgen
```

## Usage ##

**glslgen(shader)**

Takes a string fragment shader and returns a generate function.

``` javascript
var createGame = require('voxel-engine')
  , glslgen = require('voxel-glslgen')

var game({
  generate: glslgen([
    'void main() {'
    , 'vec3 pos = voxelPosition();'
    , 'voxelBlock(pos.y < 0.0 ? 1.0 : 0.0);'
  , '}'
  ].join('\n'))
})
```

The module exposes two GLSL functions:

* `vec3 voxelPosition()` - returns the x,y,z coordinates of the current voxel.
* `void voxelBlock(n)` - set the voxel block index.
