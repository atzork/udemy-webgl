import {loadShaders} from "./resources.js";
import {mat4, vec3, vec4} from "./gl-matrix/index.js";

let gl;
let vertexShaderSrc;
let fragmentShaderSrc;
document.addEventListener('DOMContentLoaded', init);

function init() {
    const canvas = document.getElementById('renderCanvas');
    gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL does not supported in Browser')
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    loadShaders().then(start)
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

    cube.colorsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.colors), gl.STATIC_DRAW)

    cube.vertexShader = compileVertexShader(vertexShaderSrc, gl.VERTEX_SHADER);
    cube.fragmentShader = compileVertexShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);

    cube.program = createProgram([cube.vertexShader, cube.fragmentShader]);

    cube.vao = gl.createVertexArray();
    gl.bindVertexArray(cube.vao);

    cube.positionAttributeLocation = gl.getAttribLocation(cube.program, 'position')
    gl.enableVertexAttribArray(cube.positionAttributeLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.positionBuffer)
    gl.vertexAttribPointer(cube.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0)

    cube.colorAttributeLocation = gl.getAttribLocation(cube.program, 'color')
    gl.enableVertexAttribArray(cube.colorAttributeLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorsBuffer)
    gl.vertexAttribPointer(cube.colorAttributeLocation, 4, gl.FLOAT, false, 0, 0)

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
        projectionMatrix, 45  * Math.PI / 180.0, gl.canvas.clientWidth/gl.canvas.clientHeight, .1, 10)

    const viewMatrixLocation = gl.getUniformLocation(cube.program, 'viewMatrix')
    const projectMatrixLocation = gl.getUniformLocation(cube.program, 'projectionMatrix')
    gl.uniformMatrix4fv(projectMatrixLocation, false, projectionMatrix)
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix)

    const colorsUniformArrayLocation0 = gl.getUniformLocation(cube.program, 'colorsUniformArray[0]')
    const colorsUniformArrayLocation1 = gl.getUniformLocation(cube.program, 'colorsUniformArray[1]')
    const colorsUniformArrayLocation2 = gl.getUniformLocation(cube.program, 'colorsUniformArray[2]')
    const offsetsUniformLocation = gl.getUniformLocation(cube.program, 'offsets')
    const timeUniformLocation = gl.getUniformLocation(cube.program, 'time')

    let angel = 0 ;
    let currentTime = .1;

    runRandedLoop();

    function runRandedLoop() {

        gl.clearColor(0,0,0,1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.DEPTH_TEST)

        //
        // 1-st
        angel += .01
        currentTime += .02;

        mat4.identity(cube.modelMatrix);
        mat4.translate(cube.modelMatrix, cube.modelMatrix, [0, 0, -5])
        mat4.rotateY(cube.modelMatrix, cube.modelMatrix, angel)
        mat4.rotateX(cube.modelMatrix, cube.modelMatrix, .25)

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