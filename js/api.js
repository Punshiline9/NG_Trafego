// =============================================
// 🌐 NG TRAFEGO - API (GOOGLE APPS SCRIPT)
// =============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbwnD78AgCIP-fyrzyOTI9gxcTw0cpCouABuA57ffW5-z8ag7zf8n09rnSQ-mp2avVHwow/exec';
const API_TIMEOUT = 15000;

async function chamarAPI(acao, dados = {}, tentarNovamente = true) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const formData = new FormData();
    formData.append('acao', acao);
    for (let chave in dados) {
      if (dados[chave] !== undefined && dados[chave] !== null) {
        formData.append(chave, dados[chave]);
      }
    }

    const resposta = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const json = await resposta.json();
    
    if (json === null || json === undefined) {
      throw new Error('Resposta vazia do servidor');
    }
    
    return json;
    
  } catch (e) {
    clearTimeout(timeout);
    console.error(`❌ API [${acao}]:`, e.message);
    
    if (tentarNovamente && (e.name === 'AbortError' || e.message.includes('HTTP'))) {
      console.warn(`🔄 Retentando [${acao}]...`);
      await new Promise(r => setTimeout(r, 1000));
      return chamarAPI(acao, dados, false);
    }
    
    return { erro: 'Falha na conexão. Verifique sua internet.' };
  }
}

// ====== MÉTODOS PÚBLICOS ======
const api = {
  // --- Autenticação ---
  login: (user, senha) => chamarAPI('login', { user, senha }),
  cadastrar: (dados) => chamarAPI('cadastrar', dados),
  recuperarSenha: (email) => chamarAPI('recuperar', { email }),

  // --- Participante ---
  listarTarefas: (userId) => chamarAPI('listarTarefas', { userId }),
  submeter: (dados) => chamarAPI('submeter', dados),
  verSaldo: (userId) => chamarAPI('verSaldo', { userId }),
  pedirSaque: (userId, valor) => chamarAPI('pedirSaque', { userId, valor }),

  // --- Gestor / Admin ---
  listarSubmissoesPendentes: () => chamarAPI('listarSubmissoesPendentes'),
  aprovar: (submissaoId) => chamarAPI('aprovar', { submissaoId }),
  rejeitar: (submissaoId, motivo) => chamarAPI('rejeitar', { submissaoId, motivo }),
  criarTarefa: (dados) => chamarAPI('criarTarefa', dados),
  editarTarefa: (dados) => chamarAPI('editarTarefa', dados),
  listarUtilizadores: () => chamarAPI('listarUtilizadores'),
  redefinirSenha: (userId, novaSenha, acao) => chamarAPI('redefinirSenha', { userId, nova: novaSenha, acao }),
  configSistema: (dados) => chamarAPI('configSistema', dados),
  
  // --- Bots ---
  gerarBots: () => chamarAPI('gerarBots'),
  gerarBotsPersonalizados: (config) => chamarAPI('gerarBotsPersonalizados', config),
  
  // --- Pódio ---
  gerarPodio: () => chamarAPI('gerarPodio'),

  // --- Saques (gestor) ---
  listarSaquesPendentes: () => chamarAPI('listarSaquesPendentes'),
  confirmarPagamento: (saqueId, comprovativoUrl) => chamarAPI('confirmarPagamento', { saqueId, comprovativoUrl }),

  // --- Páginas dinâmicas ---
  listarPaginas: () => chamarAPI('listarPaginas'),
  criarPagina: (dados) => chamarAPI('criarPagina', dados),
  editarPagina: (dados) => chamarAPI('editarPagina', dados),

  // --- Busca inteligente ---
  buscar: (termo) => chamarAPI('buscar', { termo })
};