// =============================================
// 🔐 NG TRAFEGO - AUTENTICAÇÃO
// =============================================

const SESSION_KEY = 'ng_usuario';
const LEMBRAR_KEY = 'ng_lembrar';
const TENTATIVAS_KEY = 'ng_tentativas';
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;
const SESSAO_EXPIRA_HORAS = 24;

// Guarda a sessão no localStorage
function salvarSessao(usuario, lembrar = false) {
  const sessao = {
    ...usuario,
    timestamp: Date.now(),
    expira: lembrar ? Date.now() + (30 * 24 * 60 * 60 * 1000) : Date.now() + (SESSAO_EXPIRA_HORAS * 60 * 60 * 1000)
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
  if (lembrar) {
    localStorage.setItem(LEMBRAR_KEY, 'true');
  }
}

// Obtém a sessão atual (ou null)
function obterSessao() {
  const s = localStorage.getItem(SESSION_KEY);
  if (!s) return null;
  
  try {
    const sessao = JSON.parse(s);
    if (sessao.expira && Date.now() > sessao.expira) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return sessao;
  } catch (e) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

// Remove a sessão e redireciona para o login
function logout(confirmar = true) {
  if (confirmar && !window.confirm('Tem certeza que deseja sair?')) {
    return;
  }
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEMBRAR_KEY);
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// Verifica se está autenticado; se não, redireciona para login
function verificarAutenticacao() {
  const u = obterSessao();
  if (!u) {
    const paginaAtual = window.location.pathname.split('/').pop();
    if (paginaAtual !== 'login.html' && paginaAtual !== 'recuperacao.html' && paginaAtual !== 'custom.html') {
      window.location.href = 'login.html?redir=' + encodeURIComponent(paginaAtual);
    }
    return null;
  }
  return u;
}

// Verifica se é gestor; se não, redireciona para painel participante
function verificarGestor() {
  const u = verificarAutenticacao();
  if (!u) return null;
  if (u.tipo !== 'gestor') {
    alert('⛔ Acesso restrito a gestores.');
    window.location.href = 'participante.html';
    return null;
  }
  return u;
}

// Verifica tentativas de login (anti-brute force)
function verificarTentativas() {
  const tentativas = JSON.parse(localStorage.getItem(TENTATIVAS_KEY) || '{"count":0,"timestamp":0}');
  
  if (tentativas.count >= MAX_TENTATIVAS) {
    const tempoPassado = Date.now() - tentativas.timestamp;
    const tempoBloqueio = BLOQUEIO_MINUTOS * 60 * 1000;
    
    if (tempoPassado < tempoBloqueio) {
      const minutosRestantes = Math.ceil((tempoBloqueio - tempoPassado) / 60000);
      throw new Error(`⏳ Muitas tentativas. Aguarde ${minutosRestantes} minuto(s).`);
    } else {
      localStorage.setItem(TENTATIVAS_KEY, JSON.stringify({ count: 0, timestamp: 0 }));
    }
  }
}

// Regista tentativa falhada
function registrarTentativa() {
  const tentativas = JSON.parse(localStorage.getItem(TENTATIVAS_KEY) || '{"count":0,"timestamp":0}');
  tentativas.count++;
  tentativas.timestamp = Date.now();
  localStorage.setItem(TENTATIVAS_KEY, JSON.stringify(tentativas));
}

// Reseta tentativas (após login bem-sucedido)
function resetarTentativas() {
  localStorage.removeItem(TENTATIVAS_KEY);
}

// Login com bloqueio e feedback
async function login(user, senha, lembrar = false) {
  verificarTentativas();
  
  if (!user || !senha) {
    throw new Error('⚠️ Preencha usuário e senha.');
  }
  
  const btn = document.getElementById('btnLogin');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '🔄 Entrando...';
  }
  
  try {
    const res = await api.login(user, senha);
    
    if (res.erro) {
      registrarTentativa();
      throw new Error(res.erro);
    }
    
    resetarTentativas();
    salvarSessao(res.usuario, lembrar);
    
    const params = new URLSearchParams(window.location.search);
    const redir = params.get('redir');
    
    if (redir && redir !== 'login.html') {
      window.location.href = redir;
    } else {
      window.location.href = res.usuario.tipo === 'gestor' ? 'admin.html' : 'participante.html';
    }
    
  } catch (e) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
    throw e;
  }
}

// Verifica força da senha
function verificarForcaSenha(senha) {
  let pontos = 0;
  if (senha.length >= 6) pontos++;
  if (senha.length >= 8) pontos++;
  if (/[A-Z]/.test(senha)) pontos++;
  if (/[0-9]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  
  if (pontos <= 2) return 'fraca';
  if (pontos <= 3) return 'media';
  return 'forte';
}

// Atualiza indicador de força da senha
function atualizarForcaSenha(inputId, indicadorId) {
  const input = document.getElementById(inputId);
  const indicador = document.getElementById(indicadorId);
  if (!input || !indicador) return;
  
  input.addEventListener('input', () => {
    const forca = verificarForcaSenha(input.value);
    indicador.className = 'forca-senha ' + forca;
    const textos = { fraca: '🔴 Fraca', media: '🟡 Média', forte: '🟢 Forte' };
    indicador.setAttribute('title', textos[forca] || '');
  });
}

// Toggle visibilidade da senha
function toggleVisibilidadeSenha(inputId, iconeId) {
  const input = document.getElementById(inputId);
  const icone = document.getElementById(iconeId);
  if (!input || !icone) return;
  
  icone.addEventListener('click', () => {
    const tipo = input.type === 'password' ? 'text' : 'password';
    input.type = tipo;
    icone.textContent = tipo === 'password' ? '👁️' : '🙈';
  });
}

// Inicialização automática ao carregar página
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('login.html')) {
    const sessao = obterSessao();
    if (sessao) {
      window.location.href = sessao.tipo === 'gestor' ? 'admin.html' : 'participante.html';
    }
  }
  
  window.logout = logout;
  window.verificarForcaSenha = verificarForcaSenha;
  window.toggleVisibilidadeSenha = toggleVisibilidadeSenha;
});