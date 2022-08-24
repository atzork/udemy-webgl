import {loadShaders} from "./resources.js";
import {mat4, vec3, vec4} from "./gl-matrix/index.js";

let gl;
let vertexShaderSrc;
let fragmentShaderSrc;
document.addEventListener('DOMContentLoaded', init);

const speed = {
    moving: .05,
    rotation: .01
}

const keyPressed = {
    up: false,
    down: false,
    left: false,
    right: false,
    rotateLeft: false,
    rotateRight: false,
    rotateUp: false,
    rotateDown: false,
}

function init() {
    const canvas = document.getElementById('renderCanvas');
    gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL does not supported in Browser')
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    loadShaders().then(start)

    eventsListeners();
}

function createCube() {
    const cube = {};

    cube.vertexes = [
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,

        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,

        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,

        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,

        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,

        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5,
    ]
    cube.positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.vertexes), gl.STATIC_DRAW)

    const faceColors = [
        [1, 0, 0, 1], // front
        [0, 1, 0, 1], // back
        [0, 0, 1, 1], // top
        [1, 1, 0, 1], // bottom
        [0, 1, 1, 1], // right
        [1, 0, 1, 1], // left
    ]

    cube.colors = faceColors.reduce((acc, curr, index) =>  {
        const facePoints = new Array(6).fill(curr)
        return acc.concat(facePoints.flat())
    }, [])

    // cube.colorsBuffer = gl.createBuffer()
    // gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorsBuffer)
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.colors), gl.STATIC_DRAW)

    cube.vertexShader = compileVertexShader(vertexShaderSrc, gl.VERTEX_SHADER);
    cube.fragmentShader = compileVertexShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);

    cube.program = createProgram([cube.vertexShader, cube.fragmentShader]);

    cube.vao = gl.createVertexArray();
    gl.bindVertexArray(cube.vao);

    cube.positionAttributeLocation = gl.getAttribLocation(cube.program, 'position')
    gl.enableVertexAttribArray(cube.positionAttributeLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.positionBuffer)
    gl.vertexAttribPointer(cube.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0)

    // cube.colorAttributeLocation = gl.getAttribLocation(cube.program, 'color')
    // gl.enableVertexAttribArray(cube.colorAttributeLocation)
    // gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorsBuffer)
    // gl.vertexAttribPointer(cube.colorAttributeLocation, 4, gl.FLOAT, false, 0, 0)

    cube.modelMatrix = mat4.create();
    cube.modelMatrixLocation = gl.getUniformLocation(cube.program, 'modelMatrix')

    return cube;
}

function start(shaderSources) {

    [vertexShaderSrc, fragmentShaderSrc] = shaderSources

    console.log('loaded', arguments)

    const cube = createCube()

    const uniformColorsArray = []
    let color = vec4.fromValues(1,0,0,1)
    uniformColorsArray.push(color)
    color = vec4.fromValues(0,1,0,1)
    uniformColorsArray.push(color)
    color = vec4.fromValues(0,0,1,1)
    uniformColorsArray.push(color)

    gl.useProgram(cube.program)

    const offsetsVector = vec3.fromValues(-2, 0, 2)
    const projectionMatrix = mat4.create()
    const viewMatrix = mat4.create()

    mat4.perspective(
        projectionMatrix, 45  * Math.PI / 180.0, gl.canvas.clientWidth/gl.canvas.clientHeight, .1, 100)

    const viewMatrixLocation = gl.getUniformLocation(cube.program, 'viewMatrix')
    const projectMatrixLocation = gl.getUniformLocation(cube.program, 'projectionMatrix')
    gl.uniformMatrix4fv(projectMatrixLocation, false, projectionMatrix)

    const colorsUniformArrayLocation0 = gl.getUniformLocation(cube.program, 'colorsUniformArray[0]')
    const colorsUniformArrayLocation1 = gl.getUniformLocation(cube.program, 'colorsUniformArray[1]')
    const colorsUniformArrayLocation2 = gl.getUniformLocation(cube.program, 'colorsUniformArray[2]')
    const offsetsUniformLocation = gl.getUniformLocation(cube.program, 'offsets')
    const timeUniformLocation = gl.getUniformLocation(cube.program, 'time')

    let angel = 0 ;
    let currentTime = .1;
    const camera = {
        position: vec3.fromValues(0,0,0),
        direction: vec3.fromValues(0,0, -1),
        pitch: 0,
        yaw: -1 * Math.PI / 2
    }

    runRandedLoop();

    function runRandedLoop() {

        gl.clearColor(0,0,0,1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.DEPTH_TEST)

        const target = vec3.create()
        camera.direction[0] = Math.cos(camera.pitch) * Math.cos(camera.yaw)
        camera.direction[1] = Math.sin(camera.pitch)
        camera.direction[2] = Math.cos(camera.pitch) * Math.sin(camera.yaw)
        camera.right = vec3.fromValues(-1 * Math.sin(camera.yaw), 0, Math.cos(camera.yaw))
        vec3.add(target, camera.position, camera.direction);
        mat4.lookAt(viewMatrix, camera.position, target, vec3.fromValues(0,1, 0))
        gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix)

        //
        // 1-st
        catchCameraAction(camera);
        angel += .01
        currentTime += .02;
        // camera.position[0] -= .01
        // camera.position[1] += .01

        mat4.identity(cube.modelMatrix);
        mat4.translate(cube.modelMatrix, cube.modelMatrix, [0, 0, -5])
        // mat4.rotateY(cube.modelMatrix, cube.modelMatrix, angel)
        // mat4.rotateX(cube.modelMatrix, cube.modelMatrix, .25)

        gl.uniformMatrix4fv(cube.modelMatrixLocation, false, cube.modelMatrix)

        gl.uniform4fv(colorsUniformArrayLocation0, uniformColorsArray[0])
        gl.uniform4fv(colorsUniformArrayLocation1, uniformColorsArray[1])
        gl.uniform4fv(colorsUniformArrayLocation2, uniformColorsArray[2])
        gl.uniform3fv(offsetsUniformLocation, offsetsVector)
        gl.uniform1f(timeUniformLocation, currentTime)

        // gl.useProgram(cube.program)
        // gl.bindVertexArray(cube.vao)

        // gl.drawArrays(gl.TRIANGLES, 0, 36)
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, 3)

        requestAnimationFrame(runRandedLoop)
    }
}

