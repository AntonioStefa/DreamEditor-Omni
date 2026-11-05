import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
export function exampleModel(kind = 'torus') {
  const geometry =
    kind === 'vase'
      ? new THREE.LatheGeometry(
          Array.from({ length: 20 }, (_, i) => {
            const y = i / 19;
            return new THREE.Vector2(
              0.35 + 0.2 * Math.sin(y * 5) + 0.12 * Math.cos(y * 10),
              y * 2 - 1,
            );
          }),
          28,
        )
      : new THREE.TorusKnotGeometry(0.65, 0.22, 90, 10);
  return new THREE.Group().add(new THREE.Mesh(geometry));
}
export function parseOBJ(source) {
  if (source.length > 5000000) throw new Error('Il modello supera 5 MB. Usa un OBJ più leggero.');
  const vertices = (source.match(/^v\s/gm) || []).length;
  const faces = (source.match(/^f\s/gm) || []).length;
  if (!vertices || !faces) throw new Error('Il file OBJ deve contenere vertici e facce.');
  if (vertices > 20000 || faces > 20000)
    throw new Error('Per questo prototipo usa al massimo 20.000 vertici e facce.');
  const result = new OBJLoader().parse(source);
  let meshes = 0;
  result.traverse((o) => {
    if (o.isMesh) {
      meshes++;
      const a = o.geometry.attributes.position.array;
      for (const n of a) if (!Number.isFinite(n)) throw new Error('Coordinate OBJ non valide.');
    }
  });
  if (!meshes) throw new Error('Nessuna superficie trovata nel file OBJ.');
  return result;
}
export function projectModel(object, { angle = 25, tilt = 20, detail = 'contours' } = {}) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object),
    center = box.getCenter(new THREE.Vector3()),
    size = box.getSize(new THREE.Vector3());
  const extent = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(extent) || extent === 0)
    throw new Error('Il modello non ha dimensioni valide.');
  const normalize = new THREE.Matrix4()
    .makeScale(2 / extent, 2 / extent, 2 / extent)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
  const rot = new THREE.Matrix4()
    .makeRotationX((tilt * Math.PI) / 180)
    .multiply(new THREE.Matrix4().makeRotationY((angle * Math.PI) / 180));
  const paths = [];
  object.traverse((o) => {
    if (!o.isMesh) return;
    const edges =
      detail === 'mesh'
        ? new THREE.WireframeGeometry(o.geometry)
        : new THREE.EdgesGeometry(o.geometry, 15);
    const positions = edges.attributes.position;
    const matrix = rot.clone().multiply(normalize).multiply(o.matrixWorld);
    for (let i = 0; i < positions.count; i += 2) {
      if (paths.length >= 14000) {
        edges.dispose();
        throw new Error(
          'Troppe linee per il prototipo (massimo 14.000). Semplifica il modello o scegli Spigoli geometrici.',
        );
      }
      const a = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(matrix);
      const b = new THREE.Vector3().fromBufferAttribute(positions, i + 1).applyMatrix4(matrix);
      paths.push(
        `M${(250 + a.x * 175).toFixed(2)},${(250 - a.y * 175).toFixed(2)}L${(250 + b.x * 175).toFixed(2)},${(250 - b.y * 175).toFixed(2)}`,
      );
    }
    edges.dispose();
  });
  if (!paths.length) throw new Error('Nessuna linea disponibile: prova la modalità Reticolo.');
  return paths;
}
export function disposeModel(object) {
  object?.traverse((o) => {
    o.geometry?.dispose();
    if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
    else o.material?.dispose();
  });
}
