import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePizzaCutout, resolveProductImage } from './media';

test('bundled pizza photos use transparent cutouts', () => {
  for (const name of ['margherita', 'pepperoni', 'salami', 'bbq-chicken', 'quattro-formaggi', 'diavola', 'tonno', 'vegetariana', 'funghi', 'yespiz-special']) {
    assert.equal(resolvePizzaCutout(`/images/pizza-${name}.png`), `/images/pizza-cutouts/${name}.webp`);
  }
});

test('custom catalog uploads and unrelated artwork remain unchanged', () => {
  const remote = 'https://example.com/pizza-funghi.png';
  assert.equal(resolveProductImage({ imageUrl: remote, image: '/fallback.png' }), remote);
  assert.equal(resolvePizzaCutout('/images/pizza-night-bg.webp'), '/images/pizza-night-bg.webp');
  assert.equal(resolveProductImage({ imageUrl: ' ', image: '/images/pizza-tonno.png' }), '/images/pizza-cutouts/tonno.webp');
});
