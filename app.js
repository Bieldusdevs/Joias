const products = [
  {
    id: 1,
    name: 'Éternel Solitaire Ring',
    category: 'Ring / Signature',
    price: 12800,
    image: 'assets/ring.png',
    description: 'Diamante central VVS em lapidação brilhante, estrutura arquitetônica em ouro 18k e acabamento espelhado feito à mão.',
    materials: ['Ouro 18k', 'Diamante VVS', 'Platina sob encomenda']
  },
  {
    id: 2,
    name: 'Lumière Diamond Necklace',
    category: 'Necklace / High Jewelry',
    price: 18400,
    image: 'assets/necklace.png',
    description: 'Colar fluido em ouro com pontos de diamante posicionados para capturar luz em movimento, inspirado em alta-costura.',
    materials: ['Ouro amarelo', 'Ouro branco', 'Diamantes éticos']
  },
  {
    id: 3,
    name: 'Nocturne Earrings',
    category: 'Earrings / Evening',
    price: 9200,
    image: 'assets/earrings.png',
    description: 'Brincos esculturais com brilho controlado, desenhados para silhuetas noturnas, cerimônias e retratos editoriais.',
    materials: ['Diamante', 'Prata Palladium', 'Ouro rosé']
  },
  {
    id: 4,
    name: 'Aurum Line Bracelet',
    category: 'Bracelet / Icon',
    price: 7600,
    image: 'assets/bracelet.png',
    description: 'Pulseira flexível com módulos em ouro e diamantes cravados, criada para uso diário com presença discreta e definitiva.',
    materials: ['Ouro 18k', 'Diamante', 'Acabamento acetinado']
  }
];

const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const state = { cart: [], activeProduct: products[0], material: 'Ouro 18k' };

window.addEventListener('load', () => {
  setTimeout(() => qs('.loader')?.classList.add('is-hidden'), 950);
});

function renderProducts() {
  const container = qs('[data-products]');
  container.innerHTML = products.map((product, index) => `
    <article class="product-card reveal" data-tilt style="transition-delay:${index * 80}ms">
      <button class="product-card__image" data-open-product="${product.id}" aria-label="Abrir preview de ${product.name}">
        <img src="${product.image}" loading="lazy" decoding="async" alt="${product.name}">
      </button>
      <div class="product-card__body">
        <h3>${product.name}</h3>
        <div class="product-card__meta"><span>${product.category}</span><strong>${formatter.format(product.price)}</strong></div>
        <div class="product-card__actions">
          <button class="mini-btn" data-open-product="${product.id}">Preview</button>
          <button class="mini-btn" data-add-cart="${product.id}">Add to bag</button>
        </div>
      </div>
    </article>
  `).join('');
}

function setupReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  qsa('.reveal').forEach((el) => observer.observe(el));
}

function setupParallax() {
  let ticking = false;
  const move = () => {
    const y = window.scrollY;
    qsa('[data-parallax]').forEach((el) => {
      const speed = Number(el.dataset.parallax || 0);
      el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
    });
    qs('[data-header]')?.classList.toggle('is-scrolled', y > 40);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) requestAnimationFrame(move);
    ticking = true;
  }, { passive: true });
  move();
}

function setupCursor() {
  const cursor = qs('.cursor');
  if (!cursor || matchMedia('(max-width: 980px)').matches) return;
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  window.addEventListener('mousemove', (event) => { tx = event.clientX; ty = event.clientY; }, { passive: true });
  const loop = () => {
    x += (tx - x) * 0.18; y += (ty - y) * 0.18;
    cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener('mouseover', (event) => {
    if (event.target.closest('a, button, input, .product-card, dialog')) cursor.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (event) => {
    if (event.target.closest('a, button, input, .product-card, dialog')) cursor.classList.remove('is-hover');
  });
}

function setupTilt() {
  qsa('[data-tilt]').forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const target = card.matches('.macro-frame') ? qs('img', card) : card;
      target.style.transform = `perspective(900px) rotateX(${py * -4}deg) rotateY(${px * 5}deg) translateZ(0)`;
    });
    card.addEventListener('mouseleave', () => {
      const target = card.matches('.macro-frame') ? qs('img', card) : card;
      target.style.transform = '';
    });
  });
}

