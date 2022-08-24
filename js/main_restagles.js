
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

function createRectangle() {
    const rectangle = {};



    rectangle.vertexes = [
        -1, -1, 0,
        1, -1, 0,
        1, 1, 0,
        -1, 1, 0,
    ]

    rectangle.indexis = [
        0,1,2, // 1-st triangle
        0,2,3  // 2-nd triangle
    ]

    rectangle.positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectangle.vertexes), gl.STATIC_DRAW)

    rectangle.colors = [
        1, 0, 0, 1,
        1, 0, 0, 1,
        1, 0, 0, 1,
        1, 0, 0, 1,
    ]

    rectangle.vao = gl.createVertexArray();
    gl.bindVertexArray(rectangle.vao);

    rectangle.colorsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.colorsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectangle.colors), gl.STATIC_DRAW)

    rectangle.indexisBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectangle.indexisBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(rectangle.indexis), gl.STATIC_DRAW)

    rectangle.vertexShader = compileVertexShader(vertexShaderSrc, gl.VERTEX_SHADER);
    rectangle.fragmentShader = compileVertexShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);

    rectangle.program = createProgram([rectangle.vertexShader, rectangle.fragmentShader]);

    rectangle.positionAttributeLocation = gl.getAttribLocation(rectangle.program, 'position')
    gl.enableVertexAttribArray(rectangle.positionAttributeLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.positionBuffer)
    gl.vertexAttribPointer(rectangle.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0)

    rectangle.colorAttributeLocation = gl.getAttribLocation(rectangle.program, 'color')
    gl.enableVertexAttribArray(rectangle.colorAttributeLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.colorsBuffer)
    gl.vertexAttribPointer(rectangle.colorAttributeLocation, 4, gl.FLOAT, false, 0, 0)


    rectangle.modelMatrix = mat4.create();
    rectangle.modelMatrixLocation = gl.getUniformLocation(rectangle.program, 'modelMatrix')

    return rectangle;
}

function start(shaderSources) {

    [vertexShaderSrc, fragmentShaderSrc] = shaderSources

    console.log('loaded', arguments)

    const rectangle = createRectangle()

    const uniformColorsArray = []
    let color = vec4.fromValues(1,0,0,1)
    uniformColorsArray.push(color)
    color = vec4.fromValues(0,1,0,1)
    uniformColorsArray.push(color)
    color = vec4.fromValues(0,0,1,1)
    uniformColorsArray.push(color)

    gl.useProgram(rectangle.program)

    const offsetsVector = vec3.fromValues(-2, 0, 2)
    const projectionMatrix = mat4.create()
    const viewMatrix = mat4.create()

    mat4.perspective(
        projectionMatrix, 45  * Math.PI / 180.0, gl.canvas.clientWidth/gl.canvas.clientHeight, .1, 10)

    const viewMatrixLocation = gl.getUniformLocation(rectangle.program, 'viewMatrix')
    const projectMatrixLocation = gl.getUniformLocation(rectangle.program, 'projectionMatrix')
    gl.uniformMatrix4fv(projectMatrixLocation, false, projectionMatrix)
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix)

    const colorsUniformArrayLocation0 = gl.getUniformLocation(rectangle.program, 'colorsUniformArray[0]')
    const colorsUniformArrayLocation1 = gl.getUniformLocation(rectangle.program, 'colorsUniformArray[1]')
    const colorsUniformArrayLocation2 = gl.getUniformLocation(rectangle.program, 'colorsUniformArray[2]')
    const offsetsUniformLocation = gl.getUniformLocation(rectangle.program, 'offsets')
    const timeUniformLocation = gl.getUniformLocation(rectangle.program, 'time')

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

        mat4.identity(rectangle.modelMatrix);
        mat4.translate(rectangle.modelMatrix, rectangle.modelMatrix, [0, 0, -5])
        mat4.rotateY(rectangle.modelMatrix, rectangle.modelMatrix, angel)
        mat4.rotateX(rectangle.modelMatrix, rectangle.modelMatrix, .25)

        gl.uniformMatrix4fv(rectangle.modelMatrixLocation, false, rectangle.modelMatrix)

        gl.uniform4fv(colorsUniformArrayLocation0, uniformColorsArray[0])
        gl.uniform4fv(colorsUniformArrayLocation1, uniformColorsArray[1])
        gl.uniform4fv(colorsUniformArrayLocation2, uniformColorsArray[2])
        gl.uniform3fv(offsetsUniformLocation, offsetsVector)
        gl.uniform1f(timeUniformLocation, currentTime)

        gl.useProgram(rectangle.program)
        gl.bindVertexArray(rectangle.vao)

        // gl.drawArrays(gl.TRIANGLES, 0, 6)
        // gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
        gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, 3)
        // gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 3)

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