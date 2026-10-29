import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const routeScript = await readFile(new URL('../entry-route.js', import.meta.url), 'utf8');
const introScript = await readFile(new URL('../entry-3d/intro.js', import.meta.url), 'utf8');

function entry(href) {
  const url = new URL(href), destinations = [];
  vm.runInNewContext(routeScript, {
    URL, location: {href, search: url.search, hash: url.hash, replace: value => destinations.push(value)}
  });
  return destinations;
}

async function controller({reduced = false, failed = false} = {}) {
  const nodes = new Map(), events = {}, frames = new Map(), timers = [], destinations = [], draws = [];
  let time = 0, frameId = 0;
  function element(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {
      dataset: {}, textContent: '', disabled: false,
      classList: {add() {}}, setAttribute(name, value) { this[name] = value; }
    });
    return nodes.get(selector);
  }
  const document = {hidden: false, querySelector: element, addEventListener: (name, fn) => { events[name] = fn; }};
  const engine = {draw: p => draws.push(p), resize() {}, pointerMoving: () => false};
  const context = {
    URL, document, matchMedia: () => ({matches: reduced}),
    window: {addEventListener: (name, fn) => { events[name] = fn; }},
    location: {href: 'https://local.test/demo/intro.html?campaign=preview#page=18', search: '?campaign=preview', replace: value => destinations.push(value)},
    requestAnimationFrame: fn => { const id = ++frameId; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (fn, delay) => timers.push({fn, delay}), console: {warn() {}},
    loadModule: async specifier => {
      if (failed) throw new Error('WebGL unavailable');
      return specifier.includes('intro-scene') ? {buildLuxuryScene: () => engine} : {};
    }
  };
  // Replace only module loading so controller timing/routing run without a GPU.
  vm.runInNewContext(introScript.replaceAll('await import(', 'await loadModule('), context);
  await new Promise(resolve => setImmediate(resolve));
  return {
    document, events, destinations, timers, draws, element,
    tick(milliseconds) {
      const end = time + milliseconds;
      while (time < end) {
        time = Math.min(time + 16, end);
        const pending = [...frames.values()]; frames.clear();
        for (const frame of pending) frame(time);
      }
    },
    enter() { element('#intro-enter').onclick(); },
    skip() { element('#intro-skip').onclick({preventDefault() {}}); },
    flush() { for (const timer of timers.splice(0)) timer.fn(); }
  };
}

test('fresh entry uses the intro while chapter links bypass it without a loop', () => {
  for (const path of ['/', '/index.html', '/index.html#home']) {
    assert.deepEqual(entry('https://local.test' + path), ['https://local.test/intro.html']);
  }
  assert.deepEqual(entry('https://local.test/demo/index.html?campaign=preview'), ['https://local.test/demo/intro.html?campaign=preview']);
  for (const page of [1, 16, 20]) assert.deepEqual(entry('https://local.test/index.html#page=' + page), []);
});

test('one tap runs the complete transformation and coin hold then enters page one once', async () => {
  const app = await controller();
  app.tick(1000);
  assert.equal(app.element('#entry-intro').dataset.state, 'idle', 'Keep the original touch-to-start interaction');
  app.enter(); app.enter();
  app.tick(4400);
  assert.equal(app.timers.length, 0, 'Do not exit before the full original motion');
  app.tick(100);
  assert.equal(app.element('#entry-intro').dataset.state, 'ready');
  assert.equal(app.draws.at(-1), 1, 'Render the completed coin before exit');
  assert.equal(app.timers.length, 0, 'Hold the completed coin');
  app.tick(1000);
  assert.equal(app.timers.length, 1);
  assert.equal(app.timers[0].delay, 450);
  app.skip(); app.enter(); app.flush();
  assert.deepEqual(app.destinations, ['https://local.test/demo/index.html?campaign=preview#page=1']);
  assert.deepEqual(entry(app.destinations[0]), [], 'Completed intro never redirects back to itself');
});

test('skip works both before and during the animation', async () => {
  for (const start of [false, true]) {
    const app = await controller();
    if (start) { app.enter(); app.tick(1200); }
    app.skip(); app.skip(); app.tick(6000); app.flush();
    assert.equal(app.destinations.length, 1);
    assert.ok(app.destinations[0].endsWith('#page=1'));
  }
});

test('hidden tabs pause the motion and final coin hold', async () => {
  for (const elapsed of [1200, 4500]) {
    const app = await controller(); app.enter(); app.tick(elapsed);
    const before = app.element('#entry-intro').dataset.progress;
    app.document.hidden = true; app.events.visibilitychange(); app.tick(12000);
    assert.equal(app.element('#entry-intro').dataset.progress, before);
    assert.equal(app.timers.length, 0);
    app.document.hidden = false; app.events.visibilitychange(); app.tick(6000); app.flush();
    assert.equal(app.destinations.length, 1);
  }
});

test('reduced motion and failed WebGL still reach the first page', async () => {
  for (const options of [{reduced: true}, {failed: true}]) {
    const app = await controller(options);
    if (options.failed) assert.equal(app.element('#entry-intro').dataset.renderer, 'fallback');
    app.enter(); app.tick(options.reduced ? 900 : 6000);
    assert.equal(app.timers.length, 1);
    assert.equal(app.timers[0].delay, options.reduced ? 0 : 450);
    app.flush();
    assert.equal(app.destinations.length, 1);
    assert.ok(app.destinations[0].endsWith('#page=1'));
  }
});
