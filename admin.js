import { db, storage } from './firebase-config.js';
import { 
  collection, onSnapshot, query, orderBy, 
  addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ========== SESSION GUARD ==========
if (!sessionStorage.getItem('owlAdminAuth')) {
  window.location.href = 'index.html';
}

// ========== DATA MANAGEMENT ==========
let products = [];

// ========== DOM ELEMENTS ==========
const productTableBody = document.getElementById('productTableBody');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const discountTableBody = document.getElementById('discountTableBody');
const productFormModal = document.getElementById('productFormModal');
const productForm = document.getElementById('productForm');

// Stats
const statTotalProducts = document.getElementById('statTotalProducts');
const statLowStock = document.getElementById('statLowStock');

// ========== REAL-TIME FIRESTORE DATA ==========
function initAdmin() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  
  onSnapshot(q, (snapshot) => {
    products = snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
    renderAll();
  });
}

// ========== RENDER FUNCTIONS ==========
function renderAll() {
  renderProductsTable();
  renderInventoryTable();
  renderDiscountsTable();
  updateStats();
}

function renderProductsTable() {
  productTableBody.innerHTML = products.map(p => {
    // Badge display logic
    let badgeHTML = '';
    const isNew = p.createdAt && p.createdAt.toDate && (Date.now() - p.createdAt.toDate().getTime()) < 14 * 24 * 60 * 60 * 1000;
    if (p.bestseller) {
      badgeHTML = '<span class="table-badge bestseller">★ Bestseller</span>';
    } else if (isNew) {
      badgeHTML = '<span class="table-badge new-arrival">New</span>';
    } else {
      badgeHTML = '<span style="color: var(--text-secondary); font-size: 0.8rem;">—</span>';
    }

    return `
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
      <td>${badgeHTML}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editProduct('${p.docId}')">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteProduct('${p.docId}')">Delete</button>
      </td>
    </tr>
  `;
  }).join('');
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

function renderDiscountsTable() {
  discountTableBody.innerHTML = products.map(p => {
    const discount = p.discount || 0;
    const final = discount > 0 ? (p.price * (1 - discount / 100)).toFixed(2) : p.price;
    return `
      <tr>
        <td>${p.name}</td>
        <td>GH₵${p.price}</td>
        <td>
          <input type="number" min="0" max="99" value="${discount}" 
            style="width: 70px; padding: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white; border-radius: 4px; text-align: center;"
            id="disc_${p.docId}">
        </td>
        <td style="color: ${discount > 0 ? '#4dff4d' : 'inherit'};">
          GH₵${final} ${discount > 0 ? `<span style="color: #ff4d4d; text-decoration: line-through; font-size: 0.8rem; margin-left: 5px;">GH₵${p.price}</span>` : ''}
        </td>
        <td>
          <button class="action-btn edit-btn" onclick="saveDiscount('${p.docId}')">Save</button>
          ${discount > 0 ? `<button class="action-btn delete-btn" onclick="clearDiscount('${p.docId}')">Clear</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
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
  document.getElementById('prodBestseller').checked = p.bestseller || false;
  updateBestsellerToggleVisual();
  
  document.getElementById('formModalTitle').textContent = 'Edit Product';
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
  document.getElementById('prodBestseller').checked = false;
  updateBestsellerToggleVisual();
  document.getElementById('formModalTitle').textContent = 'Add New Product';
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
      bestseller: document.getElementById('prodBestseller').checked,
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

// ========== DISCOUNT OPERATIONS ==========
window.saveDiscount = async (docId) => {
  const input = document.getElementById(`disc_${docId}`);
  const discount = Math.min(99, Math.max(0, Number(input.value)));
  try {
    await updateDoc(doc(db, "products", docId), { discount });
    input.style.borderColor = '#4dff4d';
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
  } catch (e) {
    alert("Error saving discount: " + e.message);
  }
};

window.clearDiscount = async (docId) => {
  try {
    await updateDoc(doc(db, "products", docId), { discount: 0 });
  } catch (e) {
    alert("Error clearing discount: " + e.message);
  }
};

// ========== SALE SETTINGS ==========
const saleSettingsRef = doc(db, "settings", "sale");

async function loadSaleSettings() {
  try {
    const snap = await getDoc(saleSettingsRef);
    if (snap.exists()) {
      const data = snap.data();
      document.getElementById('globalSaleToggle').checked = data.enabled || false;
      document.getElementById('saleBannerText').value = data.bannerText || '';
    }
  } catch (e) {
    console.error("Error loading sale settings:", e);
  }
}

document.getElementById('saveSaleSettings').onclick = async () => {
  const btn = document.getElementById('saveSaleSettings');
  btn.textContent = 'Saving...';
  try {
    await setDoc(saleSettingsRef, {
      enabled: document.getElementById('globalSaleToggle').checked,
      bannerText: document.getElementById('saleBannerText').value,
      updatedAt: serverTimestamp()
    });
    btn.textContent = '✓ Saved!';
    setTimeout(() => { btn.textContent = 'Save Sale Settings'; }, 2000);
  } catch (e) {
    alert("Error saving sale settings: " + e.message);
    btn.textContent = 'Save Sale Settings';
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

// Logout — clears session and goes back
document.getElementById('logoutBtn').onclick = () => {
  sessionStorage.removeItem('owlAdminAuth');
  window.location.href = 'index.html';
};

// ========== BESTSELLER TOGGLE VISUAL ==========
function updateBestsellerToggleVisual() {
  const label = document.getElementById('bestsellerToggleLabel');
  const checkbox = document.getElementById('prodBestseller');
  if (checkbox.checked) {
    label.classList.add('bestseller-active');
  } else {
    label.classList.remove('bestseller-active');
  }
}

document.getElementById('prodBestseller').addEventListener('change', updateBestsellerToggleVisual);

// Initial Render
initAdmin();
loadSaleSettings();

