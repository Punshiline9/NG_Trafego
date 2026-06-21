// =============================================
// 🔧 NG TAREFAS - UTILITÁRIOS (VERSÃO REFORÇADA)
// =============================================

// ====== FORMATAÇÃO ======
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

function formatarDataRelativa(data) {
  if (!data) return '';
  const agora = Date.now();
  const d = new Date(data).getTime();
  if (isNaN(d)) return '';
  const diff = agora - d;
  const seg = Math.floor(diff / 1000);
  if (seg < 60) return 'agora mesmo';
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `há ${dias} dia(s)`;
  return formatarData(data);
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

function formatarTamanhoFicheiro(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

// ====== DOM HELPERS ======
function $(seletor, contexto = document) {
  return contexto.querySelector(seletor);
}
function $$(seletor, contexto = document) {
  return Array.from(contexto.querySelectorAll(seletor));
}
function mostrar(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (el) el.classList.remove('oculto');
}
function esconder(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (el) el.classList.add('oculto');
}
function toggle(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (el) el.classList.toggle('oculto');
}
function criarEl(tag, classe = '', texto = '') {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto) el.textContent = texto;
  return el;
}

// ====== TIMER ======
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

// ====== VALIDAÇÕES ======
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
function validarForcaSenha(senha) {
  const resultado = { score: 0, feedback: '' };
  if (!senha || senha.length < 6) {
    resultado.feedback = 'Mínimo 6 caracteres';
    return resultado;
  }
  let score = 0;
  if (senha.length >= 8) score++;
  if (senha.length >= 12) score++;
  if (/[A-Z]/.test(senha)) score++;
  if (/[0-9]/.test(senha)) score++;
  if (/[^A-Za-z0-9]/.test(senha)) score++;
  resultado.score = score;
  if (score <= 1) resultado.feedback = 'Fraca';
  else if (score <= 3) resultado.feedback = 'Média';
  else resultado.feedback = 'Forte';
  return resultado;
}

// ====== DEBOUNCE / THROTTLE ======
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
function throttle(fn, limit = 300) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ====== COPIAR TEXTO ======
async function copiarTexto(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (e) {}
  }
  // fallback clássico
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

// ====== GERAR ID ======
function gerarId(prefixo = 'id') {
  return prefixo + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

// ====== SANITIZAÇÃO ======
function sanitizarNome(texto) {
  return String(texto || '')
    .replace(/[^a-zA-Z0-9áéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ\s\-_]/g, '')
    .trim();
}

// =============================================
// 🎨 NOVAS FUNÇÕES DE TEMA (COM 5 OPÇÕES)
// =============================================
const TEMAS_DISPONIVEIS = ['dark', 'light', 'azul-marinho', 'vermelho', 'azul-normal'];
const ICONES_TEMA = {
  'dark': '🌙',
  'light': '☀️',
  'azul-marinho': '🌊',
  'vermelho': '🔥',
  'azul-normal': '💙'
};
const NOMES_TEMA = {
  'dark': 'Escuro',
  'light': 'Claro',
  'azul-marinho': 'Marinho',
  'vermelho': 'Vermelho',
  'azul-normal': 'Azul'
};

function aplicarTema(tema) {
  if (!TEMAS_DISPONIVEIS.includes(tema)) tema = 'dark';
  document.documentElement.setAttribute('data-theme', tema);
  localStorage.setItem('ng_tema', tema);
  atualizarIconeTema(tema);
  document.querySelectorAll('.opcao-tema').forEach(el => {
    el.classList.toggle('ativo', el.dataset.tema === tema);
  });
}

function toggleTema() {
  const atual = document.documentElement.getAttribute('data-theme') || 'dark';
  let index = TEMAS_DISPONIVEIS.indexOf(atual);
  index = (index + 1) % TEMAS_DISPONIVEIS.length;
  aplicarTema(TEMAS_DISPONIVEIS[index]);
}

function atualizarIconeTema(tema) {
  const toggle = document.querySelector('.tema-toggle');
  if (!toggle) return;
  const icone = toggle.querySelector('.icone-tema');
  const texto = toggle.querySelector('.texto-tema');
  if (icone) icone.textContent = ICONES_TEMA[tema] || '🌙';
  if (texto) texto.textContent = NOMES_TEMA[tema] || 'Tema';
}

function inicializarTema() {
  const salvo = localStorage.getItem('ng_tema');
  const prefereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;
  let tema = salvo || (prefereClaro ? 'light' : 'dark');
  if (!TEMAS_DISPONIVEIS.includes(tema)) tema = 'dark';
  aplicarTema(tema);
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem('ng_tema')) {
      aplicarTema(e.matches ? 'light' : 'dark');
    }
  });
}

