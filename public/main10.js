const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl') // 初始化

if (!gl) {
  throw new Error('WebGL not supported')
}

function spherePointCloud(pointCount) {
  let points = [];
  for (let i = 0; i < pointCount; i++) {
      const r = () => Math.random() - 0.5; // -.5 < x < 0.5
      const inputPoint = [r(), r(), r()];
      
      const outputPoint = vec3.normalize(vec3.create(), inputPoint);

      points.push(...outputPoint);
  }
  return points;
}

const vertexData = spherePointCloud(40)

// 创建 gpu 的缓冲区，存储顶点的信息
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW)

// 初始化着色器
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
precision mediump float;

attribute vec3 position;
attribute vec3 color;
varying vec3 vColor;

uniform mat4 matrix;

void main() {
  vColor = vec3(position.xy, 1 );
  gl_Position = matrix * vec4(position, 1);
}
`)
gl.compileShader(vertexShader)

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fragmentShader, `
precision mediump float;

varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1);
}
`)
gl.compileShader(fragmentShader)

const program = gl.createProgram()
gl.attachShader(program, vertexShader)
gl.attachShader(program, fragmentShader)
gl.linkProgram(program)

const positionLocation = gl.getAttribLocation(program, `position`)
gl.enableVertexAttribArray(positionLocation)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

gl.useProgram(program)
gl.enable(gl.DEPTH_TEST)

const uniformLocations = {
  matrix: gl.getUniformLocation(program, `matrix`)
}

const modelMatrix = mat4.create()
const viewMatrix = mat4.create() // 模拟一个相机视角
const projectionMatrix = mat4.create() 

mat4.perspective(projectionMatrix, 
  75 * Math.PI / 180, // vertical field-of-view (angle, radians)
  canvas.width / canvas.height, // aspect w/h
  1e-4, // near cull distance
  1e4 // far cull distance
)

const mvMatrix = mat4.create()
const mvpMatrix = mat4.create()

mat4.translate(modelMatrix, modelMatrix, [0, 0, 0])

mat4.translate(viewMatrix, viewMatrix, [0, 0.1, 2])
mat4.invert(viewMatrix, viewMatrix)

function animate() {
  requestAnimationFrame(animate)

  mat4.rotateY(modelMatrix, modelMatrix, 0.03)

  mat4.multiply(mvMatrix, viewMatrix, modelMatrix)
  mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix)
  gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix)
  gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3)
}

animate()
