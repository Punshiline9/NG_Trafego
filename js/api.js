// URL do Google Apps Script (substituída pela tua)
const API_URL = 'https://script.google.com/macros/s/AKfycbx7bH0gglI6FJeL9Vt6ZlpPfoW9nVaFHzCsdtpqwLReibaGv4LM_2ED9zCpl8OxR6siSg/exec';

/**
 * Envia uma ação e dados para o backend
 * @param {string} acao - nome da ação (ex: 'login')
 * @param {Object} dados - pares chave/valor
 * @returns {Promise<Object>} resposta do servidor (json)
 */
async function chamarAPI(acao, dados = {}) {
  try {
    const formData = new FormData();
    formData.append('acao', acao);
    for (let chave in dados) {
      formData.append(chave, dados[chave]);
    }

    const resposta = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });

    if (!resposta.ok) throw new Error('Erro HTTP: ' + resposta.status);
    return await resposta.json();
  } catch (e) {
    console.error('Erro na API:', e);
    return { erro: 'Falha na conexão com o servidor.' };
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
  redefinirSenha: (userId, novaSenha) => chamarAPI('redefinirSenha', { userId, novaSenha }),
  configSistema: (dados) => chamarAPI('configSistema', dados),
  gerarBots: () => chamarAPI('gerarBots'),
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