function criarToggleTema() {
  if (document.querySelector('.tema-toggle')) return;
  const tema = document.documentElement.getAttribute('data-theme') || 'dark';
  const btn = document.createElement('button');
  btn.className = 'tema-toggle';
  btn.innerHTML = `
    <span class="texto-tema">${NOMES_TEMA[tema]}</span>
    <span class="icone-tema">${ICONES_TEMA[tema]}</span>
  `;
  btn.onclick = toggleTema;
  document.body.appendChild(btn);
}

// =============================================
// 😀 EMOJIS ALEATÓRIOS
// =============================================
const LISTA_EMOJIS = [
  '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎨', '👩‍🎨', '🧑‍🎨',
  '👨‍🏫', '👩‍🏫', '🧑‍🏫', '👨‍🔬', '👩‍🔬', '🧑‍🔬',
  '👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '👨‍🍳', '👩‍🍳', '🧑‍🍳',
  '👨‍🚀', '👩‍🚀', '🧑‍🚀', '👨‍🚒', '👩‍🚒', '🧑‍🚒',
  '👨‍🎤', '👩‍🎤', '🧑‍🎤', '👨‍💼', '👩‍💼', '🧑‍💼',
  '🦊', '🐼', '🐨', '🦁', '🐯', '🐱', '🐶', '🐺',
  '🦄', '🐉', '🦋', '🌟', '⭐', '🌙', '☀️', '🔥',
  '💎', '🎯', '🎮', '🎨', '🎭', '🎪', '🎢', '🎠'
];

function gerarEmojiAleatorio() {
  return LISTA_EMOJIS[Math.floor(Math.random() * LISTA_EMOJIS.length)];
}

function gerarEmojisParaLista(quantidade) {
  return Array.from({ length: quantidade }, () => gerarEmojiAleatorio());
}

// =============================================
// 🔔 SISTEMA DE TOASTS
// =============================================
function mostrarToast(mensagem, tipo = 'sucesso', duracao = 3500) {
  const container = document.querySelector('.toast-container') || criarToastContainer();
  if (container.children.length >= 5) {
    container.firstChild?.remove();
  }
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  const icones = {
    sucesso: '✅',
    erro: '❌',
    aviso: '⚠️',
    info: 'ℹ️'
  };
  toast.innerHTML = `<span>${icones[tipo] || '📢'}</span> ${mensagem}`;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, duracao);
}

function criarToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// =============================================
// 🚀 INICIALIZAÇÃO AUTOMÁTICA
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  inicializarTema();
  criarToggleTema();
  if (!document.querySelector('.toast-container')) {
    criarToastContainer();
  }
});

// ====== EXPORTAÇÕES GLOBAIS ======
window.formatarData = formatarData;
window.formatarDataRelativa = formatarDataRelativa;
window.formatarMoeda = formatarMoeda;
window.formatarTamanhoFicheiro = formatarTamanhoFicheiro;
window.escapeHTML = escapeHTML;
window.$ = $;
window.$$ = $$;
window.mostrar = mostrar;
window.esconder = esconder;
window.toggle = toggle;
window.criarEl = criarEl;
window.iniciarTimer = iniciarTimer;
window.validarEmail = validarEmail;
window.validarTelefone = validarTelefone;
window.validarURL = validarURL;
window.validarForcaSenha = validarForcaSenha;
window.debounce = debounce;
window.throttle = throttle;
window.copiarTexto = copiarTexto;
window.gerarId = gerarId;
window.sanitizarNome = sanitizarNome;
window.aplicarTema = aplicarTema;
window.toggleTema = toggleTema;
window.inicializarTema = inicializarTema;
window.criarToggleTema = criarToggleTema;
window.gerarEmojiAleatorio = gerarEmojiAleatorio;
window.gerarEmojisParaLista = gerarEmojisParaLista;
window.mostrarToast = mostrarToast;
window.ICONES_TEMA = ICONES_TEMA;
window.NOMES_TEMA = NOMES_TEMA;
window.TEMAS_DISPONIVEIS = TEMAS_DISPONIVEIS;