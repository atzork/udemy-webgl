import {loadShaders} from "./resources.js";

let gl;
document.addEventListener('DOMContentLoaded', init);

function init() {
    const canvas = document.getElementById('renderCanvas');
    gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL does not supported in Browser')
    }

    loadShaders().then(start)
}

function start([vertexShaderSrc, fragmentShaderSrc]) {
    console.log('loaded', arguments)


    const triangleVertexes = [
        1.0, -1.0, 0.0,
        0.0, 1.0, 0.0,
        -1.0, -1.0, 0.0
    ]
    const triangleVertexesPositionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexesPositionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertexes), gl.STATIC_DRAW)

    const triangleColors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ]
    const triangleColorsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleColorsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleColors), gl.STATIC_DRAW)

    const trianglePositionAndColors = [
        1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0,
        -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 1.0
    ]
    const positionAndColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionAndColorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trianglePositionAndColors), gl.STATIC_DRAW)

    const vertexShader = compileVertexShader(vertexShaderSrc, gl.VERTEX_SHADER);
    const fragmentShader = compileVertexShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);

    const program = createProgram([vertexShader, fragmentShader]);
    gl.useProgram(program)

    const positionAttributeLocation = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(positionAttributeLocation)
        // gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexesPositionBuffer)
        // gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionAndColorBuffer)
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 0)

    const colorAttributeLocation = gl.getAttribLocation(program, 'color')
    gl.enableVertexAttribArray(colorAttributeLocation)
        // gl.bindBuffer(gl.ARRAY_BUFFER, triangleColorsBuffer)
        // gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionAndColorBuffer)
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT)

    runRandedLoop();
}

function runRandedLoop() {

    gl.clearColor(0,0,0,1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.drawArrays(gl.TRIANGLES, 0, 3)

    requestAnimationFrame(runRandedLoop)
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