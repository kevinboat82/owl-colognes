// ========== DATA MANAGEMENT ==========
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

function saveProducts() {
  localStorage.setItem('owlProducts', JSON.stringify(products));
  renderAll();
}

// ========== DOM ELEMENTS ==========
const productTableBody = document.getElementById('productTableBody');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const productFormModal = document.getElementById('productFormModal');
const productForm = document.getElementById('productForm');

// Stats
const statTotalProducts = document.getElementById('statTotalProducts');
const statLowStock = document.getElementById('statLowStock');

// ========== RENDER FUNCTIONS ==========
function renderAll() {
  renderProductsTable();
  renderInventoryTable();
  updateStats();
}

function renderProductsTable() {
  productTableBody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 30px; height: 30px; background: ${p.color}; border-radius: 4px;"></div>
          ${p.name}
        </div>
      </td>
      <td><span style="text-transform: capitalize;">${p.category}</span></td>
      <td>$${p.price}</td>
      <td>${p.stock}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editProduct(${p.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteProduct(${p.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderInventoryTable() {
  inventoryTableBody.innerHTML = products.map(p => {
    const status = p.stock <= 5 ? '<span style="color: #ff4d4d;">Low Stock</span>' : '<span style="color: #4dff4d;">In Stock</span>';
    return `
      <tr>
        <td>${p.name}</td>
        <td><strong>${p.stock}</strong></td>
        <td>${status}</td>
        <td>
          <button class="action-btn" onclick="updateStock(${p.id}, 1)">+1</button>
          <button class="action-btn" onclick="updateStock(${p.id}, -1)">-1</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateStats() {
  statTotalProducts.textContent = products.length;
  statLowStock.textContent = products.filter(p => p.stock <= 5).length;
}

// ========== CRUD OPERATIONS ==========
window.editProduct = (id) => {
  const p = products.find(x => x.id === id);
  if (!p) return;
  
  document.getElementById('editId').value = p.id;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodCategory').value = p.category;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodStock').value = p.stock;
  document.getElementById('prodImage').value = p.image || '';
  document.getElementById('prodDesc').value = p.desc;
  document.getElementById('prodColor').value = p.color;
  
  document.getElementById('modalTitle').textContent = 'Edit Product';
  productFormModal.classList.add('active');
};

window.deleteProduct = (id) => {
  if (confirm('Are you sure you want to delete this product?')) {
    products = products.filter(p => p.id !== id);
    saveProducts();
  }
};

window.updateStock = (id, change) => {
  const p = products.find(x => x.id === id);
  if (p) {
    p.stock = Math.max(0, p.stock + change);
    saveProducts();
  }
};

// ========== EVENT LISTENERS ==========
document.getElementById('addNewBtn').onclick = () => {
  productForm.reset();
  document.getElementById('editId').value = '';
  document.getElementById('modalTitle').textContent = 'Add New Product';
  productFormModal.classList.add('active');
};

document.getElementById('closeFormBtn').onclick = () => {
  productFormModal.classList.remove('active');
};

productForm.onsubmit = (e) => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const newProduct = {
    id: id ? Number(id) : Date.now(),
    name: document.getElementById('prodName').value,
    category: document.getElementById('prodCategory').value,
    price: Number(document.getElementById('prodPrice').value),
    stock: Number(document.getElementById('prodStock').value),
    image: document.getElementById('prodImage').value,
    desc: document.getElementById('prodDesc').value,
    color: document.getElementById('prodColor').value || '#1a1a1a'
  };

  if (id) {
    const index = products.findIndex(p => p.id === Number(id));
    products[index] = newProduct;
  } else {
    products.push(newProduct);
  }

  saveProducts();
  productFormModal.classList.remove('active');
};

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}Section`).classList.add('active');
  };
});

// Logout (Back to store)
document.getElementById('logoutBtn').onclick = () => {
  window.location.href = 'index.html';
};

// Initial Render
renderAll();
