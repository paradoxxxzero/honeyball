import Stats from 'stats.js'
import {
  AmbientLight,
  Clock,
  Color,
  CylinderGeometry,
  Fog,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three'
// import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { renderHoneyCombNew } from './math-debug'
import Edge from './math/Edge'
import { getGoursatSimplex } from './math/hypermath'
import Simplex from './math/Simplex'
import Vertex from './math/Vertex'
import './style.css'
import { renderHoneyComb } from './math'
export let stats, renderer, camera, scene, controls, clock

const colors = {
  background: 0x000000,
  edges: 0x3949ab,
  vertices: 0x03a9f4,
}

const size = 10

export const initialize3d = () => {
  clock = new Clock()
  stats = new Stats()
  document.body.appendChild(stats.dom)
  renderer = new WebGLRenderer({
    antialias: true,
  })

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(new Color(colors.background), 1)

  renderer.domElement.id = 'c3d'
  document.body.appendChild(renderer.domElement)
  camera = new PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.001,
    10
  )
  camera.position.set(-1.5, 0, 0)
  camera.up.set(0, 1, 0)
  camera.lookAt(0, 0, 0)
  camera.zoom = Math.min(1, window.innerWidth / window.innerHeight)
  camera.updateProjectionMatrix()

  scene = new Scene()
  scene.background = new Color(colors.background)

  scene.fog = new Fog(colors.background, 1, size)

  const ambientLight = new AmbientLight(0xffffff, 0.75)
  scene.add(ambientLight)

  const pointLight = new PointLight(0xffffff)
  camera.add(pointLight)
  camera.updateProjectionMatrix()

  scene.add(camera)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 0)
  controls.minDistance = 0
  controls.maxDistance = 100
  controls.addEventListener('change', render)
  controls.update()

  renderer.domElement.addEventListener('dblclick', () => {
    controls.position0.set(controls.position0.x < -1 ? -0.25 : -1.5, 0, 0)
    controls.reset()
  })

  // controls = new FirstPersonControls(camera, renderer.domElement)
  // controls.lookSpeed = 0.2
  // animate()

  return {
    renderer,
    scene,
    camera,
    controls,
  }
}

const dummy = new Object3D()
const vertexRadius = 0.15
const edgeRadius = 0.025
const materialProps = {
  roughness: 0.5,
  metalness: 0.5,
  // clearcoat: 1,
  // reflectivity: 1,
  transparent: true,
  opacity: 0.75,
}

export const set = coxeter => {
  Vertex.clear()
  Edge.clear()
  Simplex.clear()
  scene.children
    .filter(child => child.isInstancedMesh)
    .forEach(child => {
      child.dispose()
      scene.remove(child)
    })

  renderHoneyComb(getGoursatSimplex(coxeter), coxeter)
  // renderHoneyCombNew(getGoursatSimplex(coxeter), coxeter)
  // renderHoneyCombExpanded(getGoursatSimplex(coxeter), coxeter)
  // const { vertices, edges } = getHoneyCombNewAPI(size)
  // const { vertices, edges } = getHoneyCombManual(size)
  // const { vertices, edges } = getTestHoneyComb(size)
  // const { vertices, edges } = getHoneyCombExpanded(size)
  // const { vertices, edges } = getHoneyCombAllFaces(size)

  const vertices = Vertex.all
  const edges = Edge.all

  console.log(
    'Rendering',
    vertices.length,
    'vertices and',
    edges.length,
    'edges'
  )
  const vertexGeometry = new SphereGeometry(vertexRadius, 16, 16)
  const instancedVertex = new InstancedMesh(
    vertexGeometry,
    new MeshStandardMaterial({
      // color: colors.vertices,
      ...materialProps,
      roughness: 0.7,
    }),
    vertices.length
  )
  vertices.forEach((vertex, i) => {
    const len = vertex.vertex4.length()
    dummy.position.copy(vertex.vertex)
    dummy.scale.setScalar(1 / (1 + len))
    dummy.updateMatrix()
    instancedVertex.setMatrixAt(i, dummy.matrix)
    instancedVertex.setColorAt(i, vertex.color)
  })

  // instancedVertex.instanceMatrix.setUsage(StreamDrawUsage)
  // instancedVertex.instanceColor.setUsage(StreamDrawUsage)
  scene.add(instancedVertex)

  const edgeGeometry = new CylinderGeometry(
    edgeRadius,
    edgeRadius,
    1,
    16,
    1,
    true
  )
  edgeGeometry.translate(0, 0.5, 0)
  edgeGeometry.rotateX(Math.PI / 2)
  const instancedEdge = new InstancedMesh(
    edgeGeometry,
    new MeshStandardMaterial({
      // color: colors.edges,
      ...materialProps,
    }),
    edges.length
  )

  edges.forEach((edge, i) => {
    dummy.position.copy(edge.vertex1.vertex)
    dummy.scale.set(
      1 / (1 + edge.vertex1.vertex4.length()),
      1 / (1 + edge.vertex1.vertex4.length()),
      edge.vertex1.vertex.distanceTo(edge.vertex2.vertex)
    )
    dummy.lookAt(edge.vertex2.vertex)
    dummy.updateMatrix()
    instancedEdge.setMatrixAt(i, dummy.matrix)
    instancedEdge.setColorAt(i, edge.color)
  })
  scene.add(instancedEdge)
}

export const render = () => {
  // const delta = clock.getDelta()
  stats.begin()
  renderer.render(scene, camera)
  // controls.update(delta)
  stats.end()
}

export const animate = () => {
  requestAnimationFrame(animate)
  render()
}

Object.assign(window, {
  Vertex,
  Edge,
  Simplex,
})
