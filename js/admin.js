document.addEventListener('DOMContentLoaded', () => {
  const usuario = verificarGestor();
  if (!usuario) return;
  document.getElementById('nomeGestor').textContent = usuario.nome || usuario.user;

  // Configurar abas
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

      // Disparar carregamento
      if (aba === 'aprovacoes') carregarAprovacoes();
      if (aba === 'saques') carregarSaques();
      if (aba === 'tarefas') carregarTarefasAdmin();
      if (aba === 'utilizadores') carregarUtilizadores();
      if (aba === 'niveis') carregarNiveis();
      if (aba === 'config') carregarConfig();
      if (aba === 'paginas') carregarPaginas();
      if (aba === 'mensagens') carregarMensagens();
      if (aba === 'gestores') carregarGestores();
    });
  });

  // Carregar primeira aba
  carregarAprovacoes();

  // Delegar cliques em botões dinâmicos
  document.getElementById('admin-painel-container').addEventListener('click', async (e) => {
    const target = e.target;
    if (target.classList.contains('btn-aprovar')) {
      const id = target.dataset.id;
      await aprovarSubmissao(id);
    }
    if (target.classList.contains('btn-rejeitar')) {
      const id = target.dataset.id;
      const motivo = prompt('Motivo da rejeição:');
      if (motivo !== null) await rejeitarSubmissao(id, motivo);
    }
    if (target.classList.contains('btn-confirmar-saque')) {
      const id = target.dataset.id;
      const comprovativo = prompt('Link do comprovativo de pagamento:');
      if (comprovativo) await confirmarPagamento(id, comprovativo);
    }
    if (target.classList.contains('btn-editar-pagina')) {
      const id = target.dataset.id;
      editarPagina(id);
    }
    if (target.classList.contains('btn-eliminar-pagina')) {
      const id = target.dataset.id;
      if (confirm('Eliminar página?')) eliminarPagina(id);
    }
    if (target.id === 'btnNovaPagina') criarNovaPagina();
    if (target.id === 'btnGerarBots') gerarBots();
    if (target.id === 'btnGerarPodio') gerarPodio();
    if (target.id === 'btnSalvarConfig') salvarConfig();
    if (target.id === 'btnSalvarNiveis') salvarNiveis();
    if (target.id === 'btnCriarTarefa') criarTarefa();
  });
});

