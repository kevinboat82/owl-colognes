import { db } from './firebase-config.js';
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ========== PRODUCT DATA ==========
const WHATSAPP_NUMBER = '233504005055'; // Replace with real number

let products = [];

// ========== STATE ==========
let wishlist = JSON.parse(localStorage.getItem('owlWishlist') || '[]');
let settings = { globalDiscount: 0, discountEnabled: false, discountMessage: "" };
let heroSlides = [];

// ========== DOM ==========
const productsGrid = document.getElementById('productsGrid');
const wishlistSidebar = document.getElementById('wishlistSidebar');
const wishlistItems = document.getElementById('wishlistItems');
const wishlistCount = document.getElementById('wishlistCount');
const wishlistEmpty = document.getElementById('wishlistEmpty');
const overlay = document.getElementById('overlay');

// ========== REAL-TIME FIRESTORE DATA ==========
function initStorefront() {
  // Products
  const qProducts = query(collection(db, "products"), orderBy("createdAt", "desc"));
  onSnapshot(qProducts, (snapshot) => {
    products = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    products = products.map(p => ({ ...p, id: p.id || p.docId }));
    renderProducts(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
    updateWishlistUI();
  });

  // Settings (Discounts)
  onSnapshot(collection(db, "settings"), (snapshot) => {
    if (!snapshot.empty) {
      settings = snapshot.docs[0].data();
      applySettings();
    }
  });

  // Hero Slides
  const qHero = query(collection(db, "hero_slides"), orderBy("order", "asc"));
  onSnapshot(qHero, (snapshot) => {
    heroSlides = snapshot.docs.map(doc => doc.data());
    initHeroSlideshow();
  });
}

function applySettings() {
  const banner = document.getElementById('discountBanner');
  const bannerMsg = document.getElementById('discountMsg');
  
  if (settings.discountEnabled) {
    banner.classList.add('active');
    bannerMsg.textContent = settings.discountMessage;
  } else {
    banner.classList.remove('active');
  }
  renderProducts(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
}

function initHeroSlideshow() {
  const container = document.getElementById('heroSlideshow');
  if (!heroSlides.length) return;
  
  container.innerHTML = heroSlides.map((slide, i) => `
    <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${slide.image}')"></div>
  `).join('');

  let current = 0;
  setInterval(() => {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 6000);
}

// ========== RENDER PRODUCTS ==========
function renderProducts(filter = 'all') {
  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
  productsGrid.innerHTML = filtered.map((p, i) => {
    const hasDiscount = settings.discountEnabled && settings.globalDiscount > 0;
    const finalPrice = hasDiscount ? Math.floor(p.price * (1 - settings.globalDiscount / 100)) : p.price;
    
    return `
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
        <div class="product-price">
          ${hasDiscount ? `<span class="original-price">GH₵${p.price}</span>` : ''}
          <span class="current-price">GH₵${finalPrice}</span>
        </div>
        <div class="product-actions">
          <button class="btn-secondary order-btn" data-id="${p.id}">Order Now</button>
          <button class="btn-icon wishlist-toggle ${wishlist.includes(p.id) ? 'active' : ''}" data-id="${p.id}" aria-label="Add to wishlist">
            ${wishlist.includes(p.id) ? '♥' : '♡'}
          </button>
        </div>
      </div>
    `;
  }).join('');
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
        <div class="wishlist-item-price">GH₵${item.price}</div>
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
  document.getElementById('modalPrice').textContent = `GH₵${product.price}`;
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
      const msg = `Hi Owl Colognes! I'd like to order *${product.name}* (GH₵${product.price}). Please let me know the next steps.`;
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
  const msg = `Hi Owl Colognes! Here's my wishlist:\n\n${items.map(i => `• ${i.name} – GH₵${i.price}`).join('\n')}\n\nPlease let me know about availability!`;
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

// ========== HIDDEN ADMIN ACCESS ==========
const ADMIN_PASSWORD = 'owl-admin-secret'; // Change this to your preferred password
let logoClickCount = 0;
let logoClickTimer;

function handleAdminAccess() {
  const pwd = prompt("Enter Admin Password:");
  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem('owlAdminAuth', 'true');
    window.location.href = 'admin.html';
  } else if (pwd !== null) {
    alert("Incorrect password.");
  }
}

// 1. Ctrl + Shift + A
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
    e.preventDefault();
    handleAdminAccess();
  }
});

// 2. Tap logo 5 times
const logoImg = document.querySelector('.logo img');
if (logoImg) {
  logoImg.style.cursor = 'pointer';
  logoImg.addEventListener('click', (e) => {
    e.preventDefault();
    logoClickCount++;
    clearTimeout(logoClickTimer);
    
    if (logoClickCount === 5) {
      logoClickCount = 0;
      handleAdminAccess();
    } else {
      logoClickTimer = setTimeout(() => {
        logoClickCount = 0;
      }, 2000); // Reset count if not clicked 5 times within 2s
    }
  });
}

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
initStorefront();
