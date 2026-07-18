import { MenuItem } from '../types';

export const MENU_ITEMS: MenuItem[] = [
  // Bebidas
  { id: 'bev-1', category: 'bebidas', name: 'Coca-Cola 350ml', price: 7 },
  { id: 'bev-2', category: 'bebidas', name: 'Guaraná Antarctica 350ml', price: 7 },
  { id: 'bev-3', category: 'bebidas', name: 'Água Mineral 500ml', price: 5 },
  { id: 'bev-4', category: 'bebidas', name: 'Água de Coco 300ml', price: 8 },
  { id: 'bev-5', category: 'bebidas', name: 'Cerveja Long Neck', price: 12 },
  { id: 'bev-6', category: 'bebidas', name: 'Chopp 500ml', price: 14 },
  { id: 'bev-7', category: 'bebidas', name: 'Caipirinha', price: 18 },
  { id: 'bev-8', category: 'bebidas', name: 'Suco Natural 500ml', price: 12 },
  { id: 'bev-9', category: 'bebidas', name: 'Refrigerante Lata', price: 6 },

  // Porções
  { id: 'por-1', category: 'porcoes', name: 'Porção de Peixe', price: 65, description: 'Serve 2 pessoas' },
  { id: 'por-2', category: 'porcoes', name: 'Camarão Empanado', price: 78, description: 'Serve 2 pessoas' },
  { id: 'por-3', category: 'porcoes', name: 'Batata Frita', price: 32, description: 'Serve 2 pessoas' },
  { id: 'por-4', category: 'porcoes', name: 'Isca de Frango', price: 42, description: 'Serve 2 pessoas' },
  { id: 'por-5', category: 'porcoes', name: 'Calabresa Acebolada', price: 38, description: 'Serve 2 pessoas' },
  { id: 'por-6', category: 'porcoes', name: 'Bolinho de Bacalhau (10un)', price: 48 },

  // Pratos
  { id: 'pra-1', category: 'pratos', name: 'Peixe Frito Completo', price: 55 },
  { id: 'pra-2', category: 'pratos', name: 'Camarão na Moranga', price: 89 },
  { id: 'pra-3', category: 'pratos', name: 'Filé à Parmegiana', price: 62 },
  { id: 'pra-4', category: 'pratos', name: 'Risoto de Camarão', price: 68 },

  // Sobremesas
  { id: 'sob-1', category: 'sobremesas', name: 'Pudim', price: 14 },
  { id: 'sob-2', category: 'sobremesas', name: 'Sorvete 2 Bolas', price: 12 },
  { id: 'sob-3', category: 'sobremesas', name: 'Petit Gâteau', price: 18 },
  { id: 'sob-4', category: 'sobremesas', name: 'Salada de Frutas', price: 15 },
];

export const CATEGORY_LABELS: Record<string, string> = {
  bebidas: 'Bebidas',
  porcoes: 'Porções',
  pratos: 'Pratos',
  sobremesas: 'Sobremesas',
};
