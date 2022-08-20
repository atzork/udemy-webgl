export function loadShaders(baseDirShader = 'shaders') {
    const shaderUrl = {
        Vertex: `${baseDirShader}/vertex.glsl`,
        Fragment: `${baseDirShader}/fragment.glsl`
    }
    return Promise.all([fetch(shaderUrl.Vertex), fetch(shaderUrl.Fragment)]).then(shadersResponse => {
        if (shadersResponse.some(item => !item.ok)) {
            console.error(shadersResponse)
            throw new Error('shaders loading error!!')
        }
        return Promise.all(shadersResponse.map(item => item.text()))
    })
}