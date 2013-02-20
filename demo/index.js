var createGame = require('voxel-engine')
var voxel = require('voxel')
var player = require('voxel-player')

var glslgen = require('../')
var CellularNoise = require('./cellular')

// setup the game and add some trees
var game = window.game = createGame({
  generate: glslgen([

    // Voronoi/Worley Noise method
    CellularNoise

  , 'void main() {'
    , 'vec3 pos = voxelPosition();'
    , 'vec2 F1 = cellular(pos / 20.0);'
    , 'vec2 F2 = cellular(pos / 31.276);'
    , 'float n1 = F1.y-F1.x;'
    , 'float n2 = F2.y-F2.x;'
    , 'voxelBlock(n2-n1 < max(pos.y * 0.025, 0.0) ? 0.0 : 2.0 + n2 * 4.0);'
  , '}'

  ].join('\n')),
  chunkDistance: 2,
  materials: [
    'dirt',
    ['grass', 'dirt', 'grass_dirt'],
    ['whitewool', 'cobblestone', 'cobblestone'],
    'a1-clay-grey',
    'lampon-redstone',
    'glowstone'
  ],
  texturePath: 'textures/',
  worldOrigin: [0, 0, 0],
  controls: { discreteFire: true },
  chunkSize: 32,
  skyColor: 0xffffff
})

game.appendTo(document.getElementById('container'))
game.scene.fog = new game.THREE.FogExp2( game.skyColor, 0.0015 );

var pp = require('voxel-pp')(game)
var grading = require('voxel-colorist')(pp, {
  table: 'table.png'
})

// create the player from a minecraft skin file and tell the
// game to use it as the main player
var createPlayer = player(game)
var substack = createPlayer('substack.png')
substack.yaw.position.set(0, 0, 0)
substack.possess()

// toggle between first and third person modes
window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === 'R'.charCodeAt(0)) substack.toggle()
})

// block interaction stuff
game.on('fire', function(target, state) {
  var vec = game.cameraVector()
  var pos = game.cameraPosition()
  var point = game.raycast(pos, vec)
  if (!point) return
  var erase = !state.firealt && !state.alt
  if (erase) {
    game.setBlock(point, 0)
  } else {
    game.createBlock(point.addSelf(vec.multiplyScalar(-game.cubeSize/2)), 1)
  }
})

module.exports = game
