"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import Lenis from "lenis";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { categories, products } from "@/lib/products";
import type { Category, Product } from "@/lib/products";
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
    pos.z += sin((position.x + position.y) * 2.0) * 0.015;
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
    vec2 slowUv = uv * 2.4 + vec2(uTime * 0.035, -uTime * 0.025);
    float n = noise(slowUv);

    float vignette = smoothstep(0.92, 0.22, distance(uv, vec2(0.5)));
    float mouseLight = smoothstep(0.48, 0.0, distance(uv, uMouse));

    vec3 blackGold = vec3(0.035, 0.028, 0.022);
    vec3 deepWine = vec3(0.085, 0.035, 0.05);
    vec3 gold = vec3(1.0, 0.68, 0.28);

    vec3 color = mix(blackGold, deepWine, uv.y + n * 0.2);
    color += gold * mouseLight * 0.16;
    color += gold * n * 0.035;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "todos">("todos");
  const [cart, setCart] = useState<CartLine[]>([]);
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
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("aurora-cart", JSON.stringify(cart));
  }, [cart, mounted]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      lerp: 0.08
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
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".reveal",
        { y: 28, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1,
          stagger: 0.08,
          ease: "power3.out"
        }
      );

      gsap.to(".orb-spin", {
        rotate: 360,
        duration: 36,
        repeat: -1,
        ease: "none"
      });
    });

    return () => ctx.revert();
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "todos") return products;
    return products.filter((product) => product.category === selectedCategory);
  }, [selectedCategory]);

  const cartLines = useMemo<CartViewLine[]>(
    () =>
      cart.flatMap((line) => {
        const product = products.find((p) => p.id === line.id);
        return product ? [{ ...line, product }] : [];
      }),
    [cart]
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
        throw new Error(data.error || "Erro ao criar checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Erro no checkout.");
      setCheckoutLoading(false);
    }
  };

  return (
    <main>
      <WebGLBackground />
      <WebGPUSheen />
      <CustomCursor />

      <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} />

      <section className="hero section-pad">
        <div className="hero-copy">
          <p className="eyebrow reveal">Joias banhadas a ouro 18k</p>
          <h1 className="reveal">Brilho elegante para uma loja premium.</h1>
          <p className="hero-text reveal">
            Site de vendas com categorias, carrinho funcional, checkout Stripe, fundo WebGL,
            transições GSAP, scroll Lenis, animações Framer Motion, shader GLSL e camada WebGPU sutil.
          </p>

          <div className="hero-actions reveal">
            <a className="button primary" href="#colecao">
              Ver coleção
            </a>
            <a className="button ghost" href="#pagamentos">
              Configurar pagamentos
            </a>
          </div>

          <div className="trust-row reveal">
            <span>Banho 18k</span>
            <span>Checkout seguro</span>
            <span>Pronto para Vercel</span>
          </div>
        </div>

        <div className="hero-visual reveal">
          <div className="orb orb-spin" />
          <div className="hero-card">
            <span className="mini-label">Coleção destaque</span>
            <ProductVideo product={products[0]} compact />
            <h3>{products[0].name}</h3>
            <p>{products[0].description}</p>
            <strong>{money.format(products[0].price / 100)}</strong>
          </div>
        </div>
      </section>

      <section className="marquee" aria-hidden="true">
        <div>
          <span>Colares</span>
          <span>Anéis</span>
          <span>Pingentes</span>
          <span>Pulseiras</span>
          <span>Brincos</span>
          <span>Banho de ouro 18k</span>
          <span>Colares</span>
          <span>Anéis</span>
          <span>Pingentes</span>
          <span>Pulseiras</span>
          <span>Brincos</span>
        </div>
      </section>

      <section id="colecao" className="section-pad collection">
        <div className="section-heading reveal">
          <p className="eyebrow">Coleção</p>
          <h2>Produtos em vídeo, sem screenshots estáticos.</h2>
          <p>
            Os cards usam arquivos MP4 em <code>public/videos</code>. Troque os vídeos demo pelos
            vídeos reais das suas joias quando quiser.
          </p>
        </div>

        <div className="category-row reveal">
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

      <section className="section-pad editorial">
        <div className="section-heading reveal">
          <p className="eyebrow">Experiência visual</p>
          <h2>Stack premium para vender com impacto.</h2>
        </div>

        <div className="feature-grid">
          <Feature title="Fundo WebGL discreto" text="React Three Fiber, Three.js e GLSL Shaders para luz e textura elegante." />
          <Feature title="Transições GSAP" text="Entrada suave, blur refinado e movimento de elementos hero." />
          <Feature title="Lenis + Framer Motion" text="Scroll fluido, filtros animados, carrinho com spring e cards interativos." />
          <Feature title="WebGPU com fallback" text="Camada luminosa experimental quando o navegador suporta WebGPU." />
        </div>
      </section>

      <section id="pagamentos" className="section-pad payments">
        <div className="payment-card reveal">
          <p className="eyebrow">Pagamentos</p>
          <h2>Backend Stripe Checkout já incluído.</h2>
          <p>
            O botão de finalizar compra chama <code>/api/checkout</code>, valida os produtos no servidor
            e cria uma sessão segura do Stripe Checkout. Esse backend roda como API Route do Next.js,
            pronto para Vercel.
          </p>

          <ol>
            <li>Crie uma conta em <strong>stripe.com</strong>.</li>
            <li>Copie sua chave secreta de teste em <strong>Developers → API keys</strong>.</li>
            <li>Crie <code>.env.local</code> com <code>STRIPE_SECRET_KEY</code>.</li>
            <li>Na Vercel, adicione a mesma variável em <strong>Project Settings → Environment Variables</strong>.</li>
            <li>Em produção, troque <code>sk_test</code> por <code>sk_live</code> e use seu domínio real.</li>
          </ol>
        </div>
      </section>

      <Footer />

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
  cartCount,
  onCartClick
}: {
  cartCount: number;
  onCartClick: () => void;
}) {
  const webgpu = useWebGPUSupport();

  return (
    <header className="site-header">
      <a className="brand" href="#" aria-label="Aurora Joias">
        <span>A</span>
        Aurora Joias
      </a>

      <nav>
        <a href="#colecao">Coleção</a>
        <a href="#pagamentos">Pagamentos</a>
      </nav>

      <div className="header-actions">
        <span className="webgpu-pill">{webgpu}</span>
        <button className="cart-button" onClick={onCartClick}>
          Carrinho
          <b>{cartCount}</b>
        </button>
      </div>
    </header>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <motion.article
      layout
      className="product-card reveal"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
    >
      <ProductVideo product={product} />

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
        Adicionar ao carrinho
      </button>
    </motion.article>
  );
}

