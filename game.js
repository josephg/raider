// Avaliable globals:
// ctx (rendering context)
// width, height (the width and height of the window)
const TAU = Math.PI * 2

const spells = {
  fireball: {
    casttime: 3,
    damage: 100,
    mana: 100,
    cooldown: 0,
    color: 'red',
  },

  fireblast: {
    casttime: 0,
    damage: 80,
    mana: 150,
    cooldown: 4,
    color: 'orange'
  }
}

const castBar = ['fireball', 'fireblast']

const keysHeld = new Set()
const keysPressedThisFrame = []

const spellbook = {}
castBar.forEach(name => {
  spellbook[name] = {
    readyAt: 0, // time at which the spell has cooled down
  }
})

// Mmmm for now they're just blobs of data.
const entities = new Set()

// An entity
const player = {
  x: width/2,
  y: height/2,
  color: 'green',
  casting: null,
}
entities.add(player)

function frame() {
  update()
  render()
  requestAnimationFrame(frame)
}

function update() {
  const now = Date.now() / 1000
  const dt = 1/60

  for (const code of keysPressedThisFrame) {
    if (code.startsWith('Digit')) {
      const keyNum = code.slice(5) | 0
      const name = castBar[keyNum - 1]
      if (name) {
        const spellEntry = spellbook[name]
        const spell = spells[name]
        const now = Date.now() / 1000

        if (spellEntry.readyAt < now) {
          console.log('casting', name)
          player.casting = null
          if (spell.cooldown) {
            spellEntry.readyAt = now + spell.cooldown
          }

          if (spell.casttime) {
            player.casting = {name, readyAt: now + spell.casttime}
          }
        }
      }

    }
  }

  if (player.casting) {
    const {name, readyAt} = player.casting
    if (readyAt < now) {
      // TODO: Move me to update function
      console.log('pew!', name)
      player.casting = null
    }
  }

  const playerSpeed = 100
  if (keysHeld.has('KeyA')) player.x -= playerSpeed * dt
  if (keysHeld.has('KeyD')) player.x += playerSpeed * dt
  if (keysHeld.has('KeyW')) player.y -= playerSpeed * dt
  if (keysHeld.has('KeyS')) player.y += playerSpeed * dt

  keysPressedThisFrame.length = 0
}

const circle = (cx, cy, r) => {
  ctx.arc(cx, cy, r, 0, TAU)
}

function render() {
  ctx.fillStyle = '#150505'
  ctx.fillRect(0, 0, width, height)

  // Entities
  for (const e of entities) {
    ctx.beginPath()
    circle(e.x, e.y, 12)

    ctx.fillStyle = e.color
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.stroke()
  }

  // Abilities
  const frameSize = 50
  const now = Date.now() / 1000
  castBar.forEach((name, i) => {
    const spell = spells[name]
    ctx.fillStyle = spell.color
    ctx.fillRect(i*frameSize, height-frameSize, frameSize, frameSize)
    ctx.strokeStyle = 'black'
    ctx.strokeRect(i*frameSize, height-frameSize, frameSize, frameSize)

    ctx.fillStyle = 'black'
    ctx.textBaseline = 'top'
    ctx.font = '15px sans-serif'
    ctx.fillText(''+(i+1), i*frameSize + 2, height-frameSize + 2)

    const {readyAt} = spellbook[name]
    if (readyAt > now) {
      const f = (readyAt - now) / spell.cooldown
      //console.log(f)

      ctx.fillStyle = '#00000040'
      ctx.fillRect(i*frameSize, height-frameSize, frameSize, frameSize)

      ctx.fillStyle = '#00000080'
      ctx.fillRect((i + (1-f))*frameSize, height-frameSize, frameSize * f, frameSize)

    }
  })

  // Cast bar
  if (player.casting) {
    const {name, readyAt} = player.casting
    const barWidth = width/5
    const barHeight = 30
    const x = (width - barWidth) / 2
    const y = height * (5/8)

    const spell = spells[name]
    ctx.fillStyle = '#00000030'
    ctx.fillRect(x, y, barWidth, barHeight)
    ctx.fillStyle = spell.color

    const f = 1 + (now - readyAt) / spell.casttime
    ctx.fillRect(x, y, barWidth * f, barHeight)
    ctx.strokeStyle = 'white'
    ctx.strokeRect(x, y, barWidth, barHeight)
  }

}

frame()

window.onkeydown = (e) => {
  //console.log(e.code)
  keysHeld.add(e.code)
  keysPressedThisFrame.push(e.code)
  // 1 key == keyCode 49.
  //console.log(e)
}

window.onkeyup = e => {
  keysHeld.delete(e.code)
}

window.onblur = () => {
  keysHeld.clear()
}

