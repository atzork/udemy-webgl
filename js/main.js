import {loadShaders} from "./resources.js";
import {mat4} from "./gl-matrix/index.js";

let gl;
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

function start([vertexShaderSrc, fragmentShaderSrc]) {
    console.log('loaded', arguments)

    const vertexes = [
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
    const vertexesPositionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexesPositionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexes), gl.STATIC_DRAW)

    const faceColors = [
        [1, 0, 0, 1], // front
        [0, 1, 0, 1], // back
        [0, 0, 1, 1], // top
        [1, 1, 0, 1], // bottom
        [0, 1, 1, 1], // right
        [1, 0, 1, 1], // left
    ]

    const colors = faceColors.reduce((acc, curr, index) =>  {
        const facePoints = new Array(6).fill(curr)
        return acc.concat(facePoints.flat())
    }, [])

    const colorsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

    const vertexShader = compileVertexShader(vertexShaderSrc, gl.VERTEX_SHADER);
    const fragmentShader = compileVertexShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);

    const program = createProgram([vertexShader, fragmentShader]);
    gl.useProgram(program)

    const positionAttributeLocation = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexesPositionBuffer)
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0)

    const colorAttributeLocation = gl.getAttribLocation(program, 'color')
    gl.enableVertexAttribArray(colorAttributeLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer)
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0)

    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    let modelMatrix = mat4.create();

    mat4.perspective(
        projectionMatrix, 45  * Math.PI / 180.0, gl.canvas.clientWidth/gl.canvas.clientHeight, .1, 10)

    console.log(projectionMatrix, viewMatrix, modelMatrix)

    const modelMatrixLocation = gl.getUniformLocation(program, 'modelMatrix')
    const viewMatrixLocation = gl.getUniformLocation(program, 'viewMatrix')
    const projectMatrixLocation = gl.getUniformLocation(program, 'projectionMatrix')
    gl.uniformMatrix4fv(projectMatrixLocation, false, projectionMatrix)
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix)

    let angel = 0 ;

    runRandedLoop();

    function runRandedLoop() {

        gl.clearColor(0,0,0,1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.DEPTH_TEST)

        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, [0, 0, -5])
        mat4.rotateY(modelMatrix, modelMatrix, angel)
        mat4.rotateX(modelMatrix, modelMatrix, .25)
        angel += .01

        gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix)

        gl.drawArrays(gl.TRIANGLES, 0, 36)

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