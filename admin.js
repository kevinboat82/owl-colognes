import { db, storage } from './firebase-config.js';
import { 
  collection, onSnapshot, query, orderBy, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ========== DATA MANAGEMENT ==========
let products = [];

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
      <td>$${p.price}</td>
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
  window.location.href = 'index.html';
};

// Initial Render
initAdmin();
