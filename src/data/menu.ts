import { Ionicons } from '@expo/vector-icons';
import { MenuItem } from '../types';

export const MENU_ITEMS: MenuItem[] = [
  // Bebidas
  { id: 'beb-1', category: 'bebidas', name: 'Refrigerante Lata / Tônica', price: 8 },
  { id: 'beb-2', category: 'bebidas', name: 'Suco Natural com Água', price: 15 },
  { id: 'beb-3', category: 'bebidas', name: 'Suco Natural com Leite', price: 18 },
  { id: 'beb-4', category: 'bebidas', name: 'Água Mineral Sem Gás', price: 4 },
  { id: 'beb-5', category: 'bebidas', name: 'Água Mineral Com Gás', price: 5 },
  { id: 'beb-6', category: 'bebidas', name: 'Cerveja Pilsen (350ml)', price: 7 },
  { id: 'beb-7', category: 'bebidas', name: 'Cerveja Puro Malte (350ml)', price: 8 },
  { id: 'beb-8', category: 'bebidas', name: 'Cerveja Heineken (350ml)', price: 10 },
  { id: 'beb-9', category: 'bebidas', name: 'Cerveja Brahma Sem Álcool', price: 8 },
  { id: 'beb-10', category: 'bebidas', name: 'Cerveja Heineken Sem Álcool', price: 11 },

  // Drinks
  { id: 'dri-1', category: 'drinks', name: 'Caipirinha (1 Fruta) - Pinga', price: 23 },
  { id: 'dri-2', category: 'drinks', name: 'Caipirinha (1 Fruta) - Vodka', price: 28 },
  { id: 'dri-3', category: 'drinks', name: 'Caipirinha (1 Fruta) - Saquê', price: 28 },
  { id: 'dri-4', category: 'drinks', name: 'Caipirinha (2 Frutas) - Pinga', price: 28 },
  { id: 'dri-5', category: 'drinks', name: 'Caipirinha (2 Frutas) - Vodka', price: 33 },
  { id: 'dri-6', category: 'drinks', name: 'Caipirinha (2 Frutas) - Saquê', price: 33 },
  { id: 'dri-7', category: 'drinks', name: 'Batida', price: 30 },
  { id: 'dri-8', category: 'drinks', name: 'Espanhola', price: 30 },

  // Doses e Energéticos
  { id: 'dos-1', category: 'doses', name: 'Dose - Cachaça 51', price: 5 },
  { id: 'dos-2', category: 'doses', name: 'Dose - Velho Barreiro', price: 5 },
  { id: 'dos-3', category: 'doses', name: 'Dose - Ypióca', price: 10 },
  { id: 'dos-4', category: 'doses', name: 'Dose - Dreher', price: 10 },
  { id: 'dos-5', category: 'doses', name: 'Dose - Contini', price: 10 },
  { id: 'dos-6', category: 'doses', name: 'Dose - Campari', price: 15 },
  { id: 'dos-7', category: 'doses', name: 'Dose - Whisky 8 Anos', price: 40 },
  { id: 'dos-8', category: 'doses', name: 'Dose - Whisky 12 Anos', price: 50 },
  { id: 'dos-9', category: 'doses', name: 'Energético Red Bull', price: 20 },

  // Porções
  { id: 'por-1', category: 'porcoes', name: 'Porção de Camarão (G)', price: 100 },
  { id: 'por-2', category: 'porcoes', name: 'Porção de Camarão (M)', price: 80 },
  { id: 'por-3', category: 'porcoes', name: 'Porção de Porquinho (G)', price: 100 },
  { id: 'por-4', category: 'porcoes', name: 'Porção de Porquinho (M)', price: 80 },
  { id: 'por-5', category: 'porcoes', name: 'Porção de Filé de Pescada (Isca) (G)', price: 100 },
  { id: 'por-6', category: 'porcoes', name: 'Porção de Filé de Pescada (Isca) (M)', price: 80 },
  { id: 'por-7', category: 'porcoes', name: 'Porção de Cação (G)', price: 100 },
  { id: 'por-8', category: 'porcoes', name: 'Porção de Cação (M)', price: 80 },
  { id: 'por-9', category: 'porcoes', name: 'Porção de Lula à Dorê (G)', price: 150 },
  { id: 'por-10', category: 'porcoes', name: 'Porção Mista', price: 190 },
  { id: 'por-11', category: 'porcoes', name: 'Porção de Cebola', price: 30 },
  { id: 'por-12', category: 'porcoes', name: 'Porção de Calabresa', price: 55 },
  { id: 'por-13', category: 'porcoes', name: 'Porção de Frango a Passarinho', price: 60 },
  { id: 'por-14', category: 'porcoes', name: 'Porção de Batata Frita Tradicional', price: 55 },
  { id: 'por-15', category: 'porcoes', name: 'Porção de Batata Frita com Cheddar/Catupiry', price: 65 },
  { id: 'por-16', category: 'porcoes', name: 'Porção de Mandioca Frita', price: 55 },
  { id: 'por-17', category: 'porcoes', name: 'Porção de Polenta Frita', price: 60 },

  // Pastéis
  { id: 'pas-1', category: 'pasteis', name: 'Porção de Mini Pastel (12 unidades)', price: 60 },
  {
    id: 'pas-2',
    category: 'pasteis',
    name: 'Pastel (1 Sabor: Carne/Queijo/Frango/Calabresa/Bauru)',
    price: 20,
  },
  {
    id: 'pas-3',
    category: 'pasteis',
    name: 'Pastel (2 Sabores: Carne+Queijo / Calabresa+Queijo)',
    price: 25,
  },
  { id: 'pas-4', category: 'pasteis', name: 'Pastel de Camarão', price: 25 },
];

export const CATEGORY_LABELS: Record<string, string> = {
  bebidas: 'Bebidas',
  drinks: 'Drinks',
  doses: 'Doses & Energéticos',
  porcoes: 'Porções',
  pasteis: 'Pastéis',
};

export const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  bebidas: 'beer-outline',
  drinks: 'wine-outline',
  doses: 'flask-outline',
  porcoes: 'restaurant-outline',
  pasteis: 'fast-food-outline',
};
