import { db, storage } from './firebase-config.js';
import { 
  collection, onSnapshot, query, orderBy, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ========== DATA MANAGEMENT ==========
if (sessionStorage.getItem('owlAdminAuth') !== 'true') {
  window.location.href = 'index.html';
}

let products = [];
let settings = { globalDiscount: 0, discountEnabled: false, discountMessage: "" };
let heroSlides = [];

// ========== DOM ELEMENTS ==========
const productTableBody = document.getElementById('productTableBody');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const productFormModal = document.getElementById('productFormModal');
const productForm = document.getElementById('productForm');

// Stats
const statTotalProducts = document.getElementById('statTotalProducts');
const statLowStock = document.getElementById('statLowStock');

// ========== REAL-TIME FIRESTORE DATA ==========
function initAdmin() {
  // Products
  onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snapshot) => {
    products = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    renderProductsTable();
    renderInventoryTable();
    updateStats();
  });

  // Settings
  onSnapshot(collection(db, "settings"), (snapshot) => {
    if (!snapshot.empty) {
      settings = snapshot.docs[0].data();
      settings.docId = snapshot.docs[0].id;
      renderSettings();
    }
  });

  // Hero Slides
  onSnapshot(query(collection(db, "hero_slides"), orderBy("order", "asc")), (snapshot) => {
    heroSlides = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    renderHeroSlides();
  });
}

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
          <div style="width: 30px; height: 30px; background: ${p.color}; border-radius: 4px; overflow: hidden;">
            ${p.image ? `<img src="${p.image}" style="width:100%; height:100%; object-fit:cover;">` : ''}
          </div>
          ${p.name}
        </div>
      </td>
      <td><span style="text-transform: capitalize;">${p.category}</span></td>
      <td>GH₵${p.price}</td>
      <td>${p.stock}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editProduct('${p.docId}')">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteProduct('${p.docId}')">Delete</button>
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
          <button class="action-btn" onclick="updateStock('${p.docId}', 1)">+1</button>
          <button class="action-btn" onclick="updateStock('${p.docId}', -1)">-1</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateStats() {
  statTotalProducts.textContent = products.length;
  statLowStock.textContent = products.filter(p => p.stock <= 5).length;
}

function renderSettings() {
  document.getElementById('globalDiscount').value = settings.globalDiscount;
  document.getElementById('discountEnabled').checked = settings.discountEnabled;
  document.getElementById('discountMessage').value = settings.discountMessage;
}

function renderHeroSlides() {
  const grid = document.getElementById('heroSlidesGrid');
  grid.innerHTML = heroSlides.map(slide => `
    <div class="glass-panel" style="padding: 15px; position: relative;">
      <img src="${slide.image}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>Order: ${slide.order}</span>
        <button class="action-btn delete-btn" onclick="deleteHeroSlide('${slide.docId}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// ========== CRUD OPERATIONS ==========
window.editProduct = (docId) => {
  const p = products.find(x => x.docId === docId);
  if (!p) return;
  
  document.getElementById('editId').value = p.docId;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodCategory').value = p.category;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodStock').value = p.stock;
  document.getElementById('prodDesc').value = p.desc;
  document.getElementById('prodColor').value = p.color;
  
  // Note: Image input is file type, so we can't set value, but we can show preview if needed
  
  document.getElementById('modalTitle').textContent = 'Edit Product';
  productFormModal.classList.add('active');
};

window.deleteProduct = async (docId) => {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      await deleteDoc(doc(db, "products", docId));
    } catch (e) {
      alert("Error deleting product: " + e.message);
    }
  }
};

window.updateStock = async (docId, change) => {
  const p = products.find(x => x.docId === docId);
  if (p) {
    try {
      const newStock = Math.max(0, p.stock + change);
      await updateDoc(doc(db, "products", docId), { stock: newStock });
    } catch (e) {
      console.error("Error updating stock:", e);
    }
  }
};

window.deleteHeroSlide = async (docId) => {
  if (confirm('Delete this hero slide?')) {
    try {
      await deleteDoc(doc(db, "hero_slides", docId));
    } catch (e) {
      alert("Error: " + e.message);
    }
  }
};

// ========== IMAGE UPLOAD ==========
async function uploadImage(file) {
  if (!file) return null;
  const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

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

productForm.onsubmit = async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.textContent = 'Saving...';
  submitBtn.disabled = true;

  try {
    const docId = document.getElementById('editId').value;
    const imageFile = document.getElementById('prodImage').files[0];
    let imageUrl = null;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    } else if (docId) {
      // Keep existing image if not uploading a new one
      imageUrl = products.find(p => p.docId === docId)?.image;
    }

    const productData = {
      name: document.getElementById('prodName').value,
      category: document.getElementById('prodCategory').value,
      price: Number(document.getElementById('prodPrice').value),
      stock: Number(document.getElementById('prodStock').value),
      desc: document.getElementById('prodDesc').value,
      color: document.getElementById('prodColor').value || '#1a1a1a',
      image: imageUrl,
      updatedAt: serverTimestamp()
    };

    if (docId) {
      await updateDoc(doc(db, "products", docId), productData);
    } else {
      productData.createdAt = serverTimestamp();
      await addDoc(collection(db, "products"), productData);
    }

    productFormModal.classList.remove('active');
    productForm.reset();
  } catch (err) {
    alert("Error saving product: " + err.message);
  } finally {
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
  }
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
  sessionStorage.removeItem('owlAdminAuth');
  window.location.href = 'index.html';
};

// Settings Form
document.getElementById('settingsForm').onsubmit = async (e) => {
  e.preventDefault();
  const data = {
    globalDiscount: Number(document.getElementById('globalDiscount').value),
    discountEnabled: document.getElementById('discountEnabled').checked,
    discountMessage: document.getElementById('discountMessage').value,
    updatedAt: serverTimestamp()
  };

  try {
    if (settings.docId) {
      await updateDoc(doc(db, "settings", settings.docId), data);
    } else {
      await addDoc(collection(db, "settings"), data);
    }
    alert("Settings saved!");
  } catch (err) {
    alert("Error: " + err.message);
  }
};

// Hero Slide Management
document.getElementById('addHeroSlideBtn').onclick = () => {
  document.getElementById('heroSlideModal').classList.add('active');
};

document.getElementById('closeHeroModalBtn').onclick = () => {
  document.getElementById('heroSlideModal').classList.remove('active');
};

document.getElementById('heroSlideForm').onsubmit = async (e) => {
  e.preventDefault();
  const file = document.getElementById('heroSlideImage').files[0];
  const order = Number(document.getElementById('heroSlideOrder').value);
  const btn = e.target.querySelector('button[type="submit"]');
  
  if (!file) return;
  btn.textContent = "Uploading...";
  btn.disabled = true;

  try {
    const imageUrl = await uploadImage(file);
    await addDoc(collection(db, "hero_slides"), {
      image: imageUrl,
      order: order,
      createdAt: serverTimestamp()
    });
    document.getElementById('heroSlideModal').classList.remove('active');
    e.target.reset();
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    btn.textContent = "Upload Slide";
    btn.disabled = false;
  }
};

  document.getElementById('modalOrderBtn').onclick = () => {
    const msg = `Hi Owl Colognes! I'd like to order *${product.name}* (GH₵${product.price}). Please let me know the next steps.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

// Initial Render
initAdmin();
