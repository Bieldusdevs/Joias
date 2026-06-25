"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { categories, defaultSettings, products as defaultProducts } from "@/lib/products";
import type { Category, Product, SiteSettings } from "@/lib/products";
import { money } from "@/lib/money";

type CartLine = {
  id: string;
  quantity: number;
};

type CartViewLine = CartLine & {
  product: Product;
};

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.z += sin((position.x + position.y) * 2.0) * 0.01;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uMouse;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
      (c - a) * u.y * (1.0 - u.x) +
      (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    float n = noise(uv * 3.2 + vec2(uTime * 0.025, -uTime * 0.018));
    float vignette = smoothstep(0.86, 0.18, distance(uv, vec2(0.5)));
    float mouseLight = smoothstep(0.34, 0.0, distance(uv, uMouse));
    float diagonal = smoothstep(0.12, 0.82, uv.x + uv.y + sin(uTime * 0.2) * 0.15);

    vec3 black = vec3(0.0);
    vec3 graphite = vec3(0.025, 0.022, 0.019);
    vec3 gold = vec3(1.0, 0.72, 0.34);

    vec3 color = mix(black, graphite, n * 0.55);
    color += gold * mouseLight * 0.10;
    color += gold * diagonal * n * 0.018;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "todos">("todos");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(defaultProducts);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const rawCart = window.localStorage.getItem("aurora-cart");

    if (rawCart) {
      try {
        setCart(JSON.parse(rawCart) as CartLine[]);
      } catch {
        setCart([]);
      }
    }

    fetch("/api/content", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((content) => {
        if (!content) return;
        setCatalog(content.products || defaultProducts);
        setSettings(content.settings || defaultSettings);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("aurora-cart", JSON.stringify(cart));
  }, [cart, mounted]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.12,
      smoothWheel: true,
      wheelMultiplier: 0.82,
      lerp: 0.075
    });

    let frame = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };

    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".reveal",
        { y: 34, opacity: 0, filter: "blur(14px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.15,
          stagger: 0.075,
          ease: "power3.out"
        }
      );

      gsap.utils.toArray<HTMLElement>(".scroll-rise").forEach((element) => {
        gsap.fromTo(
          element,
          { y: 90, opacity: 0.3 },
          {
            y: -10,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              start: "top 92%",
              end: "bottom 18%",
              scrub: 1
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>(".metal-sweep").forEach((element) => {
        gsap.to(element, {
          backgroundPosition: "220% center",
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.3
          }
        });
      });

      gsap.to(".cinema-video", {
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: ".cinema-section",
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });

    return () => ctx.revert();
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "todos") return catalog;
    return catalog.filter((product) => product.category === selectedCategory);
  }, [catalog, selectedCategory]);

  const cartLines = useMemo<CartViewLine[]>(
    () =>
      cart.flatMap((line) => {
        const product = catalog.find((p) => p.id === line.id);
        return product ? [{ ...line, product }] : [];
      }),
    [cart, catalog]
  );

  const cartTotal = cartLines.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0
  );

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);

  const addToCart = (id: string) => {
    setCart((current) => {
      const exists = current.find((item) => item.id === id);

      if (exists) {
        return current.map((item) =>
          item.id === id ? { ...item, quantity: Math.min(20, item.quantity + 1) } : item
        );
      }

      return [...current, { id, quantity: 1 }];
    });

    setCartOpen(true);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.id !== id));
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.min(20, quantity) } : item
      )
    );
  };

  const checkout = async () => {
    if (cart.length === 0) return;

    setCheckoutLoading(true);
    setNotice(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity
          }))
        })
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Não foi possível iniciar o checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível iniciar o checkout.");
      setCheckoutLoading(false);
    }
  };

  return (
    <main>
      <WebGLBackground />
      <WebGPUSheen />
      <CustomCursor />

      <Header settings={settings} cartCount={cartCount} onCartClick={() => setCartOpen(true)} />

      <section className="hero-cinema">
        <video
          className="hero-video"
          src={catalog[0]?.video || "/videos/colar-riviera.mp4"}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="hero-noise" />
        <div className="section-pad hero-inner">
          <div className="hero-copy">
            <p className="eyebrow reveal">{settings.brandName} · alta joalheria noir</p>
            <h1 className="reveal metal-sweep">{settings.heroTitle}</h1>
            <p className="hero-text reveal">{settings.heroSubtitle}</p>
            <div className="hero-actions reveal">
              <a className="button primary" href="#colecao">
                Comprar coleção
              </a>
              <a className="button ghost" href="#atelier">
                Ver atelier WebGL
              </a>
            </div>
          </div>

          <div className="hero-sculpture reveal" aria-label="Editorial de alta joalheria">
            <img src="/editorial/hero-model.png" alt="Modelo editorial usando colar e brincos de pedras negras" />
            <div className="hero-portrait-shine" />
          </div>
        </div>
      </section>

      <section id="maison" className="section-pad maison-section spacious">
        <div className="maison-kicker scroll-rise">01 · Maison</div>
        <div className="maison-text scroll-rise">
          <p>
            O brilho não precisa gritar. Cada peça da {settings.brandName} foi pensada para refletir luz com delicadeza,
            textura metálica e proporção elegante — do primeiro olhar ao último detalhe.
          </p>
        </div>
        <div className="maison-metrics scroll-rise">
          <span><strong>Onyx</strong> pedras negras</span>
          <span><strong>6</strong> peças editoriais</span>
          <span><strong>Private</strong> concierge</span>
        </div>
      </section>

      <section className="cinema-section">
        <video
          className="cinema-video"
          src="/videos/pingente-coracao.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="cinema-overlay">
          <p className="eyebrow scroll-rise">Filme da coleção</p>
          <h2 className="scroll-rise metal-sweep">Reflexos de prata escura em movimento fullscreen.</h2>
        </div>
      </section>

      <section id="colecao" className="section-pad collection spacious">
        <div className="section-heading scroll-rise">
          <p className="eyebrow">02 · Coleção</p>
          <h2 className="metal-sweep">Escolha por categoria.</h2>
          <p>
            Colares, anéis, pingentes, pulseiras e brincos com visual limpo, acabamento luminoso
            e vídeos de produto para uma compra mais sensorial.
          </p>
        </div>

        <div className="category-row scroll-rise">
          {categories.map((category) => (
            <button
              key={category.id}
              className={selectedCategory === category.id ? "chip active" : "chip"}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <motion.div layout className="product-grid">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => addToCart(product.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <section id="atelier" className="section-pad atelier-section spacious">
        <div className="section-heading scroll-rise">
          <p className="eyebrow">03 · Renderizações 3D</p>
          <h2 className="metal-sweep">Metal, reflexo e volume.</h2>
          <p>
            Modelos 3D procedurais renderizados em WebGL para reforçar a sensação de profundidade,
            brilho e materialidade das joias.
          </p>
        </div>

        <div className="sculpture-grid">
          <SculptureCard title="Colar Noir" variant="necklace" />
          <SculptureCard title="Pingente Eclipse" variant="pendant" />
          <SculptureCard title="Brincos Onyx" variant="earrings" />
        </div>
      </section>

      <section className="section-pad craft-section spacious">
        <div className="craft-panel scroll-rise">
          <p className="eyebrow">04 · Acabamento</p>
          <h2 className="metal-sweep">Glassmorphism sutil, preto absoluto e luz metálica.</h2>
          <p>
            O desenho visual valoriza contraste, espaços amplos e reflexos em prata escura. A interface fica
            discreta para que as peças sejam protagonistas da experiência.
          </p>
        </div>
        <div className="craft-list">
          <Feature title="Metal luminoso" text="Superfícies em prata escura com aparência polida e acabamento sofisticado." />
          <Feature title="Compra fluida" text="Carrinho rápido, checkout seguro e navegação sem fricção." />
          <Feature title="Experiência cinematográfica" text="Vídeos fullscreen, movimento por scroll e profundidade WebGL." />
          <Feature title="Entrega com cuidado" text="Peças preparadas para envio com atenção à apresentação e conservação." />
        </div>
      </section>

      <section className="fullscreen-split">
        <div className="split-video-wrap">
          <video
            className="split-video"
            src="/videos/anel-imperial.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>
        <div className="split-copy scroll-rise">
          <p className="eyebrow">05 · Serviço</p>
          <h2 className="metal-sweep">Compra segura, apresentação premium.</h2>
          <p>
            Pagamento protegido, confirmação imediata e embalagem pensada para preservar o brilho da peça.
            Uma loja pronta para receber clientes com aparência de marca estabelecida.
          </p>
          <a className="button primary" href="#colecao">Ver joias disponíveis</a>
        </div>
      </section>

      <Footer settings={settings} />

      <CartDrawer
        open={cartOpen}
        lines={cartLines}
        total={cartTotal}
        loading={checkoutLoading}
        notice={notice}
        onClose={() => setCartOpen(false)}
        onUpdate={updateQuantity}
        onCheckout={checkout}
      />
    </main>
  );
}

function Header({
  settings,
  cartCount,
  onCartClick
}: {
  settings: SiteSettings;
  cartCount: number;
  onCartClick: () => void;
}) {
  return (
    <header className="site-header">
      <a className="brand" href="#" aria-label={settings.brandName}>
        <span>{settings.brandName.slice(0, 1)}</span>
        {settings.brandName}
      </a>

      <nav>
        <a href="#maison">Maison</a>
        <a href="#colecao">Coleção</a>
        <a href="#atelier">Atelier</a>
      </nav>

      <button className="cart-button" onClick={onCartClick}>
        Sacola
        <b>{cartCount}</b>
      </button>
    </header>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <motion.article
      layout
      className="product-card scroll-rise"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.35 }}
    >
      <ProductMedia product={product} />

      <div className="product-info">
        <div>
          <span className="category-label">{product.categoryLabel}</span>
          <h3>{product.name}</h3>
        </div>

        <strong>{money.format(product.price / 100)}</strong>
      </div>

      <p>{product.description}</p>

      <div className="tag-row">
        {product.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <button className="button full" onClick={onAdd}>
        Adicionar à sacola
      </button>
    </motion.article>
  );
}

function ProductMedia({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="video-box">
      {!failed ? (
        <img src={product.image} alt={product.name} onError={() => setFailed(true)} />
      ) : (
        <div className="video-fallback">
          <span>{product.name}</span>
          <small>Fotografia macro editorial</small>
        </div>
      )}
      <div className="video-glow" />
    </div>
  );
}

function CartDrawer({
  open,
  lines,
  total,
  loading,
  notice,
  onClose,
  onUpdate,
  onCheckout
}: {
  open: boolean;
  lines: CartViewLine[];
  total: number;
  loading: boolean;
  notice: string | null;
  onClose: () => void;
  onUpdate: (id: string, quantity: number) => void;
  onCheckout: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            className="drawer-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Fechar sacola"
          />

          <motion.aside
            className="cart-drawer"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
          >
            <div className="drawer-head">
              <div>
                <p className="eyebrow">Sacola</p>
                <h2>A sua seleção</h2>
              </div>
              <button className="icon-button" onClick={onClose} aria-label="Fechar">
                ×
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="empty-cart">
                <p>A sua sacola ainda está vazia.</p>
                <a className="button ghost" href="#colecao" onClick={onClose}>
                  Explorar coleção
                </a>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {lines.map((line) => (
                    <div className="cart-line" key={line.id}>
                      <div>
                        <strong>{line.product.name}</strong>
                        <span>{money.format(line.product.price / 100)}</span>
                      </div>

                      <div className="qty">
                        <button onClick={() => onUpdate(line.id, line.quantity - 1)} aria-label="Diminuir">
                          -
                        </button>
                        <span>{line.quantity}</span>
                        <button onClick={() => onUpdate(line.id, line.quantity + 1)} aria-label="Aumentar">
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-total">
                  <span>Total</span>
                  <strong>{money.format(total / 100)}</strong>
                </div>

                <button className="button primary full" onClick={onCheckout} disabled={loading}>
                  {loading ? "A abrir pagamento..." : "Finalizar compra"}
                </button>

                {notice ? <p className="checkout-error">{notice}</p> : null}

                <p className="checkout-note">
                  Pagamento protegido. Dados financeiros processados em ambiente seguro.
                </p>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <motion.div
      className="feature scroll-rise"
      whileHover={{ y: -6, borderColor: "rgba(245, 210, 145, 0.46)" }}
    >
      <span />
      <h3>{title}</h3>
      <p>{text}</p>
    </motion.div>
  );
}

function SculptureCard({
  title,
  variant
}: {
  title: string;
  variant: "necklace" | "pendant" | "earrings";
}) {
  return (
    <motion.div className="sculpture-card scroll-rise" whileHover={{ y: -8 }}>
      <Canvas camera={{ position: [0, 0.25, 4.5], fov: 42 }} dpr={[1, 1.8]}>
        <JewelryLights />
        <JewelrySculpture variant={variant} />
      </Canvas>
      <div className="sculpture-label">
        <p className="eyebrow">Render 3D</p>
        <h3>{title}</h3>
      </div>
    </motion.div>
  );
}

function JewelryLights() {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 3]} intensity={3.4} color="#ffe1a0" />
      <directionalLight position={[-4, 1, 2]} intensity={1.6} color="#ffffff" />
      <pointLight position={[0, -1.8, 2.6]} intensity={2.2} color="#c98b3c" />
    </>
  );
}

function JewelrySculpture({ variant }: { variant: "necklace" | "pendant" | "earrings" }) {
  const group = useRef<THREE.Group>(null);
  const gold = "#f4c26e";

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * 0.42;
    group.current.rotation.x = Math.sin(clock.elapsedTime * 0.55) * 0.1;
  });

  return (
    <group ref={group}>
      {variant === "necklace" ? (
        <>
          <mesh scale={[1.12, 1.42, 1]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.05, 0.035, 24, 180]} />
            <meshPhysicalMaterial color={gold} metalness={1} roughness={0.18} clearcoat={1} />
          </mesh>
          {Array.from({ length: 18 }).map((_, index) => {
            const angle = (index / 17) * Math.PI + Math.PI;
            const x = Math.cos(angle) * 1.18;
            const y = Math.sin(angle) * 1.48 - 0.1;
            return (
              <mesh key={index} position={[x, y, 0.02]}>
                <sphereGeometry args={[0.055, 24, 24]} />
                <meshPhysicalMaterial color="#ffe1a0" metalness={1} roughness={0.12} clearcoat={1} />
              </mesh>
            );
          })}
          <mesh position={[0, -1.56, 0.05]} rotation={[0.4, 0.2, 0.2]}>
            <dodecahedronGeometry args={[0.22, 1]} />
            <meshPhysicalMaterial color="#fff0bf" metalness={0.65} roughness={0.08} clearcoat={1} />
          </mesh>
        </>
      ) : null}

      {variant === "pendant" ? (
        <>
          <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42, 0.03, 24, 90]} />
            <meshPhysicalMaterial color={gold} metalness={1} roughness={0.14} clearcoat={1} />
          </mesh>
          <mesh position={[0, -0.1, 0]} rotation={[0.25, 0, Math.PI / 4]}>
            <boxGeometry args={[0.9, 0.9, 0.16]} />
            <meshPhysicalMaterial color={gold} metalness={1} roughness={0.13} clearcoat={1} />
          </mesh>
          <mesh position={[0, -0.1, 0.11]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshPhysicalMaterial color="#fff4d2" metalness={0.35} roughness={0.04} clearcoat={1} />
          </mesh>
        </>
      ) : null}

      {variant === "earrings" ? (
        <>
          <mesh position={[-0.46, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.022, 24, 80]} />
            <meshPhysicalMaterial color={gold} metalness={1} roughness={0.14} clearcoat={1} />
          </mesh>
          <mesh position={[0.46, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.022, 24, 80]} />
            <meshPhysicalMaterial color={gold} metalness={1} roughness={0.14} clearcoat={1} />
          </mesh>
          <mesh position={[-0.46, -0.12, 0]} rotation={[0.35, 0.25, 0.2]}>
            <octahedronGeometry args={[0.34, 2]} />
            <meshPhysicalMaterial color="#0b0b0d" metalness={0.6} roughness={0.08} clearcoat={1} />
          </mesh>
          <mesh position={[0.46, -0.12, 0]} rotation={[0.35, -0.25, -0.2]}>
            <octahedronGeometry args={[0.34, 2]} />
            <meshPhysicalMaterial color="#0b0b0d" metalness={0.6} roughness={0.08} clearcoat={1} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}

function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="footer">
      <div>
        <a className="brand footer-brand" href="#">
          <span>{settings.brandName.slice(0, 1)}</span>
          {settings.brandName}
        </a>
        <p>{settings.address}</p>
        <p>{settings.contactEmail} · {settings.contactPhone}</p>
      </div>
      <div className="footer-links">
        <a href="#maison">Maison</a>
        <a href="#colecao">Coleção</a>
        <a href="#atelier">Atelier</a>
        {settings.instagram ? <a href={settings.instagram}>Instagram</a> : null}
      </div>
    </footer>
  );
}

