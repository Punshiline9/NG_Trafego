// Formata data no formato português (ex: 15/08/2025)
function formatarData(data) {
  if (!data) return '';
  const d = new Date(data);
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Formata valor como moeda angolana (Kz)
function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2
  });
}

// Escapa HTML para evitar XSS
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Mostra um elemento por ID
function mostrar(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('oculto');
}

// Esconde um elemento por ID
function esconder(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('oculto');
}

// Alterna visibilidade
function toggle(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('oculto');
}

// Cria um elemento com classe e conteúdo opcional
function criarEl(tag, classe = '', texto = '') {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto) el.textContent = texto;
  return el;
}

// Temporizador simples (countdown em segundos)
function iniciarTimer(segundos, callbackTick, callbackFim) {
  let restante = segundos;
  const interval = setInterval(() => {
    if (restante <= 0) {
      clearInterval(interval);
      if (callbackFim) callbackFim();
      return;
    }
    if (callbackTick) callbackTick(restante);
    restante--;
  }, 1000);
  return interval;
}

// Valida email simples
function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Valida número de telefone (aceita dígitos, espaços, +, -)
function validarTelefone(tel) {
  const re = /^[+\d\s-]{7,15}$/;
  return re.test(tel);
}