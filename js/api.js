// =============================================
// 🌐 NG TAREFAS - API (GOOGLE APPS SCRIPT)
// Versão reforçada com retry, cache, chat e mais
// =============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbwz-s-naNGexX79GQvPuUugTNgUr7zWUzi2K3Lr4izAqF4t3HLyL7BBASzGA10IgjzwoA/exec';
const API_TIMEOUT = 15000;
const MAX_RETENTATIVAS = 2;

const cache = new Map();
const CACHE_TTL = 60000;

function getCache(chave) {
  const entry = cache.get(chave);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(chave);
    return null;
  }
  return entry.data;
}

function setCache(chave, data) {
  cache.set(chave, { data, timestamp: Date.now() });
}

function invalidateCache() {
  cache.clear();
}

async function chamarAPI(acao, dados = {}, opcoes = {}) {
  const {
    timeout = API_TIMEOUT,
    tentarNovamente = true,
    usarCache = false,
    cacheKey = null
  } = opcoes;

  if (usarCache && cacheKey) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  const controller = new AbortController();
  const idTimeout = setTimeout(() => controller.abort(), timeout);

  try {
    let formData;
    if (dados instanceof FormData) {
      formData = dados;
      formData.append('acao', acao);
    } else {
      formData = new FormData();
      formData.append('acao', acao);
      for (let chave in dados) {
        if (dados[chave] !== undefined && dados[chave] !== null) {
          formData.append(chave, dados[chave]);
        }
      }
    }

    const resposta = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(idTimeout);

    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status}: ${resposta.statusText}`);
    }

    const json = await resposta.json();
    if (json === null || json === undefined) {
      throw new Error('Resposta vazia do servidor');
    }

    if (usarCache && cacheKey) {
      setCache(cacheKey, json);
    }

    return json;

  } catch (e) {
    clearTimeout(idTimeout);
    console.error(`❌ API [${acao}]:`, e.message);

    if (tentarNovamente && (e.name === 'AbortError' || e.message.includes('HTTP'))) {
      const tentativa = opcoes.tentativa || 1;
      if (tentativa <= MAX_RETENTATIVAS) {
        console.warn(`🔄 Retentando [${acao}] (${tentativa}/${MAX_RETENTATIVAS})...`);
        await new Promise(r => setTimeout(r, 1000 * tentativa));
        return chamarAPI(acao, dados, { ...opcoes, tentativa: tentativa + 1 });
      }
    }

    return { erro: 'Falha na conexão. Verifique sua internet.' };
  }
}

const api = {
  // --- Autenticação ---
  login: (user, senha) => chamarAPI('login', { user, senha }),
  cadastrar: (dados) => chamarAPI('cadastrar', dados),
  recuperarSenha: (email) => chamarAPI('recuperar', { email }),
  obterDesafioBiometria: () => chamarAPI('desafioBiometria'),
  verificarBiometria: (dados) => chamarAPI('verificarBiometria', dados),

  // --- Participante ---
  listarTarefas: (userId) => chamarAPI('listarTarefas', { userId }, { usarCache: true, cacheKey: `tarefas_${userId}` }),
  submeter: (dados) => {
    invalidateCache();
    return chamarAPI('submeter', dados);
  },
  verSaldo: (userId) => chamarAPI('verSaldo', { userId }),
  pedirSaque: (dados) => chamarAPI('pedirSaque', dados),

  // --- Perfil ---
  atualizarPerfil: (dados) => chamarAPI('atualizarPerfil', dados),
  uploadFotoPerfil: (userId, file) => {
    const fd = new FormData();
    fd.append('userId', userId);
    fd.append('foto', file);
    return chamarAPI('uploadFotoPerfil', fd);
  },

  // --- Metas ---
  verMetas: (userId) => chamarAPI('verMetas', { userId }),
  salvarMetas: (dados) => chamarAPI('salvarMetas', dados),

  // --- Participantes ---
  listarParticipantes: (userId) => chamarAPI('listarParticipantes', { userId }, { usarCache: true, cacheKey: `participantes_${userId}` }),

  // --- Tarefas Especiais ---
  criarTarefaEspecial: (dados) => chamarAPI('criarTarefaEspecial', dados),
  listarTarefasEspeciais: (userId, tipo = 'user') => chamarAPI('listarTarefasEspeciais', { userId, tipo }),
  aprovarTarefaEspecial: (id) => chamarAPI('aprovarTarefaEspecial', { id }),
  eliminarTarefaEspecial: (id) => chamarAPI('eliminarTarefaEspecial', { id }),

  // --- Anúncios ---
  listarAnuncios: () => chamarAPI('listarAnuncios', {}, { usarCache: true, cacheKey: 'anuncios' }),
  criarAnuncio: (dados) => {
    invalidateCache();
    return chamarAPI('criarAnuncio', dados);
  },
  editarAnuncio: (dados) => {
    invalidateCache();
    return chamarAPI('editarAnuncio', dados);
  },
  eliminarAnuncio: (id) => {
    invalidateCache();
    return chamarAPI('eliminarAnuncio', { id });
  },

  // --- Aplicativos (Dicas) ---
  listarAplicativos: (userId, tipo = 'user') => chamarAPI('listarAplicativos', { userId, tipo }),
  enviarAplicativo: (dados) => chamarAPI('enviarAplicativo', dados),
  aprovarAplicativo: (id) => chamarAPI('aprovarAplicativo', { id }),
  eliminarAplicativo: (id) => chamarAPI('eliminarAplicativo', { id }),

  // --- Reclamações ---
  listarReclamacoes: (userId, tipo = 'user') => chamarAPI('listarReclamacoes', { userId, tipo }),
  enviarReclamacao: (dados) => chamarAPI('enviarReclamacao', dados),
  responderReclamacao: (dados) => chamarAPI('responderReclamacao', dados),

  // --- Conteúdo das Dicas (Regras, Ajuda) ---
  getConteudo: (tipo) => chamarAPI('getConteudo', { tipo }, { usarCache: true, cacheKey: `conteudo_${tipo}` }),
  salvarConteudo: (dados) => {
    invalidateCache();
    return chamarAPI('salvarConteudo', dados);
  },

  // --- Gestor ---
  listarSubmissoesPendentes: () => chamarAPI('listarSubmissoesPendentes'),
  aprovar: (submissaoId) => chamarAPI('aprovar', { submissaoId }),
  rejeitar: (submissaoId, motivo) => chamarAPI('rejeitar', { submissaoId, motivo }),
  criarTarefa: (dados) => chamarAPI('criarTarefa', dados),
  editarTarefa: (dados) => chamarAPI('editarTarefa', dados),
  listarUtilizadores: (tipo = 'todos') => chamarAPI('listarUtilizadores', { tipo }),
  redefinirSenha: (userId, novaSenha, acao) => chamarAPI('redefinirSenha', { userId, nova: novaSenha, acao }),
  configSistema: (dados) => chamarAPI('configSistema', dados),

  // --- Bónus de níveis ---
  listarBonusPendentes: () => chamarAPI('listarBonusPendentes'),
  aprovarBonus: (id) => chamarAPI('aprovarBonus', { id }),
  rejeitarBonus: (id, motivo) => chamarAPI('rejeitarBonus', { id, motivo }),
  listarBonusRecebidos: (userId) => chamarAPI('listarBonusRecebidos', { userId }),

  // --- Mensagens motivacionais ---
  listarMensagens: () => chamarAPI('listarMensagens', {}, { usarCache: true, cacheKey: 'mensagens' }),
  criarMensagem: (dados) => {
    invalidateCache();
    return chamarAPI('criarMensagem', dados);
  },
  editarMensagem: (dados) => {
    invalidateCache();
    return chamarAPI('editarMensagem', dados);
  },
  eliminarMensagem: (id) => {
    invalidateCache();
    return chamarAPI('eliminarMensagem', { id });
  },

  // --- Bots ---
  gerarBots: () => chamarAPI('gerarBots'),
  gerarBotsPersonalizados: (config) => chamarAPI('gerarBotsPersonalizados', config),
  eliminarBot: (id) => chamarAPI('eliminarBot', { id }),

  // --- Saques (gestor) ---
  listarSaquesPendentes: () => chamarAPI('listarSaquesPendentes'),
  confirmarPagamento: (saqueId, comprovativoUrl) => chamarAPI('confirmarPagamento', { saqueId, comprovativoUrl }),

  // --- Páginas dinâmicas ---
  listarPaginas: () => chamarAPI('listarPaginas'),
  criarPagina: (dados) => chamarAPI('criarPagina', dados),
  editarPagina: (dados) => chamarAPI('editarPagina', dados),

  // --- Chat Interno ---
  enviarMensagem: (dados) => chamarAPI('enviarMensagem', dados),
  listarMensagens: (userId) => chamarAPI('listarMensagens', { userId }),
  marcarLida: (userId, remetenteId) => chamarAPI('marcarLida', { userId, remetenteId }),

  // --- Busca ---
  buscar: (termo) => chamarAPI('buscar', { termo }),

  // 🆕 Sub‑gestores
  obterPermissoes: (userId) => chamarAPI('obterPermissoes', { userId }),
  salvarPermissoes: (dados) => chamarAPI('salvarPermissoes', dados),

  // 🆕 Modelos de tarefas
  listarModelos: () => chamarAPI('listarModelos'),
  criarModelo: (dados) => chamarAPI('criarModelo', dados),
  editarModelo: (dados) => chamarAPI('editarModelo', dados),
  eliminarModelo: (id) => chamarAPI('eliminarModelo', { id })
};

window.api = api;
window.invalidateCache = invalidateCache;