// =============================================
// 🔐 NG TAREFAS - AUTENTICAÇÃO (VERSÃO REFORÇADA)
// =============================================

const SESSION_KEY = 'ng_usuario';
const LEMBRAR_KEY = 'ng_lembrar';
const TENTATIVAS_KEY = 'ng_tentativas';
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;
const SESSAO_EXPIRA_HORAS = 24;

// ========== GERENCIAMENTO DE SESSÃO ==========

function salvarSessao(usuario, lembrar = false) {
  const sessao = {
    ...usuario,
    timestamp: Date.now(),
    expira: lembrar
      ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 dias
      : Date.now() + (SESSAO_EXPIRA_HORAS * 60 * 60 * 1000) // 24 horas
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
  if (lembrar) {
    localStorage.setItem(LEMBRAR_KEY, 'true');
  } else {
    localStorage.removeItem(LEMBRAR_KEY);
  }
}

function obterSessao() {
  const s = localStorage.getItem(SESSION_KEY);
  if (!s) return null;
  try {
    const sessao = JSON.parse(s);
    if (sessao.expira && Date.now() > sessao.expira) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LEMBRAR_KEY);
      return null;
    }
    return sessao;
  } catch (e) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEMBRAR_KEY);
    return null;
  }
}

function logout(confirmar = true) {
  if (confirmar && !window.confirm('Tem certeza que deseja sair?')) {
    return;
  }
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEMBRAR_KEY);
  sessionStorage.clear();
  // Caminho relativo à raiz do projeto
  window.location.href = 'pages/login.html';
}

// ========== VERIFICAÇÕES DE ACESSO ==========

function verificarAutenticacao() {
  const u = obterSessao();
  if (!u) {
    // Obtém o caminho atual completo (ex: /pages/participante.html)
    const caminhoAtual = window.location.pathname;
    const nomePagina = caminhoAtual.split('/').pop();
    // Não redireciona se já estiver em páginas de autenticação
    if (nomePagina !== 'login.html' && nomePagina !== 'recuperacao.html' && nomePagina !== 'custom.html' && nomePagina !== '') {
      window.location.href = 'pages/login.html?redir=' + encodeURIComponent(caminhoAtual);
    }
    return null;
  }
  return u;
}

function verificarGestor() {
  const u = verificarAutenticacao();
  if (!u) return null;
  if (u.tipo !== 'gestor') {
    alert('⛔ Acesso restrito a gestores.');
    window.location.href = 'pages/participante.html';
    return null;
  }
  return u;
}

// ========== CONTROLE DE TENTATIVAS (ANTI-BRUTE FORCE) ==========

function verificarTentativas() {
  const tentativas = JSON.parse(localStorage.getItem(TENTATIVAS_KEY) || '{"count":0,"timestamp":0}');
  if (tentativas.count >= MAX_TENTATIVAS) {
    const tempoPassado = Date.now() - tentativas.timestamp;
    const tempoBloqueio = BLOQUEIO_MINUTOS * 60 * 1000;
    if (tempoPassado < tempoBloqueio) {
      const minutosRestantes = Math.ceil((tempoBloqueio - tempoPassado) / 60000);
      throw new Error(`⏳ Muitas tentativas. Aguarde ${minutosRestantes} minuto(s).`);
    } else {
      // Reseta após o período de bloqueio
      localStorage.setItem(TENTATIVAS_KEY, JSON.stringify({ count: 0, timestamp: 0 }));
    }
  }
}

function registrarTentativa() {
  const tentativas = JSON.parse(localStorage.getItem(TENTATIVAS_KEY) || '{"count":0,"timestamp":0}');
  tentativas.count++;
  tentativas.timestamp = Date.now();
  localStorage.setItem(TENTATIVAS_KEY, JSON.stringify(tentativas));
}

function resetarTentativas() {
  localStorage.removeItem(TENTATIVAS_KEY);
}

// ========== AUTENTICAÇÃO (LOGIN/BIOMETRIA) ==========

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
      // Só conta como tentativa se for erro de credenciais, não de conexão
      if (!res.erro.toLowerCase().includes('conexão') && !res.erro.toLowerCase().includes('internet')) {
        registrarTentativa();
      }
      throw new Error(res.erro);
    }

    resetarTentativas();
    salvarSessao(res.usuario, lembrar);

    const params = new URLSearchParams(window.location.search);
    const redir = params.get('redir');

    // Redireciona para a página original ou para o painel adequado
    if (redir) {
      window.location.href = redir; // já inclui o caminho completo (ex: /pages/admin.html)
    } else {
      window.location.href = res.usuario.tipo === 'gestor' ? 'pages/admin.html' : 'pages/participante.html';
    }
  } catch (e) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
    throw e;
  }
}

// Login com biometria (WebAuthn) – esboço para integração futura
async function loginComBiometria() {
  if (!window.PublicKeyCredential) {
    throw new Error('Biometria não suportada neste dispositivo.');
  }
  try {
    // Obter desafio do servidor
    const res = await api.obterDesafioBiometria();
    if (res.erro) throw new Error(res.erro);

    const publicKey = {
      challenge: Uint8Array.from(atob(res.desafio), c => c.charCodeAt(0)),
      allowCredentials: res.credenciais.map(c => ({
        id: Uint8Array.from(atob(c.id), c => c.charCodeAt(0)),
        type: 'public-key',
      })),
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({ publicKey });
    // Enviar assinatura para verificação
    const verificacao = await api.verificarBiometria({
      id: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
      // outros dados necessários
    });
    if (verificacao.erro) throw new Error(verificacao.erro);

    resetarTentativas();
    salvarSessao(verificacao.usuario, false);
    window.location.href = verificacao.usuario.tipo === 'gestor' ? 'pages/admin.html' : 'pages/participante.html';
  } catch (e) {
    console.error('Erro na autenticação biométrica:', e);
    throw new Error('Falha na autenticação biométrica. Utilize usuário e senha.');
  }
}

// ========== FORÇA DA SENHA ==========

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

function atualizarForcaSenha(inputId, indicadorId) {
  const input = document.getElementById(inputId);
  const indicador = document.getElementById(indicadorId);
  if (!input || !indicador) return;

  input.addEventListener('input', () => {
    const forca = verificarForcaSenha(input.value);
    indicador.className = 'forca-senha ' + forca;
    const textos = { fraca: '🔴 Fraca', media: '🟡 Média', forte: '🟢 Forte' };
    indicador.textContent = textos[forca] || '';
  });
}

// ========== VISIBILIDADE DA SENHA ==========

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

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========

document.addEventListener('DOMContentLoaded', () => {
  // Se já estiver logado, redireciona para o painel correto (apenas na página de login)
  if (window.location.pathname.includes('login.html')) {
    const sessao = obterSessao();
    if (sessao) {
      window.location.href = sessao.tipo === 'gestor' ? 'pages/admin.html' : 'pages/participante.html';
    }
  }
});

// ========== EXPORTAÇÕES GLOBAIS ==========

window.logout = logout;
window.verificarAutenticacao = verificarAutenticacao;
window.verificarGestor = verificarGestor;
window.verificarForcaSenha = verificarForcaSenha;
window.atualizarForcaSenha = atualizarForcaSenha;
window.toggleVisibilidadeSenha = toggleVisibilidadeSenha;
window.login = login;
window.loginComBiometria = loginComBiometria;
window.obterSessao = obterSessao;
window.salvarSessao = salvarSessao;