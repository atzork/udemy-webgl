#version 300 es

in vec3 position;
in vec4 color;
out vec4 fcolor;

uniform vec4 colorsUniformArray[3];
uniform vec3 offsets;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

uniform float time;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position.x + offsets[gl_InstanceID], position.yz, 1);
    fcolor = colorsUniformArray[(gl_InstanceID + gl_VertexID) %3];
    fcolor = vec4(
        fcolor.r * sin(time),
        fcolor.g * cos(time),
        fcolor.g * cos(2.0*time)
    ,1);
}