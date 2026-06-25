export type Category = "colares" | "aneis" | "pingentes" | "pulseiras" | "brincos";

export type Product = {
  id: string;
  name: string;
  category: Category;
  categoryLabel: string;
  price: number;
  description: string;
  coating: string;
  video: string;
  image: string;
  tags: string[];
  stock: number;
  featured?: boolean;
};

export type SiteSettings = {
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  instagram: string;
  pinterest: string;
  tiktok: string;
  address: string;
};

export const categories: Array<{ id: Category | "todos"; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "colares", label: "Colares" },
  { id: "brincos", label: "Brincos" },
  { id: "pingentes", label: "Pingentes" },
  { id: "pulseiras", label: "Pulseiras" },
  { id: "aneis", label: "Anéis" }
];

export const defaultSettings: SiteSettings = {
  brandName: "Noir Atelier",
  heroTitle: "Alta joalheria em pedras negras.",
  heroSubtitle:
    "Uma maison digital de luxo sombrio, onde ônix, prata escura e luz cinematográfica revelam peças raras com silêncio, mistério e precisão editorial.",
  contactEmail: "concierge@noiratelier.com",
  contactPhone: "+351 900 000 000",
  whatsapp: "https://wa.me/351900000000",
  instagram: "https://instagram.com/noiratelier",
  pinterest: "https://pinterest.com/noiratelier",
  tiktok: "https://tiktok.com/@noiratelier",
  address: "Lisboa · atendimento privado por marcação"
};

export const products: Product[] = [
  {
    id: "colar-onyx-editorial",
    name: "Colar Onyx Editorial",
    category: "colares",
    categoryLabel: "Colares",
    price: 189000,
    description: "Colar de pedras negras com estrutura em prata escurecida e presença dramática de alta joalheria.",
    coating: "Prata escura · pedras negras",
    video: "/videos/colar-riviera.mp4",
    image: "/editorial/macro-necklace.png",
    tags: ["onyx", "editorial", "alta joalheria"],
    stock: 3,
    featured: true
  },
  {
    id: "brincos-nocturne",
    name: "Brincos Nocturne",
    category: "brincos",
    categoryLabel: "Brincos",
    price: 124000,
    description: "Par de brincos com reflexos frios, pedras negras facetadas e silhueta de campanha couture.",
    coating: "Prata escura · ônix facetado",
    video: "/videos/brinco-estrela.mp4",
    image: "/editorial/macro-earrings.png",
    tags: ["par", "ônix", "couture"],
    stock: 5,
    featured: true
  },
  {
    id: "pingente-eclipse",
    name: "Pingente Eclipse",
    category: "pingentes",
    categoryLabel: "Pingentes",
    price: 98000,
    description: "Pingente minimalista em pedra negra, criado para refletir luz lateral com profundidade mineral.",
    coating: "Prata escurecida · pedra negra",
    video: "/videos/pingente-lua.mp4",
    image: "/editorial/macro-pendant.png",
    tags: ["eclipse", "minimal", "noir"],
    stock: 7
  },
  {
    id: "pulseira-shadow-line",
    name: "Pulseira Shadow Line",
    category: "pulseiras",
    categoryLabel: "Pulseiras",
    price: 136000,
    description: "Pulseira escultórica com pedras negras alinhadas e acabamento metálico grafite premium.",
    coating: "Metal grafite · pedras negras",
    video: "/videos/pulseira-celeste.mp4",
    image: "/editorial/macro-bracelet.png",
    tags: ["grafite", "shadow", "macro"],
    stock: 4
  },
  {
    id: "anel-obsidian",
    name: "Anel Obsidian",
    category: "aneis",
    categoryLabel: "Anéis",
    price: 86000,
    description: "Anel em pedra escura com desenho limpo, reflexo profundo e acabamento de joia de noite.",
    coating: "Prata escura · obsidiana",
    video: "/videos/anel-imperial.mp4",
    image: "/editorial/macro-pendant.png",
    tags: ["obsidiana", "noite", "minimal"],
    stock: 6
  },
  {
    id: "colar-mineral-noir",
    name: "Colar Mineral Noir",
    category: "colares",
    categoryLabel: "Colares",
    price: 212000,
    description: "Peça central da coleção, com pedras negras em composição arquitetónica e acabamento espelhado.",
    coating: "Prata escura · mineral noir",
    video: "/videos/colar-aurora.mp4",
    image: "/editorial/hero-model.png",
    tags: ["raro", "campanha", "noir"],
    stock: 2,
    featured: true
  }
];

export function findProduct(id: string) {
  return products.find((product) => product.id === id);
}
