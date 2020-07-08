// --------------------------
// Variables
// --------------------------

const fps = 60,
	  step = 1/fps,

	  canvas = document.querySelector('canvas'),
	  ctx = canvas.getContext('2d'),
	  width = canvas.width,
	  height = canvas.height

// --------------------------
// Sprites & Animations
// --------------------------

const UNICORN_IMAGE = new Image()
UNICORN_IMAGE.src = "horses.png"

const SPRITES = {
	UNICORN_RUNNING_A: {x:1,y:1,w:98,h:62},
	UNICORN_RUNNING_B: {x:1,y:64,w:98,h:62},
	UNICORN_RUNNING_C: {x:1,y:127,w:98,h:62},
	UNICORN_RUNNING_D: {x:1,y:190,w:98,h:62},

	UNICORN_WALKING_A: {x:100,y:1,w:98,h:62},
	UNICORN_WALKING_B: {x:100,y:64,w:98,h:62},
	UNICORN_WALKING_C: {x:100,y:127,w:98,h:62},
	UNICORN_WALKING_D: {x:100,y:190,w:98,h:62},

	UNICORN_STOPPED: {x:199,y:190,w:98,h:62},
}

const STARS_IMAGE = new Image()
STARS_IMAGE.src = "stars.png"

const ANIMATIONS = {
	UNICORN_RUN: [
		{ distance: 50, sprite: SPRITES.UNICORN_RUNNING_A },
		{ distance: 50, sprite: SPRITES.UNICORN_RUNNING_B },
		{ distance: 50, sprite: SPRITES.UNICORN_RUNNING_C },
		{ distance: 50, sprite: SPRITES.UNICORN_RUNNING_D },
	],
	UNICORN_WALK: [
		{ distance: 20, sprite: SPRITES.UNICORN_WALKING_A },
		{ distance: 20, sprite: SPRITES.UNICORN_WALKING_B },
		{ distance: 20, sprite: SPRITES.UNICORN_WALKING_C },
		{ distance: 20, sprite: SPRITES.UNICORN_WALKING_D },
	],
	UNICORN_STOP: [
		{ distance: 0, sprite: SPRITES.UNICORN_STOPPED },
	]
}

function drawSprite (sprite,x,y) {
	ctx.drawImage(UNICORN_IMAGE,sprite.x,sprite.y,sprite.w,sprite.h,x,y,sprite.w,sprite.h)
}

// --------------------------
// Entities
// --------------------------

const UNICORN_STATE = {STOPPED: 0, WALKING: 1, RUNNING: 2}

const unicorn = {
	x: 0,
	y: height - 62 - 55,

	state: UNICORN_STATE.STOPPED,
	sprite: SPRITES.UNICORN_STOPPED,

	active: false,
	
	dx: 0,
	ddx: 1,
	maxdx: 700,

	animation: ANIMATIONS.UNICORN_STOP,
	animationFrame: 0,
	animationDistance: 0
}

const hills = [
	{
		color: "#424660",
		widthRange: [75,200],
		heightRange: [70,130],
		paralax: 0.1,

		points: [],
		covered: 0
	},
	{
		color: "#5e6278",
		widthRange: [75,150],
		heightRange: [120,150],
		paralax: 0.8,

		points: [],
		covered: 0
	},
]

// --------------------------------
// Utilities
// --------------------------------

function timestamp() {
	return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
}