function openProduct(id) {
  const product = products.find((item) => item.id === Number(id));
  if (!product) return;
  state.activeProduct = product;
  qs('[data-modal-media]').innerHTML = `<img src="${product.image}" alt="${product.name}">`;
  qs('[data-modal-category]').textContent = product.category;
  qs('[data-modal-title]').textContent = product.name;
  qs('[data-modal-price]').textContent = formatter.format(product.price);
  qs('[data-modal-description]').textContent = product.description;
  qs('[data-modal-materials]').innerHTML = product.materials.map((material, index) => `<button class="${index === 0 ? 'active' : ''}" data-material="${material}">${material}</button>`).join('');
  qs('[data-product-modal]').showModal();
}

function addToCart(id = state.activeProduct.id) {
  const product = products.find((item) => item.id === Number(id));
  if (!product) return;
  const current = state.cart.find((item) => item.id === product.id);
  if (current) current.qty += 1;
  else state.cart.push({ ...product, qty: 1, material: state.material });
  renderCart();
  toast(`${product.name} adicionado ao carrinho`);
}

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  qs('[data-cart-count]').textContent = count;
  qs('[data-cart-total]').textContent = formatter.format(total);
  qs('[data-cart-items]').innerHTML = state.cart.length ? state.cart.map((item) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div><h3>${item.name}</h3><p>${item.material} · Qtd. ${item.qty}</p><p>${formatter.format(item.price)}</p></div>
      <button data-remove="${item.id}" aria-label="Remover ${item.name}">×</button>
    </div>
  `).join('') : '<p class="checkout-note">Sua seleção está vazia. Explore a coleção para adicionar joias ao carrinho.</p>';
}

function openCart() {
  qs('[data-cart]').classList.add('is-open');
  qs('[data-cart]').setAttribute('aria-hidden', 'false');
  qs('[data-scrim]').classList.add('is-open');
}
function closeCart() {
  qs('[data-cart]').classList.remove('is-open');
  qs('[data-cart]').setAttribute('aria-hidden', 'true');
  qs('[data-scrim]').classList.remove('is-open');
}
function toast(message) {
  const el = qs('[data-toast]');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('is-visible'), 2600);
}

function setupEvents() {
  document.addEventListener('click', (event) => {
    const openProductButton = event.target.closest('[data-open-product]');
    if (openProductButton) openProduct(openProductButton.dataset.openProduct);

    const addButton = event.target.closest('[data-add-cart]');
    if (addButton) addToCart(addButton.dataset.addCart);

    const removeButton = event.target.closest('[data-remove]');
    if (removeButton) {
      state.cart = state.cart.filter((item) => item.id !== Number(removeButton.dataset.remove));
      renderCart();
    }

    const materialButton = event.target.closest('[data-material]');
    if (materialButton) {
      qsa('[data-material]', materialButton.parentElement).forEach((button) => button.classList.remove('active'));
      materialButton.classList.add('active');
      state.material = materialButton.dataset.material;
    }
  });

  qs('[data-add-modal]').addEventListener('click', () => addToCart(state.activeProduct.id));
  qs('[data-buy-featured]').addEventListener('click', () => { addToCart(1); openCart(); });
  qs('[data-close-product]').addEventListener('click', () => qs('[data-product-modal]').close());
  qs('[data-open-cart]').addEventListener('click', openCart);
  qs('[data-close-cart]').addEventListener('click', closeCart);
  qs('[data-scrim]').addEventListener('click', closeCart);
  qs('[data-menu]').addEventListener('click', () => qs('[data-nav]').classList.toggle('is-open'));
  qsa('.nav a').forEach((link) => link.addEventListener('click', () => qs('[data-nav]').classList.remove('is-open')));
  qs('[data-open-search]').addEventListener('click', () => toast('Busca editorial pronta para integração com catálogo headless.'));

  qs('[data-checkout]').addEventListener('click', () => {
    if (!state.cart.length) return toast('Adicione uma joia antes de iniciar o checkout.');
    qs('[data-checkout-modal]').showModal();
  });
  qs('[data-close-checkout]').addEventListener('click', () => qs('[data-checkout-modal]').close());
  qs('[data-checkout-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    qs('[data-checkout-modal]').close();
    closeCart();
    state.cart = [];
    renderCart();
    toast('Pedido reservado. Nossa concierge entrará em contato.');
  });
  qs('[data-newsletter]').addEventListener('submit', (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    toast('Inscrição recebida. Bem-vindo à lista privada.');
  });
}

renderProducts();
setupReveal();
setupParallax();
setupCursor();
setupEvents();
renderCart();
requestAnimationFrame(setupTilt);
