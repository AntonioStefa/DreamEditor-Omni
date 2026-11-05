import test from 'node:test';
import assert from 'node:assert/strict';
import {
  node,
  page,
  blank,
  History,
  validateDocument,
  layoutFrames,
  duplicateNode,
} from '../src/model.js';
import { templates, makeTemplate } from '../src/templates.js';
import { renderPage, overflow } from '../src/render.js';
import { exampleModel, parseOBJ, projectModel, disposeModel } from '../src/studio3d.js';
test('all bundled templates roundtrip through validated JSON and independent identifiers', () => {
  for (const t of templates) {
    const d = makeTemplate(t.id);
    assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(d))), d);
    assert.notEqual(d.pages[0].id, makeTemplate(t.id).pages[0].id);
    assert.ok(renderPage(d.pages[0]).includes('<svg'));
  }
});
test('history preserves image and page data through undo / redo and branching', () => {
  const d = blank(),
    h = new History(d);
  d.pages[0].nodes.push(node('image', { source: 'data:image/png;base64,AAAA' }));
  h.commit(d);
  assert.equal(h.undo().pages[0].nodes.length, 0);
  assert.equal(h.redo().pages[0].nodes[0].source, 'data:image/png;base64,AAAA');
  h.undo();
  d.name = 'Branch';
  h.commit(d);
  assert.equal(h.future.length, 0);
  d.name = 'mutation';
  assert.equal(h.current.name, 'Branch');
});
test('all layouts fit within margins, never overlap, and preserve the golden ratio', () => {
  for (const mode of ['golden', 'columns', 'modular']) {
    const frames = layoutFrames(mode);
    for (const f of frames) {
      assert.ok(f.x >= 54 && f.y >= 54);
      assert.ok(f.x + f.w <= 666.001 && f.y + f.h <= 906.001);
    }
    for (let i = 0; i < frames.length; i++)
      for (let j = i + 1; j < frames.length; j++) {
        const a = frames[i],
          b = frames[j];
        assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
      }
  }
  const [a, b] = layoutFrames('golden');
  assert.ok(Math.abs(a.h / (a.h + b.h) - 0.618) < 1e-8);
});
test('malformed imports are rejected without mutating an existing document', () => {
  const d = blank();
  d.pages[0].nodes.push(node('text'));
  const cases = [
    (x) => (x.version = 9),
    (x) => (x.pages = []),
    (x) => (x.pages[0].nodes[0].w = NaN),
    (x) => (x.pages[0].nodes[0].fill = 'url(https://evil.test)'),
    (x) => (x.pages[0].nodes[0].source = 'data:image/svg+xml;base64,AAAA'),
    (x) => x.pages[0].nodes.push({ ...x.pages[0].nodes[0] }),
    (x) => (x.pages[0].nodes[0].paths = ['M0 0" onload="alert(1)']),
  ];
  for (const mutate of cases) {
    const copy = structuredClone(d);
    mutate(copy);
    assert.throws(() => validateDocument(copy));
  }
  assert.equal(d.pages[0].nodes.length, 1);
});
test('renderer escapes markup and warns on overflowing text', () => {
  const p = page('<unsafe>');
  p.nodes.push(node('text', { text: '<script>alert("bad")</script>', h: 10 }));
  const svg = renderPage(p);
  assert.ok(!svg.includes('<script>'));
  assert.ok(svg.includes('&lt;script&gt;'));
  assert.ok(overflow(p.nodes[0]));
});
test('duplicating a node preserves content and assigns a new identifier', () => {
  const n = node('curve'),
    d = duplicateNode(n);
  assert.notEqual(n.id, d.id);
  assert.equal(n.text, d.text);
  assert.equal(d.x, n.x + 18);
});
test('3D projection produces finite valid paths and updates with the camera', () => {
  for (const kind of ['torus', 'vase']) {
    const obj = exampleModel(kind);
    const a = projectModel(obj),
      b = projectModel(obj, { angle: 90, detail: 'mesh' });
    assert.ok(a.length > 0 && a.length <= 14000);
    assert.notDeepEqual(a, b);
    const d = blank();
    d.pages[0].nodes.push(node('vector', { paths: a }));
    assert.doesNotThrow(() => validateDocument(d));
    disposeModel(obj);
  }
});
test('OBJ import accepts geometry and rejects empty or invalid data', () => {
  const obj = parseOBJ('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3');
  assert.equal(projectModel(obj).length, 3);
  disposeModel(obj);
  assert.throws(() => parseOBJ('no geometry'));
  assert.throws(() => parseOBJ('v NaN 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3'));
});
