// ── SIDEBAR TOGGLE (MOBILE) ───────────────────────────────────
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── DELETE ORDER ──────────────────────────────────────────────
async function deleteOrder(id) {
  if (!confirm('Yakin hapus order ini?')) return;
  try {
    const res  = await fetch(`/admin/orders/delete/${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('✅ Order dihapus!');
      setTimeout(() => location.reload(), 800);
    } else {
      showToast('❌ Gagal hapus: ' + data.message);
    }
  } catch (err) {
    showToast('❌ Error: ' + err.message);
  }
}

// ── MARK PAID ─────────────────────────────────────────────────
async function markPaid(id) {
  if (!confirm('Tandai order ini sebagai PAID?')) return;
  try {
    const res  = await fetch(`/admin/orders/mark-paid/${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('✅ Order ditandai PAID!');
      setTimeout(() => location.reload(), 800);
    } else {
      showToast('❌ Gagal: ' + data.message);
    }
  } catch (err) {
    showToast('❌ Error: ' + err.message);
  }
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('adminToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'adminToast';
    t.style.cssText = `
      position:fixed;bottom:28px;right:28px;z-index:9999;
      background:rgba(14,31,60,0.95);backdrop-filter:blur(12px);
      border:1px solid rgba(30,111,255,0.3);color:#fff;
      padding:13px 22px;border-radius:12px;font-size:14px;font-weight:600;
      font-family:'Inter',sans-serif;
      transform:translateY(80px);opacity:0;transition:all 0.3s;
      box-shadow:0 10px 40px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  setTimeout(() => { t.style.transform='translateY(0)'; t.style.opacity='1'; }, 10);
  setTimeout(() => { t.style.transform='translateY(80px)'; t.style.opacity='0'; }, 2800);
}

// ── AUTO RELOAD DASHBOARD EVERY 30s ──────────────────────────
if (window.location.pathname === '/admin/dashboard') {
  setInterval(() => location.reload(), 30000);
}