function randomBetween (min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

function curveBetweenPoints (x1,y1, x2,y2) {
	return x => ((y1 - y2) * Math.cos(Math.PI * (x - x1) / (x2 - x1)) + y1 + y2)/2
}

// --------------------------
// Update
// --------------------------

function updateHill (hill, dt) {
	const toDelete = []
	for (i=0; i<hill.points.length; i++) {
		if (hill.points[i].x < 0 && hill.points[(i+1)%hill.points.length].x < 0) {
			toDelete.push(i)
			hill.covered -= hill.points[i].w
		} else {
			hill.points[i].x -= unicorn.dx * dt * hill.paralax
		}
	}

	toDelete.forEach(i => hill.points.splice(i,1))

	while (hill.covered < width + hill.widthRange[1]*2) {
		const width = randomBetween(...hill.widthRange)
		hill.points.push({x: hill.covered, y: randomBetween(...hill.heightRange), w: width})
		hill.covered += width
	}
}

function updateHills (dt) {
	hills.forEach(hill => updateHill(hill, dt))
}

function updateUnicorn (dt) {

	// Update position and speed

	if (unicorn.active && unicorn.dx < unicorn.maxdx) unicorn.dx += 4
	if (unicorn.dx > unicorn.maxdx) unicorn.dx = unicorn.maxdx
	if (!unicorn.active && unicorn.dx > 0) unicorn.dx -= 2
	if (unicorn.dx < 0) unicorn.dx = 0

	if (unicorn.dx == 0) {
		unicorn.state = UNICORN_STATE.STOPPED
	} else if (unicorn.dx < 380) {
		unicorn.state = UNICORN_STATE.WALKING
	} else {
		unicorn.state = UNICORN_STATE.RUNNING
	}

	// Animation loop

	let currentFrame = unicorn.animation[unicorn.animationFrame]
	let remainingDistace = currentFrame.distance - unicorn.animationDistance

	if (remainingDistace < 0) {
		unicorn.animationDistance = -remainingDistace
		unicorn.animationFrame++
		if (unicorn.animationFrame == unicorn.animation.length) {
			unicorn.animationFrame = 0
			unicorn.animationDistance = 0
			if (unicorn.state == UNICORN_STATE.STOPPED) unicorn.animation = ANIMATIONS.UNICORN_STOP
			if (unicorn.state == UNICORN_STATE.WALKING) unicorn.animation = ANIMATIONS.UNICORN_WALK
			if (unicorn.state == UNICORN_STATE.RUNNING) unicorn.animation = ANIMATIONS.UNICORN_RUN
		}
	}

	currentFrame = unicorn.animation[unicorn.animationFrame]
	unicorn.sprite = currentFrame.sprite
	unicorn.animationDistance += unicorn.dx * dt
	if (unicorn.dx == 0) unicorn.animationDistance += 100 * dt
}

function update (dt) {
	updateHills(dt)
	updateUnicorn(dt)
}

// --------------------------
// Render
// --------------------------

function renderUnicorn () {
	ctx.globalAlpha = 0.7
	drawSprite(unicorn.sprite, 130, unicorn.y)
	ctx.globalAlpha = 1
}

function renderHill (hill) {
	ctx.beginPath()
	ctx.fillStyle = hill.color
	
	for (i=0; i<hill.points.length-1; i++) {
		const start = hill.points[i]
		const end = hill.points[i+1]
		const curve = curveBetweenPoints(start.x,start.y,end.x,end.y)

		for (x=Math.floor(start.x); x<=end.x; x+=1) {
			ctx.fillRect(x, Math.floor(curve(x)), 1, height - Math.floor(curve(x)))
		}
	}
}

function renderHills () {
	hills.forEach(renderHill)
}

function renderReflection () {
	ctx.save()
	ctx.translate(0,height)
    ctx.scale(1, -1)
    ctx.filter = "blur(1px)"
    ctx.drawImage(canvas,0,90,width,height-50-90,0,-20,width,height-50-90)
	ctx.restore()
	ctx.globalAlpha = 0.7
	ctx.fillStyle = "#22223b"
	ctx.fillRect(0,160,width,height-160)
	ctx.globalAlpha = 1
	ctx.fillStyle = "#22223b"
	ctx.fillRect(0,160,width,1)
}

function render () {
	ctx.drawImage(STARS_IMAGE, 0,0,width,height)
	renderHills()
	renderUnicorn()
	renderReflection()
}

// --------------------------
// Game loop
// --------------------------

var dt = 0,
	counter = 0,
	last = timestamp()

function frame () {
	const now = timestamp()
	dt += Math.min(1, (now - last) / 1000)
	while (dt > step) {
		dt -= step
		update(step, counter)
	}
	render()
	last = now
	counter++
	requestAnimationFrame(frame)
}

document.addEventListener('keydown', function(event) {
	if (event.keyCode == 32) unicorn.active = true
})

document.addEventListener('keyup', function(event) {
	if (event.keyCode == 32) unicorn.active = false
})

canvas.addEventListener('touchstart', function(event) {
	unicorn.active = true
})

canvas.addEventListener('touchend', function(event) {
	unicorn.active = false
})

var loaded = 0

function ready () {
	loaded++
	if (loaded == 2) frame()
}

UNICORN_IMAGE.onload = ready
STARS_IMAGE.onload = ready
