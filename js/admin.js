// =============================================
// 🛡️ NG TRAFEGO - PAINEL DO GESTOR (COMPLETO)
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  const usuario = verificarGestor();
  if (!usuario) return;
  document.getElementById('nomeGestor').textContent = usuario.nome || usuario.user;

  criarCabecalhoGestor(usuario);
  criarStatsAdmin();

  const botoesAbas = document.querySelectorAll('.abas button[data-aba]');
  const paineisAbas = document.querySelectorAll('.aba-painel');
  botoesAbas.forEach(btn => {
    btn.addEventListener('click', () => {
      botoesAbas.forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      const aba = btn.dataset.aba;
      paineisAbas.forEach(p => p.classList.add('oculto'));
      const painel = document.getElementById(aba);
      if (painel) painel.classList.remove('oculto');

      if (aba === 'aprovacoes') carregarAprovacoes();
      if (aba === 'saques') carregarSaques();
      if (aba === 'tarefasAdmin') carregarTarefasAdmin();
      if (aba === 'utilizadores') carregarUtilizadores();
      if (aba === 'niveis') carregarNiveis();
      if (aba === 'config') carregarConfig();
      if (aba === 'paginas') carregarPaginas();
      if (aba === 'mensagens') carregarMensagens();
      if (aba === 'gestores') carregarGestores();
      if (aba === 'bots') carregarBotsPainel();
    });
  });

  carregarAprovacoes();

  document.getElementById('admin-painel-container').addEventListener('click', async (e) => {
    const target = e.target;
    if (target.classList.contains('btn-aprovar')) {
      modalConfirmar('Aprovar Submissão', 'Confirma a aprovação desta submissão?', async () => {
        await aprovarSubmissao(target.dataset.id);
      });
    }
    if (target.classList.contains('btn-rejeitar')) {
      const motivo = prompt('Motivo da rejeição:');
      if (motivo !== null && motivo.trim()) await rejeitarSubmissao(target.dataset.id, motivo.trim());
    }
    if (target.classList.contains('btn-confirmar-saque')) {
      const comprovativo = prompt('Link do comprovativo de pagamento:');
      if (comprovativo) await confirmarPagamento(target.dataset.id, comprovativo);
    }
    if (target.classList.contains('btn-editar-pagina')) {
      editarPagina(target.dataset.id);
    }
    if (target.classList.contains('btn-eliminar-pagina')) {
      modalConfirmar('Eliminar Página', 'Esta ação é irreversível. Continuar?', async () => {
        await eliminarPagina(target.dataset.id);
      });
    }
    if (target.id === 'btnNovaPagina') criarNovaPagina();
    if (target.id === 'btnGerarBots') gerarBotsConfigurados();
    if (target.id === 'btnGerarPodio') gerarPodio();
    if (target.id === 'btnSalvarConfig') salvarConfig();
    if (target.id === 'btnSalvarNiveis') salvarNiveis();
    if (target.id === 'btnCriarTarefa') criarTarefa();
  });
});

function criarCabecalhoGestor(usuario) {
  const h2 = document.querySelector('.admin-painel h2');
  if (!h2) return;
  
  h2.innerHTML = `
    <div class="admin-header" style="width:100%;">
      <div class="gestor-info">
        <div class="gestor-avatar">🛡️</div>
        <div>
          <span style="color:var(--dourado);font-weight:700;">${escapeHTML(usuario.nome || usuario.user)}</span>
          <br><small style="color:var(--sucesso);">✅ Gestor</small>
        </div>
      </div>
      <div class="acoes-rapidas">
        <button class="btn btn-sm" onclick="carregarAprovacoes()">✅ Aprovações</button>
        <button class="btn btn-sm negro" onclick="document.querySelector('.abas button[data-aba=\\'bots\\']').click()">🤖 Bots</button>
      </div>
    </div>
  `;
}

