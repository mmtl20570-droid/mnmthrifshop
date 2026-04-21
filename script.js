const IMGBB_API_KEY = "f94afa0a5c6ec1467a570e79b1ca2f14";
// --- Firebase Configuration ---
// Replace these with your own Firebase Project settings
const firebaseConfig = {
  apiKey: "AIzaSyD-VieCw1hcgMALCmptGVAAq4dtHAh2Gbw",
  authDomain: "mnm-shop-901c9.firebaseapp.com",
  projectId: "mnm-shop-901c9",
  storageBucket: "mnm-shop-901c9.firebasestorage.app",
  messagingSenderId: "549507929902",
  appId: "1:549507929902:web:85ae6b9f1214b26ddd4cbf",
  measurementId: "G-TR2V28BRCF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();



// --- Animation Observer ---
const observerOptions = {
  threshold: 0.25, // Trigger when 25% of the element is visible
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  let delay = 0;
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // If multiple elements intersect at once, stagger them slightly
      setTimeout(() => {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }, delay);
      delay += 100; // Increment delay for the next element in this batch
    }
  });
}, observerOptions);


function highlightNav() {
  const currentCategory = window.CURRENT_PAGE_CATEGORY || 'index';
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === 'index.html' && currentCategory === 'index') {
      link.classList.add('active');
    } else if (href === `${currentCategory}.html`) {
      link.classList.add('active');
    }
  });
}

function initObservers() {
  highlightNav();
  // We observe every .reveal item individually.
  // This includes product-cards which now have individual reveal logic.
  document.querySelectorAll('.reveal').forEach(el => {
    if (!el.classList.contains('active')) {
      observer.observe(el);
    }
  });

  // Also observe any dynamic product cards that might be added later
  document.querySelectorAll('.product-card').forEach(el => {
    if (!el.classList.contains('active')) {
      observer.observe(el);
    }
  });
}

