var lut = require('lut')
  , copyshader = require('three-copyshader')

module.exports = function(fragmentShader, options, setup) {
  if (typeof options === 'function') {
    setup = options
    options = {}
  }

  options = options || {}
  setup = setup || function(){}

  var temp2d = document.createElement('canvas').getContext('2d')
    , cacheSize = options.cacheSize || 4
    , THREE
    , chunkSize
    , chunkSizeSquared
    , table
    , target
    , camera
    , quad
    , scene
    , shader
    , offset

  // Run this once to pick up game, then swap
  // out for the main function.
  function firstGenerate(x, y, z, n, game) {
    THREE = game.THREE

    chunkSize = Math.min(options.chunkSize || game.chunkSize, 32)
    chunkSizeSquared = chunkSize * chunkSize

    table = lut(chunkSize, chunkSize, chunkSize)
    temp2d.canvas.width = chunkSizeSquared
    temp2d.canvas.height = chunkSize

    shader = new THREE.ShaderMaterial({
      fragmentShader: [
          'uniform sampler2D glslgen_table;'
        , 'uniform vec3 glslgen_offset;'
        , 'const float glslgen_chunkSize = ' + ~~chunkSize + '.0;'
        , 'varying vec2 vUv;'

        , 'void voxelBlock(float i) {'
        , 'gl_FragColor.r = floor(i) / 255.0;'
        , 'gl_FragColor.gba = vec3(0.0, 0.0, 1.0);'
        , '}'

        , 'vec3 voxelPosition() {'
        , 'vec3 pos = texture2D(glslgen_table, vUv).rgb * glslgen_chunkSize + glslgen_offset;'
        , 'pos.y *= -1.;'
        , 'return pos;'
        , '}'

        , fragmentShader
      ].join('\n'),
      vertexShader: copyshader.vertexShader,
      uniforms: THREE.UniformsUtils.merge([{
        glslgen_table: { type: 't', value: null },
        glslgen_offset: { type: 'v3', value: new THREE.Vector3(1, 1, 1) }
      }])
    })

    target = new THREE.WebGLRenderer
    camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 )
    quad = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), shader )
    scene = new THREE.Scene

    scene.add(quad)
    target.setSize(chunkSizeSquared, chunkSize)
    target.setClearColorHex(0x000000, 1)
    target.clear()

    offset = shader.uniforms.glslgen_offset.value
    shader.uniforms.glslgen_table.value = new THREE.Texture(table)
    shader.uniforms.glslgen_table.value.needsUpdate = true

    setup(shader)

    return (generate = glslGenerate)(x, y, z)
  };

  var chunkIndex = {} // @todo clear the cache
    , chunkList = []

  function glslGenerate(x, y, z) {
    var X = Math.floor(x / chunkSize) * chunkSize
    var Y = Math.floor(y / chunkSize) * chunkSize
    var Z = Math.floor(z / chunkSize) * chunkSize
    var idx = (x-X) + (z-Z) * chunkSize + (y-Y) * chunkSizeSquared
    var key = X + '|' + Y + '|' + Z

    chunkIndex[key] = chunkIndex[key] || render(X, Y, Z, key)
    return chunkIndex[key][idx * 4];
  };

  function render(x, y, z, key) {
    var gl = target.context
    offset.x = x
    offset.y = - (y + chunkSize)
    offset.z = z
    chunkList.push(key)
    if (chunkList.length > cacheSize) delete chunkIndex[chunkList.unshift()]
    target.render(scene, camera)
    temp2d.drawImage(target.domElement, 0, 0)
    return temp2d.getImageData(0, 0, temp2d.canvas.width, temp2d.canvas.height).data
  };

  var generate = firstGenerate
  return function (x, y, z, n, game) {
    return generate(x, y, z, n, game)
  };
};
