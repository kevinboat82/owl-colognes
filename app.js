// ========== PRODUCT DATA ==========
const WHATSAPP_NUMBER = '233000000000'; // Replace with real number

const defaultProducts = [
  { id: 1, name: 'Midnight Noir', category: 'men', price: 185, desc: 'Dark, bold, and unapologetically masculine. Notes of black pepper, leather & oud.', color: '#1a1a2e', stock: 12, image: 'assets/images/products/cologne_bottle_1_1776992778207.png' },
  { id: 2, name: 'Rose Éternelle', category: 'women', price: 210, desc: 'A timeless floral symphony. Bulgarian rose, peony & musk.', color: '#2d1f2f', stock: 8, image: 'assets/images/products/perfume_bottle_2_1776992793413.png' },
  { id: 3, name: 'Arcanum', category: 'unisex', price: 165, desc: 'Mysterious and artisanal. Lavender, sandalwood & amber.', color: '#1f2a1f', stock: 15, image: 'assets/images/products/perfume_bottle_3_1776992806434.png' },
  { id: 4, name: 'Élégance Noir', category: 'men', price: 240, desc: 'Art Deco opulence in a bottle. Tobacco, vanilla & golden amber.', color: '#2a1f1a', stock: 5, image: 'assets/images/products/cologne_bottle_4_1776992821280.png' },
  { id: 5, name: 'Océane', category: 'women', price: 155, desc: 'Fresh aquatic breeze. Sea salt, bergamot & white cedar.', color: '#1a2233', stock: 20, image: 'assets/images/products/perfume_bottle_5_1776992834657.png' },
  { id: 6, name: 'Rouge Royal', category: 'women', price: 290, desc: 'Regal and passionate. Saffron, damask rose & oud wood.', color: '#2e1a1a', stock: 4, image: 'assets/images/products/perfume_bottle_6_1776992848285.png' },
  { id: 7, name: 'Aura Minerals', category: 'unisex', price: 130, desc: 'Clean, zen-like serenity. Green tea, white musk & cedarwood.', color: '#1e2421', stock: 18, image: 'assets/images/products/perfume_bottle_7_1776992863582.png' },
  { id: 8, name: 'Oud Maliki', category: 'men', price: 320, desc: 'Middle Eastern royalty. Aged oud, frankincense & saffron.', color: '#261e14', stock: 3, image: 'assets/images/products/perfume_bottle_8_1776992879842.png' },
];

let products = JSON.parse(localStorage.getItem('owlProducts') || JSON.stringify(defaultProducts));

// ========== STATE ==========
let wishlist = JSON.parse(localStorage.getItem('owlWishlist') || '[]');

// ========== DOM ==========
const productsGrid = document.getElementById('productsGrid');
const wishlistSidebar = document.getElementById('wishlistSidebar');
const wishlistItems = document.getElementById('wishlistItems');
const wishlistCount = document.getElementById('wishlistCount');
const wishlistEmpty = document.getElementById('wishlistEmpty');
const overlay = document.getElementById('overlay');

// ========== RENDER PRODUCTS ==========
function renderProducts(filter = 'all') {
  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
  productsGrid.innerHTML = filtered.map((p, i) => `
    <div class="product-card glass-panel" data-id="${p.id}" style="animation: fadeUp 0.6s ease forwards ${i * 0.1}s; opacity:0; --card-glow: ${p.color}44;">
      <div class="product-image-container" style="background: linear-gradient(145deg, ${p.color}, #0a0a0a);">
        ${p.image ? `
          <img src="${p.image}" alt="${p.name}" class="product-actual-img">
          <div class="shimmer-overlay"></div>
        ` : `
          <div class="product-img-placeholder" style="box-shadow: 0 0 30px ${p.color}88;"></div>
        `}
      </div>
      <h3 class="product-title">${p.name}</h3>
      <p class="product-desc">${p.desc}</p>
      <p class="product-price">$${p.price}</p>
      <div class="product-actions">
        <button class="btn-secondary order-btn" data-id="${p.id}">Order Now</button>
        <button class="btn-icon wishlist-toggle ${wishlist.includes(p.id) ? 'active' : ''}" data-id="${p.id}" aria-label="Add to wishlist">
          ${wishlist.includes(p.id) ? '♥' : '♡'}
        </button>
      </div>
    </div>
  `).join('');
}

// ========== WISHLIST ==========
function saveWishlist() {
  localStorage.setItem('owlWishlist', JSON.stringify(wishlist));
}

function updateWishlistUI() {
  const count = wishlist.length;
  wishlistCount.textContent = count;
  wishlistCount.style.display = count > 0 ? 'flex' : 'none';

  if (count === 0) {
    wishlistEmpty.style.display = 'block';
    wishlistItems.querySelectorAll('.wishlist-item').forEach(el => el.remove());
    return;
  }

  wishlistEmpty.style.display = 'none';
  const items = wishlist.map(id => products.find(p => p.id === id)).filter(Boolean);
  
  // Clear existing items
  wishlistItems.querySelectorAll('.wishlist-item').forEach(el => el.remove());
  
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'wishlist-item';
    div.innerHTML = `
      <div class="wishlist-item-img" style="background: linear-gradient(135deg, ${item.color}, #0a0a0a);"></div>
      <div class="wishlist-item-info">
        <div class="wishlist-item-title">${item.name}</div>
        <div class="wishlist-item-price">$${item.price}</div>
      </div>
      <button class="remove-item" data-id="${item.id}" aria-label="Remove">✕</button>
    `;
    wishlistItems.appendChild(div);
  });
}

function toggleWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
  } else {
    wishlist.push(id);
  }
  saveWishlist();
  updateWishlistUI();
  renderProducts(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
}

// ========== MODAL ==========
const productModal = document.getElementById('productModal');
const closeModal = document.getElementById('closeModal');

function openProductModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  document.getElementById('modalTitle').textContent = product.name;
  document.getElementById('modalCategory').textContent = product.category;
  document.getElementById('modalPrice').textContent = `$${product.price}`;
  document.getElementById('modalDescription').textContent = product.desc;
  
  const modalImgContainer = document.getElementById('modalImage');
  modalImgContainer.style.background = `linear-gradient(145deg, ${product.color}, #0a0a0a)`;
  modalImgContainer.style.boxShadow = `0 0 50px ${product.color}44`;
  
  if (product.image) {
    modalImgContainer.innerHTML = `<img src="${product.image}" alt="${product.name}" class="product-actual-img" style="max-height: 300px;">`;
  } else {
    modalImgContainer.innerHTML = `<div class="product-img-placeholder" style="box-shadow: 0 0 30px ${product.color}88;"></div>`;
  }
  
  const modalWishBtn = document.getElementById('modalWishlistBtn');
  modalWishBtn.textContent = wishlist.includes(product.id) ? '♥' : '♡';
  modalWishBtn.onclick = () => toggleWishlist(product.id);
  
  document.getElementById('modalOrderBtn').onclick = () => {
    const msg = `Hi Owl Colognes! I'd like to order *${product.name}* ($${product.price}). Please let me know the next steps.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  productModal.classList.add('active');
  overlay.classList.add('active');
}

closeModal.onclick = () => {
  productModal.classList.remove('active');
  overlay.classList.remove('active');
};

// ========== EVENTS ==========
// Product grid clicks
productsGrid.addEventListener('click', (e) => {
  const wishBtn = e.target.closest('.wishlist-toggle');
  if (wishBtn) {
    toggleWishlist(Number(wishBtn.dataset.id));
    return;
  }
  const orderBtn = e.target.closest('.order-btn');
  if (orderBtn) {
    const product = products.find(p => p.id === Number(orderBtn.dataset.id));
    if (product) {
      const msg = `Hi Owl Colognes! I'd like to order *${product.name}* ($${product.price}). Please let me know the next steps.`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    return;
  }
  
  // Open modal on card click (if not clicking buttons)
  const card = e.target.closest('.product-card');
  if (card) {
    openProductModal(Number(card.dataset.id));
  }
});

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(btn.dataset.filter);
  });
});

// Wishlist sidebar
document.getElementById('openWishlist').addEventListener('click', () => {
  wishlistSidebar.classList.add('open');
  overlay.classList.add('active');
});

document.getElementById('closeWishlist').addEventListener('click', () => {
  wishlistSidebar.classList.remove('open');
  overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
  wishlistSidebar.classList.remove('open');
  productModal.classList.remove('active');
  overlay.classList.remove('active');
});

// Remove items from wishlist
wishlistItems.addEventListener('click', (e) => {
  const rmBtn = e.target.closest('.remove-item');
  if (rmBtn) toggleWishlist(Number(rmBtn.dataset.id));
});

// Send wishlist via WhatsApp
document.getElementById('sendWishlistWA').addEventListener('click', (e) => {
  e.preventDefault();
  if (wishlist.length === 0) return;
  const items = wishlist.map(id => products.find(p => p.id === id)).filter(Boolean);
  const msg = `Hi Owl Colognes! Here's my wishlist:\n\n${items.map(i => `• ${i.name} – $${i.price}`).join('\n')}\n\nPlease let me know about availability!`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
});

// Request form
document.getElementById('requestForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('reqName').value;
  const perfume = document.getElementById('reqPerfume').value;
  const details = document.getElementById('reqDetails').value;
  const msg = `Hi Owl Colognes! My name is ${name}. I'd like to request a fragrance:\n\n*Perfume:* ${perfume}\n*Details:* ${details || 'None'}\n\nPlease let me know if you can source this!`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  e.target.reset();
});

// Nav scroll effect
window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 50);
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ========== PARTICLES ==========
const canvas = document.getElementById('heroParticles');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function createParticle() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speedY: -(Math.random() * 0.3 + 0.1),
    speedX: (Math.random() - 0.5) * 0.2,
    opacity: Math.random() * 0.5 + 0.1,
  };
}

for (let i = 0; i < 50; i++) particles.push(createParticle());

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p, i) => {
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.y < -10) {
      particles[i] = createParticle();
      particles[i].y = canvas.height + 10;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
    ctx.fill();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ========== INIT ==========
renderProducts();
updateWishlistUI();