function ProductVideo({
  product,
  compact = false
}: {
  product: Product;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={compact ? "video-box compact" : "video-box"}>
      {!failed ? (
        <video
          src={product.video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="video-fallback">
          <span>{product.name}</span>
          <small>Adicione o vídeo em {product.video}</small>
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
            aria-label="Fechar carrinho"
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
                <p className="eyebrow">Carrinho</p>
                <h2>Sua seleção</h2>
              </div>
              <button className="icon-button" onClick={onClose} aria-label="Fechar">
                ×
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="empty-cart">
                <p>O seu carrinho ainda está vazio.</p>
                <a className="button ghost" href="#colecao" onClick={onClose}>
                  Ver coleção
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
                  {loading ? "A abrir checkout..." : "Finalizar compra"}
                </button>

                {notice ? <p className="checkout-error">{notice}</p> : null}

                <p className="checkout-note">
                  Pagamento processado pelo Stripe Checkout. Em teste, use o cartão 4242 4242 4242 4242.
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
      className="feature reveal"
      whileHover={{ y: -5, borderColor: "rgba(238, 190, 113, 0.55)" }}
    >
      <span />
      <h3>{title}</h3>
      <p>{text}</p>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>Aurora Joias © 2026</p>
      <p>Loja demo pronta para GitHub, Vercel e Stripe.</p>
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
              0.72 + sin(uniforms.time * 0.16) * 0.12,
              0.24 + cos(uniforms.time * 0.11) * 0.10
            );
            let d = distance(uv, center);
            let glow = max(0.0, 0.42 - d) * 0.105;
            return vec4<f32>(1.0, 0.68, 0.26, glow);
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

function useWebGPUSupport() {
  const [label, setLabel] = useState("WebGPU verificando");

  useEffect(() => {
    const check = async () => {
      const gpu = (navigator as Navigator & { gpu?: any }).gpu;

      if (!gpu) {
        setLabel("WebGL fallback");
        return;
      }

      try {
        const adapter = await gpu.requestAdapter();
        setLabel(adapter ? "WebGPU ativo" : "WebGL fallback");
      } catch {
        setLabel("WebGL fallback");
      }
    };

    check();
  }, []);

  return label;
}
