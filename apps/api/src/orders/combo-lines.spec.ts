import { expandComboLines } from './combo-lines';
import { resolveCombo } from '../catalog/combo';
import { priceOrderItem } from './order-item';
import type { MenuItemDocument } from '../catalog/schemas/menu.schema';
const pizza = { id: 'pizza', productType: 'pizza', name: 'Margherita', isActive: true, priceCents: 1200 } as unknown as MenuItemDocument;
const drink = { id: 'drink', productType: 'drink', name: 'Cola', isActive: true, priceCents: 300 } as unknown as MenuItemDocument;
const combo = { id: 'combo', productType: 'combo', name: 'Pizza party', priceCents: 2001, comboComponents: [{ menuItemId: 'pizza', quantity: 2, size: 'large' }, { menuItemId: 'drink', quantity: 1 }] } as unknown as MenuItemDocument;
describe('Combo checkout', () => {
  it('preserves exact server prices, quantities and sizes when dividing uneven cents', () => {
    const result = expandComboLines([{ menuItemId: 'combo', quantity: 3 }], [combo], [pizza, drink]);
    expect(result.reduce((sum, r) => sum + r.comboPriceCents! * r.line.quantity, 0)).toBe(6003);
    expect(result.filter(r => r.line.menuItemId === 'pizza').reduce((sum,r) => sum+r.line.quantity,0)).toBe(6);
    expect(result.filter(r => r.line.menuItemId === 'pizza').every(r => r.line.size === 'large')).toBe(true);
    const uneven = expandComboLines([{ menuItemId: 'combo', quantity: 2 }], [{ ...combo, priceCents: 2000 } as unknown as MenuItemDocument], [pizza, drink]);
    expect(uneven.reduce((sum,r) => sum+r.comboPriceCents!*r.line.quantity,0)).toBe(4000);
  });
  it('rejects forged modifications and unavailable components', () => {
    expect(() => expandComboLines([{ menuItemId: 'combo', quantity: 1, extras: ['extra-cheese'] }], [combo], [pizza, drink])).toThrow('fixed');
    expect(() => expandComboLines([{ menuItemId: 'combo', quantity: 1 }], [combo], [pizza])).toThrow('available');
    expect(() => resolveCombo([{ menuItemId: 'combo', quantity: 2 }], [combo])).toThrow();
    expect(() => resolveCombo([{ menuItemId: 'pizza', quantity: 1 }], [pizza])).toThrow('two products');
  });
  it('requires an active configured size and rejects required additional choices', () => {
    const configured = { ...pizza, customization: { variants: [{ id: 'large', name: 'Large', priceCents: 1500, isActive: true }], groups: [] } } as unknown as MenuItemDocument;
    expect(resolveCombo([{ menuItemId: 'pizza', variantId: 'large', quantity: 2 }], [configured])[0].sizeName).toBe('Large');
    expect(() => resolveCombo([{ menuItemId: 'pizza', variantId: 'missing', quantity: 2 }], [configured])).toThrow('active size');
    expect(() => resolveCombo([{ menuItemId: 'pizza', quantity: 2, size: 'large' }], [configured])).toThrow();
  });
  it('leaves ordinary prices alone and never adds legacy surcharges to a combo', () => {
    expect(expandComboLines([{ menuItemId: 'pizza', quantity: 1 }], [pizza], [])[0].comboPriceCents).toBeUndefined();
    expect(priceOrderItem(combo, { menuItemId: 'combo', quantity: 1 }, { mediumSizeDeltaCents: 500 }).unitPriceCents).toBe(2001);
  });
});
