import type { ProductMedia } from './media';

export { resolveProductImage } from './media';

export type SizeOption = {
  id: 'small' | 'medium' | 'large';
  label: string;
  delta: number;
};

export type ExtraOption = {
  id: string;
  label: string;
  price: number;
};

export type Pizza = ProductMedia & {
  pizzaId?: string;
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  ingredients: string[];
  allergens?: string[];
};

export const heroImage = '/images/hero-pizza.png';

export const PIZZAS: Pizza[] = [
  {
    id: 'margherita',
    name: 'Margherita',
    tagline: 'The timeless classic',
    description:
      'San Marzano tomato, fior di latte and fresh basil on a 48-hour fermented sourdough base.',
    price: 9.9,
    ingredients: ['San Marzano Tomato', 'Fior di Latte', 'Fresh Basil', 'Olive Oil'],
    imageUrl: null,
    image: '/images/pizza-margherita.png',
  },
  {
    id: 'pepperoni',
    name: 'Pepperoni',
    tagline: 'Crispy cup & char',
    description:
      'Stacked with crispy pepperoni cups, melted mozzarella and a touch of chili honey.',
    price: 11.9,
    ingredients: ['Tomato', 'Mozzarella', 'Pepperoni Cups', 'Chili Honey'],
    image: '/images/pizza-pepperoni.png',
  },
  {
    id: 'salami',
    name: 'Salami',
    tagline: 'Bold & savory',
    description: 'Thin-sliced Italian salami, mozzarella and oregano over a rich tomato base.',
    price: 11.5,
    ingredients: ['Tomato', 'Mozzarella', 'Italian Salami', 'Oregano'],
    image: '/images/pizza-salami.png',
  },
  {
    id: 'bbq-chicken',
    name: 'BBQ Chicken',
    tagline: 'Smoky & sweet',
    description: 'Grilled chicken, red onion and smoky BBQ drizzle on bubbling mozzarella.',
    price: 13.9,
    ingredients: ['BBQ Sauce', 'Mozzarella', 'Grilled Chicken', 'Red Onion'],
    image: '/images/pizza-bbq-chicken.png',
  },
  {
    id: 'quattro-formaggi',
    name: 'Quattro Formaggi',
    tagline: 'Four cheese indulgence',
    description: 'Mozzarella, gorgonzola, parmesan and fontina melted to golden perfection.',
    price: 13.5,
    ingredients: ['Mozzarella', 'Gorgonzola', 'Parmesan', 'Fontina'],
    image: '/images/pizza-quattro-formaggi.png',
  },
  {
    id: 'diavola',
    name: 'Diavola',
    tagline: 'Turn up the heat',
    description: "Spicy salami, chili flakes and 'nduja for a fiery, full-flavored bite.",
    price: 12.9,
    ingredients: ['Tomato', 'Mozzarella', 'Spicy Salami', 'Chili Flakes'],
    image: '/images/pizza-diavola.png',
  },
  {
    id: 'tonno',
    name: 'Tonno',
    tagline: 'Fresh from the coast',
    description: 'Line-caught tuna, red onion and capers over a bright tomato base.',
    price: 12.5,
    ingredients: ['Tomato', 'Mozzarella', 'Tuna', 'Red Onion'],
    image: '/images/pizza-tonno.png',
  },
  {
    id: 'vegetariana',
    name: 'Vegetariana',
    tagline: 'Garden fresh',
    description: 'Roasted peppers, zucchini, eggplant and cherry tomatoes, lightly charred.',
    price: 11.9,
    ingredients: ['Tomato', 'Mozzarella', 'Peppers', 'Zucchini', 'Eggplant'],
    image: '/images/pizza-vegetariana.png',
  },
  {
    id: 'funghi',
    name: 'Funghi',
    tagline: 'Earthy & rich',
    description: 'Sauteed mushrooms, mozzarella and parsley with a hint of garlic.',
    price: 11.5,
    ingredients: ['Tomato', 'Mozzarella', 'Mushrooms', 'Parsley'],
    image: '/images/pizza-funghi.png',
  },
  {
    id: 'yespiz-special',
    name: 'YesPiz Special',
    tagline: 'Our signature masterpiece',
    description:
      'San Marzano base, creamy burrata, prosciutto di Parma, wild arugula and shaved truffle.',
    price: 15.9,
    ingredients: ['San Marzano', 'Burrata', 'Prosciutto', 'Arugula', 'Truffle'],
    image: '/images/pizza-yespiz-special.png',
  },
];

export const SIZES: SizeOption[] = [
  { id: 'small', label: 'Small', delta: -2 },
  { id: 'medium', label: 'Medium', delta: 0 },
  { id: 'large', label: 'Large', delta: 3 },
];

export const EXTRAS: ExtraOption[] = [
  { id: 'extra-cheese', label: 'Extra Cheese', price: 1.5 },
  { id: 'jalapenos', label: 'Jalapenos', price: 1.0 },
  { id: 'olives', label: 'Olives', price: 1.0 },
  { id: 'garlic-dip', label: 'Garlic Dip', price: 0.9 },
];

export type Promo = {
  id: string;
  key: 'welcome' | 'free' | 'weekend';
};

export const PROMOS: Promo[] = [
  { id: 'p1', key: 'free' },
  { id: 'p2', key: 'welcome' },
  { id: 'p3', key: 'weekend' },
];

export const getPizza = (id: string) => PIZZAS.find((p) => p.id === id);

export const formatPrice = (n: number) => `€${n.toFixed(2)}`;

export const DELIVERY_FEE = 0;
