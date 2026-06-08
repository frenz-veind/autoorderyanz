// ── NAVBAR SCROLL ────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 30);
});

// ── ORDER MODAL STATE ─────────────────────────────────────────
let currentProduct = {};
let pollingInterval = null;
let timerInterval  = null;

// ── OPEN MODAL ────────────────────────────────────────────────
function openOrderModal(btn) {
  currentProduct = {
    name:  btn.dataset.name,
    cat:   btn.dataset.cat,
    price: parseInt(btn.dataset.price),
    specs: btn.dataset.specs
  };

  document.getElementById('modalProductName').textContent = currentProduct.name;
  document.getElementById('modalPrice').textContent = 'Rp ' + currentProduct.price.toLocaleString('id-ID');

  showStep(1);
  document.getElementById('orderModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('orderModal').classList.remove('open');
  document.body.style.overflow = '';
  stopPolling();
  stopTimer();
  resetForm();
}

// click outside to close
document.getElementById('orderModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── PAY METHOD TOGGLE ─────────────────────────────────────────
document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('danaInfo').style.display =
      document.querySelector('input[name="payMethod"]:checked').value === 'DANA' ? 'block' : 'none';
  });
});

// ── SUBMIT ORDER ──────────────────────────────────────────────
async function submitOrder() {
  const name   = document.getElementById('fName').value.trim();
  const wa     = document.getElementById('fWa').value.trim();
  const email  = document.getElementById('fEmail').value.trim();
  const notes  = document.getElementById('fNotes').value.trim();
  const method = document.querySelector('input[name="payMethod"]:checked').value;

  if (!name || !wa) return showToast('⚠️ Nama dan WhatsApp wajib diisi!');

  const btn = document.getElementById('btnSubmitOrder');
  btn.disabled = true;
  btn.textContent = '⏳ Memproses...';

  try {
    const res = await fetch('/api/order/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName:     name,
        customerEmail:    email,
        customerWhatsapp: wa,
        productName:      currentProduct.name,
        productCategory:  currentProduct.cat,
        productPrice:     currentProduct.price,
        productSpecs:     currentProduct.specs,
        paymentMethod:    method,
        notes
      })
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Gagal membuat order');

    if (method === 'QRIS') {
      showQRIS(data);
    } else {
      // DANA — show success directly, user pays manually
      showSuccess(data.orderId);
    }

  } catch (err) {
    showToast('❌ ' + err.message);
    btn.disabled = false;
    btn.textContent = '⚡ Proses Order';
  }
}

// ── QRIS SCREEN ───────────────────────────────────────────────
function showQRIS(data) {
  showStep(2);

  document.getElementById('qrisAmount').textContent = 'Rp ' + data.totalAmount.toLocaleString('id-ID');
  document.getElementById('qrisOrderId').textContent = data.orderId;

  const img = document.getElementById('qrisImg');
  img.onload = () => { document.getElementById('qrisOverlay').style.display = 'none'; };
  img.onerror = () => {
    document.getElementById('qrisOverlay').innerHTML = '<div style="color:#fff;padding:20px;font-size:13px;">QR tidak tersedia.<br>Hubungi admin.</div>';
  };
  img.src = data.qrisImage || '';

  // Countdown 30 min
  let secs = 30 * 60;
  const expiredAt = data.expiredAt ? new Date(data.expiredAt) : null;
  if (expiredAt) {
    secs = Math.max(0, Math.floor((expiredAt - Date.now()) / 1000));
  }
  startTimer(secs);

  // Poll every 4 seconds
  pollingInterval = setInterval(() => checkPayment(data.orderId, data.depositId), 4000);
}

async function checkPayment(orderId, depositId) {
  try {
    const res = await fetch('/api/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, depositId })
    });
    const data = await res.json();

    if (data.status === 'paid') {
      stopPolling(); stopTimer();
      showSuccess(orderId);
    } else if (data.status === 'expired') {
      stopPolling(); stopTimer();
      document.getElementById('statusText').textContent = '⌛ QR kadaluarsa. Silakan order ulang.';
      document.getElementById('statusText').style.color = '#FCA5A5';
    }
  } catch (_) {}
}

// ── SUCCESS SCREEN ────────────────────────────────────────────
function showSuccess(orderId) {
  showStep(3);
  document.getElementById('successOrderId').textContent = orderId;

  const msg = encodeURIComponent(
    `Halo YANZKHENZ! Saya sudah bayar order:\n` +
    `🆔 Order ID: ${orderId}\n` +
    `📦 Produk: ${currentProduct.name}\n` +
    `💰 Harga: Rp ${currentProduct.price.toLocaleString('id-ID')}\n\n` +
    `Mohon segera diproses. Terima kasih!`
  );
  document.getElementById('btnSuccessWa').href = `https://wa.me/6283180082295?text=${msg}`;
  document.getElementById('btnSuccessTg').href = `https://t.me/yanzkhenz`;
}

// ── TIMER ─────────────────────────────────────────────────────
function startTimer(secs) {
  updateTimerDisplay(secs);
  timerInterval = setInterval(() => {
    secs--;
    if (secs <= 0) { stopTimer(); updateTimerDisplay(0); return; }
    updateTimerDisplay(secs);
  }, 1000);
}

function updateTimerDisplay(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  const el = document.getElementById('timerVal');
  if (el) el.textContent = `${m}:${s}`;
}

function stopTimer()   { clearInterval(timerInterval);  timerInterval  = null; }
function stopPolling() { clearInterval(pollingInterval); pollingInterval = null; }

// ── STEP SWITCHER ─────────────────────────────────────────────
function showStep(n) {
  [1,2,3].forEach(i => {
    document.getElementById('step'+i).style.display = (i === n) ? 'block' : 'none';
  });
}

function resetForm() {
  document.getElementById('fName').value  = '';
  document.getElementById('fWa').value    = '';
  document.getElementById('fEmail').value = '';
  document.getElementById('fNotes').value = '';
  document.querySelector('input[name="payMethod"][value="QRIS"]').checked = true;
  document.getElementById('danaInfo').style.display = 'none';
  const btn = document.getElementById('btnSubmitOrder');
  btn.disabled = false;
  btn.textContent = '⚡ Proses Order';
  showStep(1);
}

// ── COPY ──────────────────────────────────────────────────────
function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => showToast('✅ Nomor berhasil disalin!'))
    .catch(() => showToast('📋 ' + text));
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── MOBILE NAV ─────────────────────────────────────────────────
document.getElementById('hamburger')?.addEventListener('click', () => {
  const links = document.getElementById('navLinks');
  if (!links) return;
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  links.style.position = 'absolute';
  links.style.top = '68px';
  links.style.left = '0';
  links.style.right = '0';
  links.style.background = 'rgba(7,15,30,0.97)';
  links.style.flexDirection = 'column';
  links.style.padding = '16px 24px 24px';
  links.style.borderBottom = '1px solid rgba(30,111,255,0.2)';
  links.style.gap = '14px';
});
