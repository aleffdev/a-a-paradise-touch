import acaiImg from "@/assets/cat-acai.jpg";
import picoleImg from "@/assets/cat-picole.jpg";
import esquimoImg from "@/assets/cat-esquimo.jpg";
import paletaImg from "@/assets/cat-paleta.jpg";
import estruzadoImg from "@/assets/cat-estruzado.jpg";
import poteImg from "@/assets/cat-pote.jpg";

export type CategoryId =
  | "acai"
  | "picole"
  | "esquimo"
  | "paleta"
  | "estruzado"
  | "pote";

export interface Category {
  id: CategoryId;
  name: string;
  tagline: string;
  image: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { id: "acai",      name: "Açaí Trufado",      tagline: "Monte do seu jeito",       image: acaiImg,      emoji: "🍇" },
  { id: "picole",    name: "Picolés",           tagline: "Sabores tropicais",        image: picoleImg,    emoji: "🍡" },
  { id: "esquimo",   name: "Esquimó",           tagline: "Cobertura de chocolate",   image: esquimoImg,   emoji: "🍫" },
  { id: "paleta",    name: "Paletas Mexicanas", tagline: "Premium e cremosas",       image: paletaImg,    emoji: "🍦" },
  { id: "estruzado", name: "Estruzados",        tagline: "Trufas artesanais",        image: estruzadoImg, emoji: "🍬" },
  { id: "pote",      name: "Potes",             tagline: "Para levar pra casa",      image: poteImg,      emoji: "🥡" },
];

export interface AcaiSize {
  id: "P" | "M" | "G";
  label: string;
  scoops: number;
  price: number;
}

export const ACAI_SIZES: AcaiSize[] = [
  { id: "P", label: "Pequeno", scoops: 4, price: 18 },
  { id: "M", label: "Médio",   scoops: 6, price: 23 },
  { id: "G", label: "Grande",  scoops: 8, price: 28 },
];

export const ACAI_BASES = ["Açaí", "Sorvete"] as const;

export const ACAI_TOPPINGS = [
  "Paçoca", "Amendoim", "Granola", "Sucrilhos",
  "Leite em pó", "Banana", "Abacaxi",
];

export const ACAI_CALDAS = ["Nutella", "Chocolate Branco", "Ninho", "Ovomaltine"];

export interface SimpleProduct {
  id: string;
  category: CategoryId;
  name: string;
  price: number;
  flavors: string[];
  emoji: string;
}

export const SIMPLE_PRODUCTS: SimpleProduct[] = [
  // Picolés
  { id: "picole",     category: "picole",    name: "Picolé",      price: 1.5,  emoji: "🍡",
    flavors: ["Abacaxi", "Manga", "Amendoim", "Brigadeiro", "Chocolate", "Morango", "Tangerina", "Coco", "Milho"] },
  // Esquimó
  { id: "esquimo",    category: "esquimo",   name: "Esquimó",     price: 5,    emoji: "🍫",
    flavors: ["Maracujá", "Coco", "Morango", "Brigadeiro"] },
  // Paletas Mexicanas
  { id: "paleta",     category: "paleta",    name: "Paleta Mexicana", price: 10, emoji: "🍦",
    flavors: ["Morango", "Prestígio", "Chocotella", "Kinder Bueno", "Rafaello"] },
  // Estruzados
  { id: "estruzado",  category: "estruzado", name: "Estruzado",   price: 5,    emoji: "🍬",
    flavors: ["Chocolate Branco", "Chocolate Preto", "Floresta Negra"] },
  // Potes
  { id: "pote-2l",    category: "pote",      name: "Pote 2L (Sorvete)", price: 35, emoji: "🥡",
    flavors: ["Prestígio", "Laka", "Galak", "Napolitano", "Coco", "Chocolate", "Flocos"] },
  { id: "pote-1l",    category: "pote",      name: "Pote 1L (Açaí)",    price: 30, emoji: "🥤",
    flavors: ["Açaí Tradicional", "Açaí com Banana", "Açaí com Morango"] },
];
