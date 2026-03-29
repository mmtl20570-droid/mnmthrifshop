// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyD-VieCw1hcgMALCmptGVAAq4dtHAh2Gbw",
  authDomain: "mnm-shop-901c9.firebaseapp.com",
  projectId: "mnm-shop-901c9",
  storageBucket: "mnm-shop-901c9.firebasestorage.app",
  messagingSenderId: "549507929902",
  appId: "1:549507929902:web:85ae6b9f1214b26ddd4cbf",
  measurementId: "G-TR2V28BRCF"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get Product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

let currentItem = null;

async function fetchProduct() {
  if (!productId) {
    document.body.innerHTML = "<h2 style='text-align:center; padding-top:200px;'>Product Not Found</h2>";
    return;
  }

  try {
    const doc = await db.collection('products').doc(productId).get();
    if (!doc.exists) {
      document.getElementById('product-name').innerText = "Item no longer available";
      return;
    }

    currentItem = doc.data();



    document.getElementById('brand-name').innerText = currentItem.brand;
    document.getElementById('product-name').innerText = currentItem.name;
    document.getElementById('product-price').innerText = currentItem.status === 'sold' ? '[ SOLD ]' : (String(currentItem.price).toUpperCase().includes('TND') ? currentItem.price : currentItem.price + ' TND');

    // Display item size
    if (currentItem.size) {
      document.getElementById('product-size').innerText = `SIZE: ${currentItem.size}`;
      document.getElementById('product-size').style.display = 'block';
    } else {
      document.getElementById('product-size').style.display = 'none';
    }





    // Handle multiple images
    const gallery = document.getElementById('gallery-images');
    const placeholder = document.getElementById('image-placeholder');
    const counter = document.getElementById('image-counter');
    const nextArr = document.getElementById('next-arrow');
    const prevArr = document.getElementById('prev-arrow');
    gallery.innerHTML = '';

    const images = currentItem.imageUrls || [currentItem.imageUrl];

    if (images.length > 1) {
      counter.style.display = 'block';
      counter.innerText = `1 / ${images.length}`;
      nextArr.style.display = 'flex';
      prevArr.style.display = 'flex';
    } else {
      counter.style.display = 'none';
      nextArr.style.display = 'none';
      prevArr.style.display = 'none';
    }

    images.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.className = 'product-main-img';
      img.alt = currentItem.name;
      gallery.appendChild(img);
    });

    // Update counter on swipe
    gallery.addEventListener('scroll', () => {
      const index = Math.round(gallery.scrollLeft / gallery.clientWidth);
      counter.innerText = `${index + 1} / ${images.length}`;
    });

    placeholder.style.display = 'none';

    document.title = `${currentItem.name} - MNM Thriftshop`;

  } catch (err) {
    console.error("Error fetching product:", err);
  }
}

function scrollGallery(direction) {
  const gallery = document.getElementById('gallery-images');
  const scrollAmount = gallery.clientWidth;
  gallery.scrollBy({
    left: direction * scrollAmount,
    behavior: 'smooth'
  });
}

function getInquiryData() {
  const name = document.getElementById('cust-name').value || "[Name Not Provided]";
  const location = document.getElementById('cust-location').value || "[Location Not Selected]";
  const phone = document.getElementById('cust-phone').value || "[No Phone]";

  const priceFormatted = currentItem.status === 'sold' ? '[ SOLD ]' : (String(currentItem.price).toUpperCase().includes('TND') ? currentItem.price : currentItem.price + ' TND');
  const sizeText = currentItem.size ? `\nSIZE: ${currentItem.size}` : '';

  const text = `NEW PURCHASE INQUIRY\n-----------------------\nPRODUCT: ${currentItem.name}\nBRAND: ${currentItem.brand}\nPRICE: ${priceFormatted}${sizeText}\n\nCLIENT DETAILS:\n- Name: ${name}\n- City/Location: ${location}\n- Phone: ${phone}\n-----------------------`;

  return { text, name, location, phone, itemName: currentItem.name, brand: currentItem.brand, price: priceFormatted, itemSize: currentItem.size || '' };
}

function toggleForm() {
  const container = document.getElementById('inquiry-container');
  const btn = document.getElementById('btn-reveal-form');
  if (container.style.display === 'none') {
    container.style.display = 'block';
    btn.innerText = "CLOSE FORM";
    container.scrollIntoView({ behavior: 'smooth' });
  } else {
    container.style.display = 'none';
    btn.innerText = "DIRECT PURCHASE";
  }
}

function sendViaInstagram() {
  const data = getInquiryData();
  
  // Custom message for IG if form wasn't filled
  let igText = data.text;
  if (!document.getElementById('cust-name').value) {
    const priceFormatted = currentItem.status === 'sold' ? '[ SOLD ]' : (String(currentItem.price).toUpperCase().includes('TND') ? currentItem.price : currentItem.price + ' TND');
    const sizeText = currentItem.size ? `\nSIZE: ${currentItem.size}` : '';
    igText = `I'M INTERESTED IN THIS ITEM:\nPRODUCT: ${currentItem.name}\nBRAND: ${currentItem.brand}\nPRICE: ${priceFormatted}${sizeText}`;
  }

  // Copy to clipboard
  navigator.clipboard.writeText(igText).then(() => {
    showToast();
    setTimeout(() => {
      window.open('https://www.instagram.com/mnm_thriftshop/', '_blank');
    }, 1500);
  });
}

async function sendViaEmail() {
  const data = getInquiryData();
  const phoneError = document.getElementById('phone-error');
  
  // Phone number validation (must be 8 digits)
  const phoneDigits = data.phone.replace(/\D/g, ''); // Extract only digits
  if (phoneDigits.length !== 8) {
    phoneError.style.display = 'block';
    document.getElementById('cust-phone').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  } else {
    phoneError.style.display = 'none';
  }

  const btn = document.getElementById('btn-submit-email');
  const successMsg = document.getElementById('success-msg');
  const originalText = btn.innerText;

  // Use mailto as the default if you don't have a Web3Forms key yet
  const subject = `Purchase Inquiry: ${data.itemName}`;
  const mailtoLink = `mailto:mnmthriftshop@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(data.text)}`;

  // OPTIONAL: Using Web3Forms for REAL email notifications. 
  // Get a free key at https://web3forms.com/
  const WEB3_ACCESS_KEY = "d8926777-6490-448f-85c3-856f45e45cbd"; 

  // Ensure it sends correctly with your key
  if (WEB3_ACCESS_KEY && WEB3_ACCESS_KEY !== "YOUR_ACCESS_KEY_HERE") {
    btn.innerText = "SENDING...";
    btn.disabled = true;

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          access_key: WEB3_ACCESS_KEY,
          subject: subject,
          message: data.text,
          from_name: data.name,
          email: "no-reply@mnm-shop.com"
        })
      });

      if (response.ok) {
        btn.innerText = "SENT!";
        successMsg.style.display = 'block';
        successMsg.scrollIntoView({ behavior: 'smooth' });
      } else {
        throw new Error("API Failed");
      }
    } catch (err) {
      console.warn("API Error, falling back to mailto");
      window.location.href = mailtoLink;
      btn.innerText = originalText;
      btn.disabled = false;
    }
  } else {
    // If no key provided, just use the mailto link
    window.location.href = mailtoLink;
  }
}

function showToast() {
  const toast = document.getElementById('copy-toast');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function scrollNav(direction) {
  const nav = document.querySelector('nav');
  if (nav) {
    const scrollAmount = 150;
    nav.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  }
}

document.addEventListener('DOMContentLoaded', fetchProduct);
