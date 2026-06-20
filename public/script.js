const landing = document.getElementById('landing');
const formulario = document.getElementById('formulario');
const exito = document.getElementById('exito');
const btnParticipar = document.getElementById('btn-participar');
const btnVolver = document.getElementById('btn-volver');
const btnInicio = document.getElementById('btn-inicio');
const btnEnviar = document.getElementById('btn-enviar');
const form = document.getElementById('participacion-form');
const formError = document.getElementById('form-error');

const screens = [landing, formulario, exito];

function showScreen(screen) {
  screens.forEach((item) => item.classList.remove('screen--active'));
  screen.classList.add('screen--active');
}

function setError(message) {
  if (!message) {
    formError.hidden = true;
    formError.textContent = '';
    return;
  }
  formError.hidden = false;
  formError.textContent = message;
}

btnParticipar.addEventListener('click', () => {
  showScreen(formulario);
  document.getElementById('nombre').focus();
});

btnVolver.addEventListener('click', () => {
  setError('');
  showScreen(landing);
});

btnInicio.addEventListener('click', () => {
  form.reset();
  setError('');
  showScreen(landing);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const payload = {
    nombre: document.getElementById('nombre').value.trim(),
    direccion: document.getElementById('direccion').value.trim(),
    ciudad: document.getElementById('ciudad').value.trim(),
    celular: document.getElementById('celular').value.trim(),
  };

  btnEnviar.disabled = true;
  btnEnviar.textContent = 'Enviando...';
  setError('');

  try {
    const response = await apiFetch('/api/participantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo registrar la participación.');
    }

    window.open(data.whatsapp_url, '_blank');
    showScreen(exito);
  } catch (error) {
    setError(error.message);
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar';
  }
});
