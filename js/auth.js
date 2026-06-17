const SESSION_KEY = 'ng_usuario';

// Guarda a sessão no localStorage
function salvarSessao(usuario) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

// Obtém a sessão atual (ou null)
function obterSessao() {
  const s = localStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
}

// Remove a sessão e redireciona para o login
function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'login.html';
}

// Verifica se está autenticado; se não, redireciona para login
function verificarAutenticacao() {
  const u = obterSessao();
  if (!u) {
    window.location.href = 'login.html';
    return null;
  }
  return u;
}

// Verifica se é gestor; se não, redireciona para painel participante
function verificarGestor() {
  const u = verificarAutenticacao();
  if (!u) return null;
  if (u.tipo !== 'gestor') {
    alert('Acesso restrito a gestores.');
    window.location.href = 'participante.html';
    return null;
  }
  return u;
}

// Login simples (sem bloqueio)
async function login(user, senha) {
  const res = await api.login(user, senha);
  if (res.erro) {
    throw new Error(res.erro);
  }
  salvarSessao(res.usuario);
  window.location.href = res.usuario.tipo === 'gestor' ? 'admin.html' : 'participante.html';
}