async function criarStatsAdmin() {
  const container = document.getElementById('aprovacoes');
  if (!container) return;
  
  container.insertAdjacentHTML('afterbegin', `
    <div class="admin-stats">
      <div class="admin-stat-card"><div class="stat-numero" id="statPendentes">...</div><div class="stat-rotulo">⏳ Pendentes</div></div>
      <div class="admin-stat-card"><div class="stat-numero" id="statAprovadas">...</div><div class="stat-rotulo">✅ Aprovadas</div></div>
      <div class="admin-stat-card"><div class="stat-numero" id="statUtilizadores">...</div><div class="stat-rotulo">👥 Utilizadores</div></div>
      <div class="admin-stat-card"><div class="stat-numero" id="statTarefas">...</div><div class="stat-rotulo">📝 Tarefas</div></div>
    </div>
  `);
  atualizarStats();
}

async function atualizarStats() {
  try {
    const submissoes = await api.listarSubmissoesPendentes();
    const utilizadores = await api.listarUtilizadores();
    const tarefas = await api.listarTarefas(0);
    
    document.getElementById('statPendentes').textContent = submissoes.submissoes?.length || 0;
    document.getElementById('statUtilizadores').textContent = utilizadores.utilizadores?.length || 0;
    document.getElementById('statTarefas').textContent = tarefas.tarefas?.length || 0;
  } catch (e) {}
}

