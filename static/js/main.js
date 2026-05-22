/* ══════════════════════════════════════════════════════════
   JAVASCRIPT — Galleta Titán
══════════════════════════════════════════════════════════ */

// ── Scroll reveal ───────────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


// ── Navbar scroll shadow ────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (window.scrollY > 40) {
    nav.style.boxShadow = '0 4px 24px rgba(4,46,123,0.4)';
  } else {
    nav.style.boxShadow = 'none';
  }
});


// ── Cotización ──────────────────────────────────────────────
const btnCalcular   = document.getElementById('btnCalcular');
const btnAgregar    = document.getElementById('btnAgregar');
const resultPanel   = document.getElementById('resultado-cotizacion');
let   lastQuote     = null;   // Guarda el resultado para el carrito

btnCalcular.addEventListener('click', async () => {
  const cantidad = parseInt(document.getElementById('inputCantidad').value);
  const sabor    = document.getElementById('selectSabor').value;

  btnCalcular.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Calculando...';
  btnCalcular.disabled  = true;

  try {
    const res  = await fetch('/cotizar', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ cantidad, sabor }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Error en la solicitud.');
      return;
    }

    // Mostrar resultado
    document.getElementById('res-cajas').textContent      = `${data.cajas} caja(s)`;
    document.getElementById('res-sueltas').textContent    = `${data.sueltas} u.`;
    document.getElementById('res-sub-cajas').textContent  = `$${data.subtotal_cajas.toFixed(2)} USD`;
    document.getElementById('res-sub-sueltas').textContent= `$${data.subtotal_sueltas.toFixed(2)} USD`;
    document.getElementById('res-total').textContent      = `$${data.total.toFixed(2)} USD`;
    document.getElementById('res-proteina').textContent   = `${data.proteina_total_g}g`;

    resultPanel.style.display = 'block';
    btnAgregar.style.display  = 'inline-block';
    lastQuote = data;

  } catch (err) {
    alert('Error de conexión. Intenta nuevamente.');
  } finally {
    btnCalcular.innerHTML = '<i class="bi bi-calculator me-2"></i>Calcular precio';
    btnCalcular.disabled  = false;
  }
});


// ── Agregar al carrito ──────────────────────────────────────
let cartItems = [];

btnAgregar.addEventListener('click', async () => {
  if (!lastQuote) return;

  try {
    await fetch('/carrito/agregar', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        cantidad: lastQuote.cantidad,
        sabor   : lastQuote.sabor,
        subtotal: lastQuote.total,
      }),
    });

    // Actualizar UI local
    cartItems.push({ ...lastQuote });
    updateCartUI();
    renderCartPanel();

    // Feedback visual
    btnAgregar.innerHTML = '<i class="bi bi-check2 me-2"></i>¡Agregado!';
    setTimeout(() => {
      btnAgregar.innerHTML = '<i class="bi bi-bag-plus me-2"></i>Agregar al carrito';
    }, 2000);

  } catch (err) {
    alert('Error al agregar al carrito.');
  }
});

function updateCartUI() {
  document.getElementById('cartCount').textContent = cartItems.length;
}

function renderCartPanel() {
  const body  = document.getElementById('cartBody');
  if (cartItems.length === 0) {
    body.innerHTML = '<p style="color:rgba(227,242,255,0.4);text-align:center;margin-top:2rem;">Carrito vacío.</p>';
    return;
  }

  let total = 0;
  let html  = '';

  cartItems.forEach((item, i) => {
    total += item.total;
    html  += `
      <div class="cart-item">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <p class="item-name mb-1">Galleta Titán</p>
            <p class="item-detail mb-0">${item.cantidad} u. · ${item.sabor}</p>
          </div>
          <span class="item-price">$${item.total.toFixed(2)}</span>
        </div>
      </div>`;
  });

  html += `
    <div class="cart-total-row mt-3">
      <span>TOTAL DEL PEDIDO</span>
      <span style="color:var(--ocean-300)">$${total.toFixed(2)} USD</span>
    </div>
    <button class="btn-titan-primary w-100 mt-4" style="text-align:center;">
      <i class="bi bi-whatsapp me-2"></i>Confirmar pedido
    </button>`;

  body.innerHTML = html;
}