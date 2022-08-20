#version 300 es

in vec3 position;
in vec4 color;
out vec4 fcolor;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1);
    fcolor = color;
}