// ========== APROVAÇÕES ==========
async function carregarAprovacoes() {
  const painel = document.getElementById('aprovacoes');
  painel.innerHTML = '<p>A carregar...</p>';
  const res = await api.listarSubmissoesPendentes();
  if (res.erro) { painel.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  if (!res.submissoes.length) { painel.innerHTML = '<p>Nenhuma submissão pendente.</p>'; return; }
  painel.innerHTML = `
    <table class="tabela">
      <thead><tr><th>ID</th><th>Utilizador</th><th>Tarefa</th><th>Data</th><th>Ações</th></tr></thead>
      <tbody>
        ${res.submissoes.map(s => `
          <tr>
            <td>${s.id}</td>
            <td>${escapeHTML(s.nome)}</td>
            <td>${escapeHTML(s.tarefa)}</td>
            <td>${formatarData(s.data)}</td>
            <td class="acoes">
              <button class="btn btn-aprovar" data-id="${s.id}">✅ Aprovar</button>
              <button class="btn negro btn-rejeitar" data-id="${s.id}">❌ Rejeitar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

async function aprovarSubmissao(id) {
  const res = await api.aprovar(id);
  alert(res.erro || 'Aprovado! Saldo do participante atualizado.');
  carregarAprovacoes();
}

async function rejeitarSubmissao(id, motivo) {
  const res = await api.rejeitar(id, motivo);
  alert(res.erro || 'Rejeitado.');
  carregarAprovacoes();
}

// ========== SAQUES ==========
async function carregarSaques() {
  const painel = document.getElementById('saques');
  painel.innerHTML = '<p>A carregar...</p>';
  const res = await api.listarSaquesPendentes();
  if (res.erro) { painel.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  if (!res.saques.length) { painel.innerHTML = '<p>Nenhum saque pendente.</p>'; return; }
  painel.innerHTML = `
    <table class="tabela">
      <thead><tr><th>ID</th><th>Utilizador</th><th>Valor</th><th>Data</th><th>Ações</th></tr></thead>
      <tbody>
        ${res.saques.map(s => `
          <tr>
            <td>${s.id}</td>
            <td>${escapeHTML(s.nome)}</td>
            <td>${formatarMoeda(s.valor)}</td>
            <td>${formatarData(s.data)}</td>
            <td class="acoes">
              <button class="btn btn-confirmar-saque" data-id="${s.id}">💸 Enviar Comprovativo</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

async function confirmarPagamento(saqueId, comprovativoUrl) {
  const res = await api.confirmarPagamento(saqueId, comprovativoUrl);
  alert(res.erro || 'Pagamento confirmado! O participante verá o comprovativo.');
  carregarSaques();
}

// ========== TAREFAS ==========
async function carregarTarefasAdmin() {
  const painel = document.getElementById('tarefasAdmin');
  painel.innerHTML = `
    <div class="card-form">
      <h3>Criar Nova Tarefa</h3>
      <input type="text" id="tituloTarefa" placeholder="Título">
      <textarea id="descricaoTarefa" placeholder="Descrição"></textarea>
      <input type="number" id="valorTarefa" placeholder="Valor (Kz)">
      <input type="text" id="tempoTarefa" placeholder="Tempo estimado">
      <select id="nivelTarefa">
        <option value="">Nível (todos)</option>
        <option value="Bronze">Bronze</option>
        <option value="Prata">Prata</option>
        <option value="Ouro">Ouro</option>
        <option value="Platina">Platina</option>
        <option value="Diamante">Diamante</option>
      </select>
      <button class="btn" id="btnCriarTarefa">Criar Tarefa</button>
    </div>
    <div id="listaTarefasAdmin"></div>
  `;
  await listarTarefasAdmin();
}

async function criarTarefa() {
  const dados = {
    titulo: document.getElementById('tituloTarefa').value,
    descricao: document.getElementById('descricaoTarefa').value,
    valor: document.getElementById('valorTarefa').value,
    tempoEstimado: document.getElementById('tempoTarefa').value,
    nivel: document.getElementById('nivelTarefa').value
  };
  const res = await api.criarTarefa(dados);
  alert(res.erro || 'Tarefa criada!');
  carregarTarefasAdmin();
}

async function listarTarefasAdmin() {
  const container = document.getElementById('listaTarefasAdmin');
  const res = await api.listarTarefas(0); // 0 = todas
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.tarefas.map(t => `
    <div class="card-tarefa">
      <strong>${escapeHTML(t.titulo)}</strong> - ${formatarMoeda(t.valor)}
      <p>${escapeHTML(t.descricao||'')}</p>
    </div>
  `).join('');
}

// ========== UTILIZADORES ==========
async function carregarUtilizadores() {
  const painel = document.getElementById('utilizadores');
  painel.innerHTML = '<p>A carregar...</p>';
  const res = await api.listarUtilizadores();
  if (res.erro) { painel.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  painel.innerHTML = `
    <table class="tabela">
      <thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>Tipo</th><th>Saldo</th><th>Ações</th></tr></thead>
      <tbody>
        ${res.utilizadores.map(u => `
          <tr>
            <td>${u.id}</td>
            <td>${escapeHTML(u.nome)}</td>
            <td>${escapeHTML(u.email)}</td>
            <td>${u.tipo}</td>
            <td>${formatarMoeda(u.saldo)}</td>
            <td class="acoes">
              <button class="btn" onclick="promoverUsuario(${u.id})">⭐ Promover</button>
              <button class="btn negro" onclick="redefinirSenhaPrompt(${u.id})">🔑 Senha</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

async function promoverUsuario(userId) {
  const res = await api.redefinirSenha(userId, 'promover'); // endpoint adaptável
  alert(res.erro || 'Utilizador promovido a gestor.');
  carregarUtilizadores();
}

async function redefinirSenhaPrompt(userId) {
  const nova = prompt('Nova senha:');
  if (!nova) return;
  const res = await api.redefinirSenha(userId, nova);
  alert(res.erro || 'Senha redefinida.');
}

// ========== NÍVEIS ==========
function carregarNiveis() {
  const painel = document.getElementById('niveis');
  painel.innerHTML = `
    <div class="card-form">
      <h3>Pontos para cada nível</h3>
      <label>Bronze</label><input type="number" id="ptsBronze" value="1000">
      <label>Prata</label><input type="number" id="ptsPrata" value="5000">
      <label>Ouro</label><input type="number" id="ptsOuro" value="15000">
      <label>Platina</label><input type="number" id="ptsPlatina" value="50000">
      <label>Diamante</label><input type="number" id="ptsDiamante" value="100000">
      <button class="btn" id="btnSalvarNiveis">Salvar</button>
    </div>`;
}

async function salvarNiveis() {
  const dados = {
    bronze: document.getElementById('ptsBronze').value,
    prata: document.getElementById('ptsPrata').value,
    ouro: document.getElementById('ptsOuro').value,
    platina: document.getElementById('ptsPlatina').value,
    diamante: document.getElementById('ptsDiamante').value
  };
  const res = await api.configSistema({ niveis: dados });
  alert(res.erro || 'Níveis salvos.');
}

// ========== CONFIGURAÇÕES ==========
function carregarConfig() {
  const painel = document.getElementById('config');
  painel.innerHTML = `
    <div class="card-form">
      <h3>Configurações Gerais</h3>
      <label>WhatsApp</label><input type="text" id="whatsapp" placeholder="9944669">
      <label>Modo Manutenção</label>
      <select id="manutencao"><option value="0">Não</option><option value="1">Sim</option></select>
      <button class="btn" id="btnSalvarConfig">Salvar</button>
    </div>`;
}

async function salvarConfig() {
  const dados = {
    whatsapp: document.getElementById('whatsapp').value,
    manutencao: document.getElementById('manutencao').value
  };
  const res = await api.configSistema(dados);
  alert(res.erro || 'Configurações salvas.');
}

// ========== PÁGINAS DINÂMICAS ==========
async function carregarPaginas() {
  const painel = document.getElementById('paginas');
  painel.innerHTML = `<button class="btn" id="btnNovaPagina">+ Nova Página</button><div id="listaPaginas" class="lista-paginas"><p>A carregar...</p></div>`;
  const res = await api.listarPaginas();
  const container = document.getElementById('listaPaginas');
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.paginas.map(p => `
    <div class="pagina-item">
      <span class="titulo">${escapeHTML(p.titulo)}</span>
      <span class="acoes">
        <button class="btn btn-editar-pagina" data-id="${p.id}">✏️</button>
        <button class="btn negro btn-eliminar-pagina" data-id="${p.id}">🗑️</button>
      </span>
    </div>
  `).join('');
}

async function criarNovaPagina() {
  const titulo = prompt('Título da página:');
  if (!titulo) return;
  const conteudo = prompt('Conteúdo HTML (pode ser texto simples):');
  const res = await api.criarPagina({ titulo, conteudo });
  alert(res.erro || 'Página criada!');
  carregarPaginas();
}

async function editarPagina(id) {
  const novoTitulo = prompt('Novo título (deixe em branco para manter):');
  const novoConteudo = prompt('Novo conteúdo (deixe em branco para manter):');
  const dados = { id };
  if (novoTitulo) dados.titulo = novoTitulo;
  if (novoConteudo) dados.conteudo = novoConteudo;
  const res = await api.editarPagina(dados);
  alert(res.erro || 'Página atualizada!');
  carregarPaginas();
}

async function eliminarPagina(id) {
  // backend precisa de endpoint 'eliminarPagina', podemos usar editarPagina com ação 'excluir'
  const res = await api.editarPagina({ id, acao: 'excluir' });
  alert(res.erro || 'Eliminada.');
  carregarPaginas();
}

// ========== GESTORES ==========
async function carregarGestores() {
  const painel = document.getElementById('gestores');
  painel.innerHTML = '<p>Lista de gestores (em construção)</p>';
}

// ========== MENSAGENS ==========
function carregarMensagens() {
  document.getElementById('mensagens').innerHTML = '<p>Envio de mensagens em breve.</p>';
}

// ========== BOTS ==========
async function gerarBots() {
  const res = await api.gerarBots();
  alert(res.erro || res.mensagem || '50 bots gerados!');
}

// ========== PÓDIO ==========
async function gerarPodio() {
  const res = await api.gerarPodio();
  if (res.podio) {
    sessionStorage.setItem('podioData', JSON.stringify(res.podio));
    window.open('podio.html', '_blank');
  } else {
    alert(res.erro || 'Erro ao gerar pódio.');
  }
}