function WebGLBackground() {
  return (
    <div className="webgl-bg">
      <Canvas camera={{ position: [0, 0, 1], fov: 75 }} dpr={[1, 1.7]}>
        <ShaderPlane />
      </Canvas>
    </div>
  );
}

function ShaderPlane() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: mouse.current }
    }),
    []
  );

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      targetMouse.current.set(
        event.clientX / window.innerWidth,
        1 - event.clientY / window.innerHeight
      );
    };

    window.addEventListener("pointermove", handlePointer);

    return () => window.removeEventListener("pointermove", handlePointer);
  }, []);

  useFrame(({ clock }) => {
    mouse.current.lerp(targetMouse.current, 0.055);

    if (material.current) {
      material.current.uniforms.uTime.value = clock.elapsedTime;
      material.current.uniforms.uMouse.value = mouse.current;
    }
  });

  return (
    <mesh scale={[2.8, 2.8, 1]}>
      <planeGeometry args={[2, 2, 90, 90]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

function WebGPUSheen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let frame = 0;
    let active = true;

    const init = async () => {
      const canvas = canvasRef.current;
      const gpu = (navigator as Navigator & { gpu?: any }).gpu;

      if (!canvas || !gpu) return;

      const adapter = await gpu.requestAdapter();
      if (!adapter || !active) return;

      const device = await adapter.requestDevice();
      const context = canvas.getContext("webgpu") as any;
      if (!context || !active) return;

      const format = gpu.getPreferredCanvasFormat();

      const shader = device.createShaderModule({
        code: `
          struct Uniforms {
            time: f32,
            width: f32,
            height: f32,
            pad: f32
          };

          @group(0) @binding(0)
          var<uniform> uniforms: Uniforms;

          @vertex
          fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
            var positions = array<vec2<f32>, 6>(
              vec2<f32>(-1.0, -1.0),
              vec2<f32>(1.0, -1.0),
              vec2<f32>(-1.0, 1.0),
              vec2<f32>(-1.0, 1.0),
              vec2<f32>(1.0, -1.0),
              vec2<f32>(1.0, 1.0)
            );

            let position = positions[vertexIndex];
            return vec4<f32>(position, 0.0, 1.0);
          }

          @fragment
          fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
            let uv = coord.xy / vec2<f32>(uniforms.width, uniforms.height);
            let center = vec2<f32>(
              0.68 + sin(uniforms.time * 0.13) * 0.18,
              0.30 + cos(uniforms.time * 0.10) * 0.12
            );
            let d = distance(uv, center);
            let line = smoothstep(0.012, 0.0, abs((uv.x + uv.y) - (0.72 + sin(uniforms.time * 0.18) * 0.25)));
            let glow = max(0.0, 0.38 - d) * 0.085 + line * 0.035;
            return vec4<f32>(1.0, 0.72, 0.32, glow);
          }
        `
      });

      const uniformBuffer = device.createBuffer({
        size: 16,
        usage:
          (globalThis as any).GPUBufferUsage.UNIFORM |
          (globalThis as any).GPUBufferUsage.COPY_DST
      });

      const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
          module: shader,
          entryPoint: "vs"
        },
        fragment: {
          module: shader,
          entryPoint: "fs",
          targets: [
            {
              format,
              blend: {
                color: {
                  srcFactor: "src-alpha",
                  dstFactor: "one",
                  operation: "add"
                },
                alpha: {
                  srcFactor: "zero",
                  dstFactor: "one",
                  operation: "add"
                }
              }
            }
          ]
        },
        primitive: {
          topology: "triangle-list"
        }
      });

      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: uniformBuffer
            }
          }
        ]
      });

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
        const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;

          context.configure({
            device,
            format,
            alphaMode: "premultiplied"
          });
        }
      };

      const render = (time: number) => {
        if (!active) return;

        resize();

        device.queue.writeBuffer(
          uniformBuffer,
          0,
          new Float32Array([time / 1000, canvas.width, canvas.height, 0])
        );

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
              loadOp: "clear",
              storeOp: "store"
            }
          ]
        });

        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);
        pass.end();

        device.queue.submit([encoder.finish()]);
        frame = requestAnimationFrame(render);
      };

      frame = requestAnimationFrame(render);
    };

    init().catch(() => undefined);

    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="webgpu-sheen" aria-hidden="true" />;
}

function CustomCursor() {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!cursor.current) return;
      cursor.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    };

    window.addEventListener("pointermove", move);

    return () => window.removeEventListener("pointermove", move);
  }, []);

  return <div ref={cursor} className="custom-cursor" />;
}
