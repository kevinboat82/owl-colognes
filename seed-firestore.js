import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

async function seedFirestore() {
  console.log("Starting migration to Firestore...");
  
  // 1. Seed Products
  const prodSnapshot = await getDocs(collection(db, "products"));
  if (prodSnapshot.empty) {
    console.log("Seeding products...");
    for (const p of defaultProducts) {
      await addDoc(collection(db, "products"), { ...p, createdAt: new Date() });
    }
  }

  // 2. Seed Settings
  const setSnapshot = await getDocs(collection(db, "settings"));
  if (setSnapshot.empty) {
    console.log("Seeding settings...");
    await addDoc(collection(db, "settings"), {
      globalDiscount: 15,
      discountEnabled: false,
      discountMessage: "SPECIAL OFFER: 15% OFF ALL LUXURY SCENTS"
    });
  }

  // 3. Seed Hero Slides
  const heroSnapshot = await getDocs(collection(db, "hero_slides"));
  if (heroSnapshot.empty) {
    console.log("Seeding hero slides...");
    const slides = [
      { image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80', order: 1 },
      { image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80', order: 2 },
      { image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80', order: 3 }
    ];
    for (const s of slides) {
      await addDoc(collection(db, "hero_slides"), s);
    }
  }
  console.log("Migration complete!");
}

seedFirestore();