function modalConfirmar(titulo, mensagem, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>${titulo}</h3>
      <p>${mensagem}</p>
      <button class="btn" id="modalConfirmar">✅ Confirmar</button>
      <button class="btn negro" id="modalCancelar">❌ Cancelar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  
  overlay.querySelector('#modalConfirmar').onclick = () => { overlay.remove(); if (callback) callback(); };
  overlay.querySelector('#modalCancelar').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function mostrarToast(mensagem, tipo = 'sucesso') {
  const container = document.querySelector('.toast-container') || (() => {
    const c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.textContent = `${tipo === 'sucesso' ? '✅' : tipo === 'erro' ? '❌' : '⚠️'} ${mensagem}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== APROVAÇÕES ==========
async function carregarAprovacoes() {
  const painel = document.getElementById('aprovacoes');
  painel.innerHTML = '<div class="skeleton" style="height:100px;"></div>';
  const res = await api.listarSubmissoesPendentes();
  
  if (res.erro) { painel.innerHTML = `<div class="status-bar erro">${res.erro}</div>`; return; }
  if (!res.submissoes || !res.submissoes.length) { painel.innerHTML = '<div class="status-bar sucesso">✅ Nenhuma submissão pendente.</div>'; return; }
  
  painel.innerHTML = `
    <table class="tabela">
      <thead><tr><th>ID</th><th>Utilizador</th><th>Tarefa</th><th>Data</th><th>Link</th><th>Ações</th></tr></thead>
      <tbody>${res.submissoes.map(s => `
        <tr>
          <td>#${s.id}</td><td>${escapeHTML(s.nome)}</td><td>${escapeHTML(s.tarefa)}</td>
          <td>${formatarData(s.data)}</td><td><a href="${escapeHTML(s.link)}" target="_blank" style="color:var(--dourado);">🔗</a></td>
          <td class="acoes">
            <button class="btn btn-sm btn-aprovar" data-id="${s.id}">✅</button>
            <button class="btn btn-sm negro btn-rejeitar" data-id="${s.id}">❌</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  atualizarStats();
}

async function aprovarSubmissao(id) {
  const res = await api.aprovar(id);
  mostrarToast(res.erro || 'Submissão aprovada!', res.erro ? 'erro' : 'sucesso');
  carregarAprovacoes();
}

async function rejeitarSubmissao(id, motivo) {
  const res = await api.rejeitar(id, motivo);
  mostrarToast(res.erro || 'Submissão rejeitada.', res.erro ? 'erro' : 'aviso');
  carregarAprovacoes();
}

// ========== SAQUES ==========
async function carregarSaques() {
  const painel = document.getElementById('saques');
  painel.innerHTML = '<div class="skeleton" style="height:80px;"></div>';
  const res = await api.listarSaquesPendentes();
  
  if (res.erro) { painel.innerHTML = `<div class="status-bar erro">${res.erro}</div>`; return; }
  if (!res.saques || !res.saques.length) { painel.innerHTML = '<div class="status-bar sucesso">✅ Nenhum saque pendente.</div>'; return; }
  
  painel.innerHTML = `
    <table class="tabela">
      <thead><tr><th>ID</th><th>Utilizador</th><th>Valor</th><th>Data</th><th>Ações</th></tr></thead>
      <tbody>${res.saques.map(s => `
        <tr>
          <td>#${s.id}</td><td>${escapeHTML(s.nome)}</td><td>${formatarMoeda(s.valor)}</td>
          <td>${formatarData(s.data)}</td>
          <td class="acoes"><button class="btn btn-sm btn-confirmar-saque" data-id="${s.id}">💸 Pagar</button></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

async function confirmarPagamento(saqueId, comprovativoUrl) {
  const res = await api.confirmarPagamento(saqueId, comprovativoUrl);
  mostrarToast(res.erro || 'Pagamento confirmado!', res.erro ? 'erro' : 'sucesso');
  carregarSaques();
}

// ========== TAREFAS ==========
async function carregarTarefasAdmin() {
  const painel = document.getElementById('tarefasAdmin');
  painel.innerHTML = `
    <div class="card-form">
      <h3>📝 Criar Nova Tarefa</h3>
      <input type="text" id="tituloTarefa" placeholder="Título da tarefa">
      <textarea id="descricaoTarefa" placeholder="Descrição detalhada"></textarea>
      <input type="number" id="valorTarefa" placeholder="Valor (Kz)">
      <input type="text" id="tempoTarefa" placeholder="Tempo estimado (ex: 5 min)">
      <select id="nivelTarefa">
        <option value="">Nível (todos)</option>
        <option value="Bronze">🥉 Bronze</option>
        <option value="Prata">🥈 Prata</option>
        <option value="Ouro">🥇 Ouro</option>
        <option value="Platina">💎 Platina</option>
        <option value="Diamante">💠 Diamante</option>
      </select>
      <button class="btn" id="btnCriarTarefa">➕ Criar Tarefa</button>
    </div>
    <div id="listaTarefasAdmin"></div>`;
  await listarTarefasAdmin();
}

async function criarTarefa() {
  const titulo = document.getElementById('tituloTarefa').value.trim();
  const valor = document.getElementById('valorTarefa').value;
  if (!titulo || !valor) { mostrarToast('Preencha título e valor.', 'aviso'); return; }
  
  const dados = {
    titulo,
    descricao: document.getElementById('descricaoTarefa').value.trim(),
    valor: Number(valor),
    tempoEstimado: document.getElementById('tempoTarefa').value.trim(),
    nivel: document.getElementById('nivelTarefa').value
  };
  
  const res = await api.criarTarefa(dados);
  mostrarToast(res.erro || 'Tarefa criada!', res.erro ? 'erro' : 'sucesso');
  if (!res.erro) { carregarTarefasAdmin(); atualizarStats(); }
}

async function listarTarefasAdmin() {
  const container = document.getElementById('listaTarefasAdmin');
  const res = await api.listarTarefas(0);
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  
  container.innerHTML = res.tarefas.map(t => `
    <div class="card-tarefa">
      <strong>${escapeHTML(t.titulo)}</strong>
      <span class="badge-status pendente">${t.nivel || 'Todos'}</span>
      <p>${escapeHTML(t.descricao || '')}</p>
      <p class="valor">${formatarMoeda(t.valor)}</p>
      <small>⏱️ ${t.tempoEstimado || 'N/D'} | ID: #${t.id}</small>
    </div>`).join('');
}

// ========== UTILIZADORES ==========
async function carregarUtilizadores() {
  const painel = document.getElementById('utilizadores');
  painel.innerHTML = '<div class="skeleton" style="height:100px;"></div>';
  const res = await api.listarUtilizadores();
  
  if (res.erro) { painel.innerHTML = `<div class="status-bar erro">${res.erro}</div>`; return; }
  
  painel.innerHTML = `
    <table class="tabela">
      <thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>Tipo</th><th>Saldo</th><th>Ações</th></tr></thead>
      <tbody>${res.utilizadores.map(u => `
        <tr>
          <td>#${u.id}</td><td>${escapeHTML(u.nome)}</td><td>${escapeHTML(u.email)}</td>
          <td><span class="badge-status ${u.tipo === 'gestor' ? 'pago' : 'pendente'}">${u.tipo}</span></td>
          <td>${formatarMoeda(u.saldo)}</td>
          <td class="acoes">
            <button class="btn btn-sm" onclick="promoverUsuario(${u.id})">⭐</button>
            <button class="btn btn-sm negro" onclick="redefinirSenhaPrompt(${u.id})">🔑</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

async function promoverUsuario(userId) {
  modalConfirmar('Promover Utilizador', 'Promover este utilizador a gestor?', async () => {
    const res = await api.redefinirSenha(userId, '', 'promover');
    mostrarToast(res.erro || 'Promovido a gestor!', res.erro ? 'erro' : 'sucesso');
    if (!res.erro) carregarUtilizadores();
  });
}

async function redefinirSenhaPrompt(userId) {
  const nova = prompt('Nova senha:');
  if (!nova) return;
  if (nova.length < 4) { mostrarToast('Mínimo 4 caracteres.', 'aviso'); return; }
  const res = await api.redefinirSenha(userId, nova);
  mostrarToast(res.erro || 'Senha redefinida!', res.erro ? 'erro' : 'sucesso');
}

// ========== NÍVEIS ==========
function carregarNiveis() {
  document.getElementById('niveis').innerHTML = `
    <div class="card-form">
      <h3>📊 Pontos para cada nível</h3>
      <div class="config-grid">
        <div class="config-item"><label>🥉 Bronze</label><input type="number" id="ptsBronze" value="1000"></div>
        <div class="config-item"><label>🥈 Prata</label><input type="number" id="ptsPrata" value="5000"></div>
        <div class="config-item"><label>🥇 Ouro</label><input type="number" id="ptsOuro" value="15000"></div>
        <div class="config-item"><label>💎 Platina</label><input type="number" id="ptsPlatina" value="50000"></div>
        <div class="config-item"><label>💠 Diamante</label><input type="number" id="ptsDiamante" value="100000"></div>
      </div>
      <button class="btn" id="btnSalvarNiveis" style="margin-top:15px;">💾 Salvar Níveis</button>
    </div>`;
}

async function salvarNiveis() {
  const dados = { niveis: {
    bronze: document.getElementById('ptsBronze').value,
    prata: document.getElementById('ptsPrata').value,
    ouro: document.getElementById('ptsOuro').value,
    platina: document.getElementById('ptsPlatina').value,
    diamante: document.getElementById('ptsDiamante').value
  }};
  const res = await api.configSistema(dados);
  mostrarToast(res.erro || 'Níveis salvos!', res.erro ? 'erro' : 'sucesso');
}

// ========== CONFIGURAÇÕES ==========
function carregarConfig() {
  document.getElementById('config').innerHTML = `
    <div class="card-form">
      <h3>⚙️ Configurações Gerais</h3>
      <div class="config-grid">
        <div class="config-item"><label>📱 WhatsApp</label><input type="text" id="whatsapp" placeholder="9944669"></div>
        <div class="config-item"><label>📧 Email Suporte</label><input type="text" id="emailSuporte" placeholder="suporte@ngtrafego.com"></div>
        <div class="config-item"><label>🔧 Modo Manutenção</label><select id="manutencao"><option value="0">🟢 Online</option><option value="1">🔴 Manutenção</option></select></div>
      </div>
      <button class="btn" id="btnSalvarConfig">💾 Salvar Configurações</button>
    </div>`;
}

async function salvarConfig() {
  const dados = {
    whatsapp: document.getElementById('whatsapp').value.trim(),
    emailSuporte: document.getElementById('emailSuporte').value.trim(),
    manutencao: document.getElementById('manutencao').value
  };
  const res = await api.configSistema(dados);
  mostrarToast(res.erro || 'Configurações salvas!', res.erro ? 'erro' : 'sucesso');
}

// ========== PÁGINAS DINÂMICAS ==========
async function carregarPaginas() {
  const painel = document.getElementById('paginas');
  painel.innerHTML = `
    <button class="btn" id="btnNovaPagina" style="margin-bottom:15px;">📄 + Nova Página</button>
    <div id="listaPaginas" class="lista-paginas"><div class="skeleton" style="height:60px;"></div></div>`;
  
  const res = await api.listarPaginas();
  const container = document.getElementById('listaPaginas');
  
  if (res.erro) { container.innerHTML = `<div class="status-bar erro">${res.erro}</div>`; return; }
  if (!res.paginas || !res.paginas.length) { container.innerHTML = '<p style="color:var(--texto-terciario);text-align:center;">📭 Nenhuma página criada.</p>'; return; }
  
  container.innerHTML = res.paginas.map(p => `
    <div class="pagina-item">
      <span class="titulo">📄 ${escapeHTML(p.titulo)}</span>
      <span class="acoes">
        <button class="btn btn-sm btn-editar-pagina" data-id="${p.id}">✏️</button>
        <button class="btn btn-sm negro btn-eliminar-pagina" data-id="${p.id}">🗑️</button>
      </span>
    </div>`).join('');
}

async function criarNovaPagina() {
  const titulo = prompt('📄 Título da página:');
  if (!titulo || !titulo.trim()) return;
  const conteudo = prompt('📝 Conteúdo HTML:');
  const res = await api.criarPagina({ titulo: titulo.trim(), conteudo: conteudo || '' });
  mostrarToast(res.erro || 'Página criada!', res.erro ? 'erro' : 'sucesso');
  if (!res.erro) carregarPaginas();
}

async function editarPagina(id) {
  const res = await api.listarPaginas();
  const pagina = res.paginas?.find(p => p.id == id);
  if (!pagina) return;
  
  const novoTitulo = prompt('Novo título:', pagina.titulo);
  if (novoTitulo === null) return;
  const novoConteudo = prompt('Novo conteúdo:', pagina.conteudo || '');
  if (novoConteudo === null) return;
  
  const dados = { id };
  if (novoTitulo.trim()) dados.titulo = novoTitulo.trim();
  if (novoConteudo.trim()) dados.conteudo = novoConteudo.trim();
  
  const resultado = await api.editarPagina(dados);
  mostrarToast(resultado.erro || 'Página atualizada!', resultado.erro ? 'erro' : 'sucesso');
  if (!resultado.erro) carregarPaginas();
}

async function eliminarPagina(id) {
  const res = await api.editarPagina({ id, acao: 'excluir' });
  mostrarToast(res.erro || 'Página eliminada.', res.erro ? 'erro' : 'aviso');
  if (!res.erro) carregarPaginas();
}

// ========== GESTORES ==========
async function carregarGestores() {
  const painel = document.getElementById('gestores');
  const res = await api.listarUtilizadores();
  if (res.erro) { painel.innerHTML = `<div class="status-bar erro">${res.erro}</div>`; return; }
  
  const gestores = (res.utilizadores || []).filter(u => u.tipo === 'gestor');
  if (!gestores.length) { painel.innerHTML = '<p style="color:var(--texto-terciario);">Nenhum gestor além de você.</p>'; return; }
  
  painel.innerHTML = `
    <table class="tabela">
      <thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>Saldo</th></tr></thead>
      <tbody>${gestores.map(g => `
        <tr>
          <td>#${g.id}</td><td>🛡️ ${escapeHTML(g.nome)}</td><td>${escapeHTML(g.email)}</td><td>${formatarMoeda(g.saldo)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

// ========== MENSAGENS ==========
function carregarMensagens() {
  document.getElementById('mensagens').innerHTML = `
    <div class="card-form">
      <h3>✉️ Enviar Mensagem</h3>
      <p style="color:var(--texto-terciario);margin-bottom:15px;">Funcionalidade disponível em breve.</p>
      <input type="text" placeholder="Destinatário" disabled>
      <textarea placeholder="Mensagem..." disabled></textarea>
      <button class="btn" disabled>📨 Enviar</button>
    </div>`;
}

// =============================================
// 🤖 BOTS COM NOMES REAIS
// =============================================

const NOMES_BOTS = [
  'Adilson Manuel', 'Amélia Kiesse', 'António Nogueira', 'Beatriz Cassule',
  'Carlos Benguela', 'Cátia Mussolo', 'Daniel Chivukuvuku', 'Djamila António',
  'Edgar Cuanza', 'Eliane Ndonge', 'Fernando Huambo', 'Filomena Zango',
  'Gabriel Cabinda', 'Graciete Lunda', 'Hamilton Dikota', 'Helena Quiçama',
  'Ildo Chipindo', 'Isabel Malanje', 'João Cazenga', 'Josefina Cunene',
  'Kelson Namibe', 'Laurinda Huíla', 'Leonardo Saurimo', 'Lúcia Menongue',
  'Manuel Uíge', 'Margarida Bié', 'Mateus Lubango', 'Natália Soyo',
  'Nelson Bengo', 'Odete Kwanza', 'Paulo Dande', 'Quitéria Zaire',
  'Rafael Moxico', 'Roberta Lwena', 'Samuel Cuando', 'Sofia Cubango',
  'Tiago Maianga', 'Valéria Cacuaco', 'Victor Sumbe', 'Yolanda Ndalatando',
  'Walter Cuito', 'Xandra Lobito', 'Zeca Moçâmedes', 'Vera Chibia',
  'Ulisses Ondjiva', 'Tânia Caluquembe', 'Sérgio Gabela', 'Rita Cassongue',
  'Pedro Catumbela', 'Olga Balombo'
];

const EMOJIS_BOTS = [
  '👨‍💻', '👩‍💻', '🧑‍🔬', '👨‍🎨', '👩‍🏫', '🧑‍💼', '👨‍🔧', '👩‍⚕️',
  '🧑‍🌾', '👨‍🍳', '👩‍🚀', '🧑‍🚒', '👨‍🎤', '👩‍🎓', '🧑‍🏭', '👨‍⚖️',
  '👩‍✈️', '🧑‍🔧', '👨‍💼', '👩‍🔬', '🧑‍🎨', '👨‍🏫', '👩‍💻', '🧑‍🍳'
];

function carregarBotsPainel() {
  const painel = document.getElementById('bots');
  painel.innerHTML = `
    <div class="card-form">
      <h3>🤖 Gerar Bots com Nomes Reais</h3>
      <div class="config-grid">
        <div class="config-item">
          <label>👥 Quantidade de Bots</label>
          <input type="number" id="quantidadeBots" value="50" min="1" max="200">
        </div>
        <div class="config-item">
          <label>💰 Ponto Máximo (Kz)</label>
          <input type="number" id="pontoMaximoBots" value="50000" min="100" step="100">
        </div>
        <div class="config-item">
          <label>🏆 Bots no Topo (1º lugar)</label>
          <input type="number" id="botsNoTopo" value="5" min="1" max="50">
        </div>
        <div class="config-item">
          <label>📊 Bots Intermediários</label>
          <input type="number" id="botsMedianos" value="15" min="0" max="100">
        </div>
      </div>
      <p style="color:var(--texto-secundario);font-size:0.85em;margin:10px 0;">
        🎯 <b>Topo:</b> 80-100% do máximo (podem ficar em 1º)<br>
        📊 <b>Intermediários:</b> 20-80% do máximo<br>
        📉 <b>Restantes:</b> 1-40% do máximo
      </p>
      <button class="btn" id="btnGerarBots" style="width:100%;padding:14px;font-size:1.1em;">🤖 Gerar Bots</button>
      <p id="statusBots" style="margin-top:12px;text-align:center;"></p>
    </div>
    <div id="listaBotsGerados" style="margin-top:20px;"></div>`;
}

async function gerarBotsConfigurados() {
  const quantidade = parseInt(document.getElementById('quantidadeBots').value) || 50;
  const pontoMaximo = parseInt(document.getElementById('pontoMaximoBots').value) || 50000;
  const botsNoTopo = parseInt(document.getElementById('botsNoTopo').value) || 5;
  const botsMedianos = parseInt(document.getElementById('botsMedianos').value) || 15;
  
  if (quantidade < 1 || quantidade > 200) { mostrarToast('Quantidade: 1-200.', 'aviso'); return; }
  if (botsNoTopo + botsMedianos > quantidade) { mostrarToast('Topo + Intermediários excede o total.', 'erro'); return; }
  
  const btn = document.getElementById('btnGerarBots');
  const status = document.getElementById('statusBots');
  btn.disabled = true;
  btn.textContent = '⏳ Gerando...';
  status.innerHTML = '<p style="color:var(--dourado);">🤖 Criando bots...</p>';
  
  try {
    const res = await api.gerarBotsPersonalizados({
      quantidade, pontoMaximo, botsNoTopo, botsMedianos,
      nomes: JSON.stringify(NOMES_BOTS),
      emojis: JSON.stringify(EMOJIS_BOTS)
    });
    
    if (res.erro) {
      status.innerHTML = `<p class="erro">${res.erro}</p>`;
      mostrarToast(res.erro, 'erro');
    } else {
      status.innerHTML = `<p class="sucesso">✅ ${res.mensagem}</p>`;
      mostrarToast(res.mensagem || 'Bots gerados!', 'sucesso');
      if (res.bots) exibirBotsGerados(res.bots);
      atualizarStats();
    }
  } catch (e) {
    status.innerHTML = `<p class="erro">Erro: ${e.message}</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '🤖 Gerar Bots';
  }
}

function exibirBotsGerados(bots) {
  const container = document.getElementById('listaBotsGerados');
  if (!container) return;
  container.innerHTML = `
    <h4 style="color:var(--dourado);margin-bottom:12px;">📋 Últimos Bots (${bots.length})</h4>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
      ${bots.slice(0, 20).map(bot => `
        <div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">
          <span style="font-size:1.4em;">${escapeHTML(bot.emoji || '👤')}</span>
          <div>
            <span style="color:var(--dourado);font-size:0.9em;">${escapeHTML(bot.nome)}</span>
            <br><small style="color:var(--texto-terciario);">${formatarMoeda(bot.pontos)}</small>
          </div>
        </div>`).join('')}
    </div>`;
}

// ========== PÓDIO ==========
async function gerarPodio() {
  const res = await api.gerarPodio();
  if (res.podio) {
    sessionStorage.setItem('podioData', JSON.stringify(res.podio));
    mostrarToast('Pódio gerado! Abrindo...', 'sucesso');
    setTimeout(() => window.open('podio.html', '_blank'), 500);
  } else {
    mostrarToast(res.erro || 'Erro ao gerar pódio.', 'erro');
  }
}

// ====== EXPORTAR PARA USO GLOBAL ======
window.carregarAprovacoes = carregarAprovacoes;
window.gerarBotsConfigurados = gerarBotsConfigurados;
window.gerarPodio = gerarPodio;
window.promoverUsuario = promoverUsuario;
window.redefinirSenhaPrompt = redefinirSenhaPrompt;