// --- Dynamic Rendering ---
async function loadItems() {
  const archiveGrid = document.querySelector('.product-grid');
  const featuredGrid = document.querySelector('.featured-grid');

  try {
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      initObservers();
      return;
    }

    // Clear dynamic targets
    if (archiveGrid) archiveGrid.innerHTML = '';
    if (featuredGrid) featuredGrid.innerHTML = '';

    let featuredCount = 0;
    let itemsShown = 0;

    snapshot.forEach(doc => {
      const item = doc.data();

      // Filtering Logic
      if (window.CURRENT_PAGE_CATEGORY) {
        if (window.CURRENT_PAGE_CATEGORY === 'latest' || window.CURRENT_PAGE_CATEGORY === 'index') {
          if (!item.isLatestDrop || itemsShown >= 10) return;
        } else if (window.CURRENT_PAGE_CATEGORY === 'collection') {
          // show all
        } else {
          if (item.category !== window.CURRENT_PAGE_CATEGORY) return;
        }
      }
      itemsShown++;

      const mainImg = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : (item.imageUrl || '');
      const hoverImg = (item.imageUrls && item.imageUrls.length > 1) ? item.imageUrls[1] : null;
      const hoverClass = hoverImg ? 'has-hover-img' : '';

      const cardHtml = `
      <div class="product-card reveal" style="position:relative;">
        <button class="admin-edit-btn" onclick="openEditMode('${doc.id}', event)">✎</button>
        <button class="admin-delete-btn" onclick="deleteItem('${doc.id}', event)">×</button>
        <a href="product.html?id=${doc.id}" style="text-decoration:none; color:inherit; display:flex; flex-direction:column;">
          <div class="product-img-container ${hoverClass}" style="background: #151515; aspect-ratio: 4/5; border-radius: 8px; overflow: hidden; position: relative;">
            <img class="product-img primary-img" src="${mainImg}" alt="${item.name}" 
                 onerror="this.style.display='none'; this.parentElement.querySelector('.img-error').style.display='flex';"
                 style="width: 100%; height: 100%; object-fit: cover; display: block;">
            ${hoverImg ? `<img class="product-img hover-img" src="${hoverImg}" alt="${item.name} back" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; opacity: 0; pointer-events: none;">` : ''}
            <div class="img-error" style="display: none; position: absolute; inset: 0; align-items: center; justify-content: center; color: #444; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em;">Image Not Found</div>
          </div>
          <div class="product-info" style="padding: 1rem 0;">
            <div class="product-name" style="font-family: 'Outfit', sans-serif; font-size: 0.7rem; font-weight: 600; line-height: 1.1; margin-bottom: 0.1rem;">${item.name}</div>
            <div class="product-meta" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.6rem; letter-spacing: 0.05em; text-transform: uppercase;">
              <span class="product-brand" style="color: var(--gray);">${item.brand}</span>
              <span class="product-status ${item.status === 'sold' ? 'status-sold' : ''}" style="color: ${item.status === 'sold' ? 'var(--accent)' : 'var(--off-white)'}">${item.status === 'sold' ? '[ SOLD ]' : (String(item.price).toUpperCase().includes('TND') ? item.price : item.price + ' TND')}</span>
            </div>


          </div>
        </a>
      </div>
    `;

      // Add to main Archive
      archiveGrid.insertAdjacentHTML('beforeend', cardHtml);

      // Add to Featured if flagged (max 18 for layout consistency)
      if (item.isFeatured && featuredCount < 18 && featuredGrid) {
        const featItem = document.createElement('div');
        featItem.className = 'featured-item-grid';
        featItem.innerHTML = `
            <a href="product.html?id=${doc.id}" style="display:block; height:100%; width:100%;">
                <div class="featured-img-container">
                    <img src="${mainImg}" alt="${item.name}">
                    <div class="featured-overlay">
                        <div class="featured-item-info">
                            <p class="brand">${item.brand}</p>
                            <p class="name">${item.name}</p>
                            <p class="price">${item.status === 'sold' ? 'SOLD' : (String(item.price).toUpperCase().includes('TND') ? item.price : item.price + ' TND')}</p>


                        </div>
                    </div>
                </div>
            </a>
        `;
        featuredGrid.appendChild(featItem);
        featuredCount++;
      }
    });

    initObservers();
    updateAdminView(); // Ensure buttons show if already logged in
  } catch (err) {
    console.log("Firebase error:", err);
    initObservers();
  }
}

// --- Admin Logic ---
function toggleAdminPanel() {
  const panel = document.getElementById('admin-panel');
  panel.classList.toggle('visible');
}

function openNewPost() {
  resetAdminForm();
  toggleAdminPanel();
}

document.getElementById('admin-login-btn').addEventListener('click', openNewPost);

function updateAdminView() {
  const isAdmin = (document.getElementById('auth-section').style.display === 'none');
  document.querySelectorAll('.admin-delete-btn, .admin-edit-btn').forEach(btn => {
    btn.style.display = isAdmin ? 'flex' : 'none';
  });
}

async function loginAdmin() {
  let email = document.getElementById('admin-email').value.trim();
  const pass = document.getElementById('admin-pass').value;

  if (!email) {
    alert("Please enter your staff ID or email.");
    return;
  }

  // Support shorthand: if no '@' is present, assume it's '@admin.com'
  // (adjust this domain based on your Firebase setup)
  if (!email.includes('@')) {
    email += "@admin.com";
  }

  try {
    await auth.signInWithEmailAndPassword(email, pass);
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('add-item-section').style.display = 'block';
    updateAdminView();
  } catch (err) {
    if (err.code === 'auth/invalid-email') {
      alert("Invalid format. Please use 'admin' or your full staff email.");
    } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      alert("Access Denied: Incorrect staff ID or password.");
    } else {
      alert("Login failed: " + err.message);
    }
  }
}

async function logoutAdmin() {
  if (confirm("Log out and hide admin controls?")) {
    await auth.signOut();
    alert("Logged out. You are now in 'Customer View'.");
    toggleAdminPanel(); // Close the panel
  }
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('add-item-section').style.display = 'block';
    updateAdminView();
  } else {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('add-item-section').style.display = 'none';
    updateAdminView();
  }
});

function previewImages() {
  const container = document.getElementById('image-preview-container');
  container.innerHTML = '';
  const files = document.getElementById('item-img').files;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'preview-thumb';
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

let activeEditId = null;

async function openEditMode(id, event) {
  if (event) event.stopPropagation();
  try {
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) return;
    const data = doc.data();

    // Populate form
    document.getElementById('item-name').value = data.name;
    document.getElementById('item-brand').value = data.brand;
    document.getElementById('item-price').value = data.price;
    document.getElementById('item-status').value = data.status;
    document.getElementById('item-category').value = data.category || '';
    document.getElementById('item-featured').checked = data.isFeatured || false;
    document.getElementById('item-latest').checked = data.isLatestDrop || false;
    document.getElementById('item-url').value = (data.imageUrls || [data.imageUrl]).join(',');

    activeEditId = id;

    // Change UI state
    document.getElementById('imgbb-upload-btn').innerHTML = "UPDATE ARCHIVE ENTRY";
    document.getElementById('imgbb-upload-btn').style.background = "#44aaff";

    // Scroll to panel
    toggleAdminPanel();
    document.getElementById('admin-panel').scrollTop = 0;

    document.getElementById('status-msg').innerText = `Editing: ${data.name}`;

  } catch (err) {
    alert("Error loading item for edit: " + err.message);
  }
}

function resetAdminForm() {
  document.getElementById('item-name').value = '';
  document.getElementById('item-brand').value = '';
  document.getElementById('item-price').value = '';
  document.getElementById('item-status').value = 'available';
  document.getElementById('item-category').value = '';
  document.getElementById('item-featured').checked = false;
  document.getElementById('item-latest').checked = false;
  document.getElementById('item-url').value = '';
  document.getElementById('image-preview-container').innerHTML = '';
  document.getElementById('status-msg').innerText = '';

  activeEditId = null;
  document.getElementById('imgbb-upload-btn').innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 8px; vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
    UPLOAD & REVEAL (FIREBASE)
`;
  document.getElementById('imgbb-upload-btn').style.background = "var(--accent)";
}

async function deleteItem(id, event) {
  event.stopPropagation();
  if (!confirm("Are you sure you want to delete this piece from the archive?")) return;

  try {
    await db.collection('products').doc(id).delete();
    loadItems(); // Refresh grid
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

async function uploadAndActivate() {
  const files = document.getElementById('item-img').files;
  const msg = document.getElementById('status-msg');

  // If no new files and we are editing, just save the form data
  if ((!files || files.length === 0) && activeEditId) {
    await addNewItem();
    return;
  }

  // If no files and no URL, tell the user to provide something
  if ((!files || files.length === 0) && !document.getElementById('item-url').value) {
    alert("Please select at least one photo or provide a link.");
    return;
  }

  // If there are no files but there is a URL, just save
  if (!files || files.length === 0) {
    await addNewItem();
    return;
  }

  try {
    const imageUrls = [];
    const total = files.length;
    msg.classList.add('status-active');

    for (let i = 0; i < total; i++) {
      const file = files[i];
      msg.innerText = `Uploading image ${i + 1} of ${total} to ImgBB...`;

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        imageUrls.push(result.data.url);
      } else {
        throw new Error(result.error.message || "ImgBB Upload Failed");
      }
    }

    msg.innerText = "All images uploaded! Syncing database...";
    msg.classList.remove('status-active');

    // Store URLs as a comma-separated list for the manual field
    document.getElementById('item-url').value = imageUrls.join(',');
    await addNewItem();

  } catch (err) {
    msg.innerText = "Upload Error: " + err.message;
    console.error(err);
    alert("Failed to upload: " + err.message);
  }
}

async function addNewItem() {
  const name = document.getElementById('item-name').value;
  const brand = document.getElementById('item-brand').value;
  const price = document.getElementById('item-price').value;
  const status = document.getElementById('item-status').value;
  const category = document.getElementById('item-category').value;
  const urlInput = document.getElementById('item-url').value;
  const isFeatured = document.getElementById('item-featured').checked;
  const isLatestDrop = document.getElementById('item-latest').checked;
  const file = document.getElementById('item-img').files[0];
  const msg = document.getElementById('status-msg');

  if (!name) {
    alert("Please enter a name for the piece");
    return;
  }

  try {
    msg.innerText = "Processing archive entry...";
    let imageUrls = [];

    if (urlInput) {
      imageUrls = urlInput.split(',').map(u => u.trim()).filter(u => u !== "");
    } else {
      alert("Missing Media: Please upload at least one photo first.");
      msg.innerText = "";
      return;
    }

    // 2. Save to Firestore
    msg.innerText = "Syncing with archive database...";
    const payload = {
      name, brand, price, status, category,
      imageUrls: imageUrls,
      imageUrl: imageUrls[0], // Keep for backward compatibility
      isFeatured,
      isLatestDrop,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // FIFO Logic for Latest Drop
    if (isLatestDrop) {
      const latestSnapshot = await db.collection('products')
        .where('isLatestDrop', '==', true)
        .orderBy('createdAt', 'asc')
        .get();

      // If we're editing an existing item that is ALREADY latest drop, don't count it towards the displacement
      let currentLatestCount = latestSnapshot.size;
      const editingLatestItem = activeEditId && latestSnapshot.docs.some(doc => doc.id === activeEditId);

      if (!editingLatestItem && currentLatestCount >= 10) {
        // Remove oldest
        const oldestDoc = latestSnapshot.docs[0];
        await db.collection('products').doc(oldestDoc.id).update({
          isLatestDrop: false
        });
      }
    }

    if (activeEditId) {
      await db.collection('products').doc(activeEditId).update(payload);
      msg.innerText = "Updated successfully!";
    } else {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('products').add(payload);
      msg.innerText = "Uploaded successfully!";
    }

    await loadItems();
    resetAdminForm();

    setTimeout(() => {
      toggleAdminPanel();
      document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    }, 1000);
  } catch (err) {
    console.error("Firestore Error:", err);
    if (err.code === 'permission-denied') {
      msg.innerText = "Error: Check Firestore Rules (Permissions)";
    } else if (err.message.includes("database")) {
      msg.innerText = "Error: Database not initialized in console.";
    } else {
      msg.innerText = "Database Error: " + err.message;
    }
  }
}

function updateAdminView() {
  const isAdmin = auth.currentUser !== null;
  const btns = document.querySelectorAll('.admin-edit-btn, .admin-delete-btn');
  btns.forEach(btn => {
    btn.style.display = isAdmin ? 'flex' : 'none';
  });
}

// Final Init
document.addEventListener('DOMContentLoaded', () => {
  loadItems();
});

function scrollNav(direction) {
  const nav = document.querySelector('nav');
  if (nav) {
    const scrollAmount = 150;
    nav.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  }
}
