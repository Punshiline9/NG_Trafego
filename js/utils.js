// =============================================
// 🔧 NG TRAFEGO - UTILITÁRIOS
// =============================================

function formatarData(data, mostrarHora = false) {
  if (!data) return '';
  const d = new Date(data);
  if (isNaN(d.getTime())) return '';
  const opcoes = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  if (mostrarHora) {
    opcoes.hour = '2-digit';
    opcoes.minute = '2-digit';
  }
  return d.toLocaleDateString('pt-PT', opcoes);
}

function formatarMoeda(valor, moeda = 'AOA') {
  const numero = Number(valor);
  if (isNaN(numero)) return '0,00 Kz';
  try {
    return numero.toLocaleString('pt-PT', {
      style: 'currency',
      currency: moeda,
      minimumFractionDigits: 2
    });
  } catch (e) {
    return numero.toFixed(2).replace('.', ',') + ' Kz';
  }
}

function escapeHTML(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

function mostrar(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('oculto');
}

function esconder(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('oculto');
}

function toggle(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('oculto');
}

function criarEl(tag, classe = '', texto = '') {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto) el.textContent = texto;
  return el;
}

function iniciarTimer(segundos, callbackTick, callbackFim) {
  let restante = segundos;
  if (callbackTick) callbackTick(restante);
  
  const interval = setInterval(() => {
    restante--;
    if (restante <= 0) {
      clearInterval(interval);
      if (callbackFim) callbackFim();
      return;
    }
    if (callbackTick) callbackTick(restante);
  }, 1000);
  return interval;
}

function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(String(email).trim());
}

function validarTelefone(tel) {
  const re = /^[+\d\s-]{7,15}$/;
  return re.test(String(tel).trim());
}

function validarURL(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  }
}

function gerarId(prefixo = 'id') {
  return prefixo + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

function toggleTema() {
  const atual = document.documentElement.getAttribute('data-theme') || 'dark';
  const novo = atual === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', novo);
  localStorage.setItem('ng_tema', novo);
  atualizarIconeTema(novo);
}

function atualizarIconeTema(tema) {
  const toggle = document.querySelector('.tema-toggle');
  if (!toggle) return;
  const icone = toggle.querySelector('.icone-tema');
  const texto = toggle.querySelector('.texto-tema');
  if (icone) icone.textContent = tema === 'dark' ? '☀️' : '🌙';
  if (texto) texto.textContent = tema === 'dark' ? 'Claro' : 'Escuro';
}

function inicializarTema() {
  const salvo = localStorage.getItem('ng_tema');
  const prefereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;
  const tema = salvo || (prefereClaro ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', tema);
  
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem('ng_tema')) {
      const novoTema = e.matches ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', novoTema);
      atualizarIconeTema(novoTema);
    }
  });
}

function criarToggleTema() {
  const existente = document.querySelector('.tema-toggle');
  if (existente) return;
  
  const tema = document.documentElement.getAttribute('data-theme') || 'dark';
  const btn = document.createElement('button');
  btn.className = 'tema-toggle';
  btn.innerHTML = `
    <span class="texto-tema">${tema === 'dark' ? 'Claro' : 'Escuro'}</span>
    <span class="icone-tema">${tema === 'dark' ? '☀️' : '🌙'}</span>
  `;
  btn.onclick = toggleTema;
  document.body.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarTema();
  criarToggleTema();
});