function compileVertexShader(shaderSource, shaderType) {
    const shader = gl.createShader(shaderType)
    gl.shaderSource(shader, shaderSource)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader))
    }
    return shader;
}

function createProgram(shaders) {
    const program = gl.createProgram()
    gl.attachShader(program, shaders[0])
    gl.attachShader(program, shaders[1])
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program))
    }
    return program
}

function catchCameraAction(camera) {
    //
    // move left\right
    var movementDirection = vec3.create()
    if (keyPressed.up) {
        vec3.scale(movementDirection, camera.direction, speed.moving)
        vec3.add(camera.position, camera.position, movementDirection)
    }
    if (keyPressed.down) {
        vec3.scale(movementDirection, camera.direction, -speed.moving)
        vec3.add(camera.position, camera.position, movementDirection)
    }
    if (keyPressed.left) {
        vec3.scale(movementDirection, camera.right, -speed.moving)
        vec3.add(camera.position, camera.position, movementDirection)
    }
    if (keyPressed.right) {
        vec3.scale(movementDirection, camera.right, speed.moving)
        vec3.add(camera.position, camera.position, movementDirection)
    }
    // move left\right
    // ===============

    //
    // rotation
    if (keyPressed.rotateLeft) {
        camera.yaw -= speed.rotation
    }
    if (keyPressed.rotateRight) {
        camera.yaw += speed.rotation
    }
    if (keyPressed.rotateUp) {
        camera.pitch += speed.rotation
    }
    if (keyPressed.rotateDown) {
        camera.pitch -= speed.rotation
    }
    // rotation
    // ========

}

function eventsListeners() {
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'w':
                keyPressed.up = true
                break
            case 's':
                keyPressed.down = true
                break
            case 'a':
                keyPressed.left = true
                break
            case 'd':
                keyPressed.right = true
                break
            case 'g':
                keyPressed.rotateLeft = true
                break
            case 'j':
                keyPressed.rotateRight = true
                break
            case 'y':
                keyPressed.rotateUp = true
                break
            case 'h':
                keyPressed.rotateDown = true
                break
        }
    })
    document.addEventListener('keyup', (event) => {
        switch (event.key) {
            case 'w':
                keyPressed.up = false
                break
            case 's':
                keyPressed.down = false
                break
            case 'a':
                keyPressed.left = false
                break
            case 'd':
                keyPressed.right = false
                break
            case 'g':
                keyPressed.rotateLeft = false
                break
            case 'j':
                keyPressed.rotateRight = false
                break
            case 'y':
                keyPressed.rotateUp = false
                break
            case 'h':
                keyPressed.rotateDown = false
                break
        }
    })
}