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
  tags: string[];
  stock: number;
};

export const categories: Array<{ id: Category | "todos"; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "colares", label: "Colares" },
  { id: "aneis", label: "Anéis" },
  { id: "pingentes", label: "Pingentes" },
  { id: "pulseiras", label: "Pulseiras" },
  { id: "brincos", label: "Brincos" }
];

export const products: Product[] = [
  {
    id: "colar-aurora",
    name: "Colar Aurora",
    category: "colares",
    categoryLabel: "Colares",
    price: 6490,
    description: "Corrente elegante com banho premium e brilho quente para composições minimalistas.",
    coating: "Banho de ouro 18k",
    video: "/videos/colar-aurora.mp4",
    tags: ["18k", "minimalista", "best-seller"],
    stock: 18
  },
  {
    id: "anel-solar",
    name: "Anel Solar",
    category: "aneis",
    categoryLabel: "Anéis",
    price: 5290,
    description: "Anel delicado com acabamento polido, perfeito para uso diário e mix de anéis.",
    coating: "Banho de ouro 18k",
    video: "/videos/anel-solar.mp4",
    tags: ["ajustável", "polido", "leve"],
    stock: 22
  },
  {
    id: "pingente-lua",
    name: "Pingente Lua",
    category: "pingentes",
    categoryLabel: "Pingentes",
    price: 3990,
    description: "Pingente luminoso para combinar com correntes finas, ideal para presente.",
    coating: "Banho de ouro 18k",
    video: "/videos/pingente-lua.mp4",
    tags: ["delicado", "presente", "lua"],
    stock: 30
  },
  {
    id: "pulseira-celeste",
    name: "Pulseira Celeste",
    category: "pulseiras",
    categoryLabel: "Pulseiras",
    price: 5890,
    description: "Pulseira leve com textura sofisticada, brilho sutil e fecho seguro.",
    coating: "Banho de ouro 18k",
    video: "/videos/pulseira-celeste.mp4",
    tags: ["texturizada", "leve", "premium"],
    stock: 16
  },
  {
    id: "brinco-estrela",
    name: "Brinco Estrela",
    category: "brincos",
    categoryLabel: "Brincos",
    price: 4590,
    description: "Par de brincos com brilho discreto para ocasiões especiais e looks noturnos.",
    coating: "Banho de ouro 18k",
    video: "/videos/brinco-estrela.mp4",
    tags: ["par", "festa", "brilho"],
    stock: 24
  },
  {
    id: "colar-riviera",
    name: "Colar Riviera",
    category: "colares",
    categoryLabel: "Colares",
    price: 8990,
    description: "Peça marcante para composições elegantes, com presença premium e acabamento fino.",
    coating: "Banho de ouro 18k",
    video: "/videos/colar-riviera.mp4",
    tags: ["premium", "noite", "sofisticado"],
    stock: 10
  },
  {
    id: "anel-imperial",
    name: "Anel Imperial",
    category: "aneis",
    categoryLabel: "Anéis",
    price: 6790,
    description: "Anel robusto e elegante com presença visual para coleções exclusivas.",
    coating: "Banho de ouro 18k",
    video: "/videos/anel-imperial.mp4",
    tags: ["statement", "18k", "exclusivo"],
    stock: 12
  },
  {
    id: "pingente-coracao",
    name: "Pingente Coração",
    category: "pingentes",
    categoryLabel: "Pingentes",
    price: 4290,
    description: "Pingente romântico banhado a ouro, ótimo para kits presenteáveis.",
    coating: "Banho de ouro 18k",
    video: "/videos/pingente-coracao.mp4",
    tags: ["romântico", "presente", "18k"],
    stock: 28
  }
];

export function findProduct(id: string) {
  return products.find((product) => product.id === id);
}
