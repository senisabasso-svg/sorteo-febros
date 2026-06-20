const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');
const totalParticipantes = document.getElementById('total-participantes');
const clientesList = document.getElementById('clientes-list');
const clientesEmpty = document.getElementById('clientes-empty');
const tabButtons = document.querySelectorAll('.tabs__btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const btnSortear = document.getElementById('btn-sortear');
const countdown = document.getElementById('countdown');
const countdownNumber = document.getElementById('countdown-number');
const ganador = document.getElementById('ganador');
const ganadorNombre = document.getElementById('ganador-nombre');
const ganadorDireccion = document.getElementById('ganador-direccion');
const ganadorCiudad = document.getElementById('ganador-ciudad');
const ganadorCelular = document.getElementById('ganador-celular');
const ganadorWhatsapp = document.getElementById('ganador-whatsapp');
const btnRepetirSorteo = document.getElementById('btn-repetir-sorteo');
const sorteoError = document.getElementById('sorteo-error');

function showLoginError(message) {
  loginError.hidden = !message;
  loginError.textContent = message || '';
}

function showSorteoError(message) {
  sorteoError.hidden = !message;
  sorteoError.textContent = message || '';
}

function setAuthenticated(isAuthenticated) {
  loginScreen.hidden = isAuthenticated;
  dashboard.hidden = !isAuthenticated;
  btnLogout.hidden = !isAuthenticated;
}

async function checkSession() {
  const token = sessionStorage.getItem('admin_token');
  if (!token) {
    setAuthenticated(false);
    return;
  }

  const response = await apiFetch('/api/admin/session');
  const data = await response.json();
  setAuthenticated(data.authenticated);

  if (data.authenticated) {
    await loadParticipantes();
    return;
  }

  sessionStorage.removeItem('admin_token');
}

async function loadParticipantes() {
  const response = await apiFetch('/api/participantes');
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem('admin_token');
      setAuthenticated(false);
    }
    return;
  }

  totalParticipantes.textContent = data.total;
  clientesList.innerHTML = '';

  if (data.participantes.length === 0) {
    clientesEmpty.hidden = false;
    return;
  }

  clientesEmpty.hidden = true;

  data.participantes.forEach((participante) => {
    const item = document.createElement('article');
    item.className = 'cliente-card';
    item.innerHTML = `
      <div class="cliente-card__info">
        <h3>${escapeHtml(participante.nombre)}</h3>
        <p><strong>Dirección:</strong> ${escapeHtml(participante.direccion)}</p>
        <p><strong>Ciudad:</strong> ${escapeHtml(participante.ciudad)}</p>
        <p><strong>Celular:</strong> ${escapeHtml(participante.celular)}</p>
        <p class="cliente-card__fecha">${formatDate(participante.created_at)}</p>
      </div>
      <a class="btn btn--whatsapp" href="${participante.whatsapp_url}" target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
    `;
    clientesList.appendChild(item);
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-UY');
}

function activateTab(tabName) {
  tabButtons.forEach((button) => {
    button.classList.toggle('tabs__btn--active', button.dataset.tab === tabName);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle('tab-panel--active', panel.id === `tab-${tabName}`);
  });
}

function resetSorteoView() {
  countdown.hidden = true;
  ganador.hidden = true;
  btnSortear.hidden = false;
  showSorteoError('');
}

function showWinner(data) {
  ganadorNombre.textContent = data.ganador.nombre;
  ganadorDireccion.textContent = data.ganador.direccion;
  ganadorCiudad.textContent = data.ganador.ciudad;
  ganadorCelular.textContent = data.ganador.celular;
  ganadorWhatsapp.href = data.ganador.whatsapp_ganador_url;
  ganador.hidden = false;
}

function runCountdown(onComplete) {
  let current = 3;
  countdown.hidden = false;
  countdownNumber.textContent = String(current);

  const interval = setInterval(() => {
    current -= 1;

    if (current > 0) {
      countdownNumber.textContent = String(current);
      return;
    }

    clearInterval(interval);
    countdown.hidden = true;
    onComplete();
  }, 1000);
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoginError('');

  const response = await apiFetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: document.getElementById('usuario').value.trim(),
      clave: document.getElementById('clave').value,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    showLoginError(data.error || 'No se pudo iniciar sesión.');
    return;
  }

  if (data.token) {
    sessionStorage.setItem('admin_token', data.token);
  }

  setAuthenticated(true);
  await loadParticipantes();
});

btnLogout.addEventListener('click', async () => {
  await apiFetch('/api/admin/logout', { method: 'POST' });
  sessionStorage.removeItem('admin_token');
  setAuthenticated(false);
  loginForm.reset();
});

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activateTab(button.dataset.tab);
    if (button.dataset.tab === 'sorteo') {
      resetSorteoView();
    }
  });
});

btnSortear.addEventListener('click', async () => {
  resetSorteoView();
  btnSortear.hidden = true;

  runCountdown(async () => {
    try {
      const response = await apiFetch('/api/sorteo', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo realizar el sorteo.');
      }

      showWinner(data);
    } catch (error) {
      showSorteoError(error.message);
      btnSortear.hidden = false;
    }
  });
});

btnRepetirSorteo.addEventListener('click', () => {
  resetSorteoView();
});

checkSession();
