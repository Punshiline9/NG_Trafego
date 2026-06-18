// =============================================
// 🛡️ NG TRAFEGO - PAINEL DO GESTOR (COMPLETO)
// =============================================

document.addEventListener('DOMContentLoaded', function() {
  var usuario = verificarGestor();
  if (!usuario) return;
  document.getElementById('nomeGestor').textContent = usuario.nome || usuario.user;

  criarCabecalhoGestor(usuario);
  criarStatsAdmin();

  var botoesAbas = document.querySelectorAll('.abas button[data-aba]');
  var paineisAbas = document.querySelectorAll('.aba-painel');
  botoesAbas.forEach(function(btn) {
    btn.addEventListener('click', function() {
      botoesAbas.forEach(function(b) { b.classList.remove('ativo'); });
      btn.classList.add('ativo');
      var aba = btn.dataset.aba;
      paineisAbas.forEach(function(p) { p.classList.add('oculto'); });
      var painel = document.getElementById(aba);
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

  document.getElementById('admin-painel-container').addEventListener('click', function(e) {
    var target = e.target;
    
    if (target.classList.contains('btn-aprovar')) {
      modalConfirmar('Aprovar Submissão', 'Confirma a aprovação desta submissão?', function() {
        aprovarSubmissao(target.dataset.id);
      });
    }
    if (target.classList.contains('btn-rejeitar')) {
      var motivo = prompt('Motivo da rejeição:');
      if (motivo !== null && motivo.trim()) rejeitarSubmissao(target.dataset.id, motivo.trim());
    }
    if (target.classList.contains('btn-confirmar-saque')) {
      var comprovativo = prompt('Link do comprovativo de pagamento:');
      if (comprovativo) confirmarPagamento(target.dataset.id, comprovativo);
    }
    if (target.classList.contains('btn-editar-pagina')) {
      editarPagina(target.dataset.id);
    }
    if (target.classList.contains('btn-eliminar-pagina')) {
      modalConfirmar('Eliminar Página', 'Esta ação é irreversível. Continuar?', function() {
        eliminarPagina(target.dataset.id);
      });
    }
    if (target.classList.contains('btn-eliminar-utilizador')) {
      modalConfirmar('Eliminar Utilizador', 'Tem certeza que deseja eliminar este utilizador permanentemente?', function() {
        eliminarUtilizador(target.dataset.id);
      });
    }
    if (target.classList.contains('btn-banir-utilizador')) {
      modalConfirmar('Banir Utilizador', 'O utilizador será banido e não poderá aceder ao sistema. Continuar?', function() {
        banirUtilizador(target.dataset.id);
      });
    }
    if (target.classList.contains('btn-editar-tarefa')) {
      editarTarefaPrompt(target.dataset.id);
    }
    if (target.classList.contains('btn-eliminar-tarefa')) {
      modalConfirmar('Eliminar Tarefa', 'Esta tarefa será removida permanentemente. Continuar?', function() {
        eliminarTarefa(target.dataset.id);
      });
    }
    if (target.classList.contains('btn-eliminar-bot')) {
      modalConfirmar('Eliminar Bot', 'Este bot será removido permanentemente. Continuar?', function() {
        eliminarBot(target.dataset.id);
      });
    }
    if (target.classList.contains('btn-limpar-bots')) {
      modalConfirmar('Eliminar TODOS os Bots', 'Isto vai remover todos os bots do sistema. Esta ação é irreversível!', function() {
        limparTodosBots();
      });
    }
    if (target.classList.contains('btn-rejeitar-saque')) {
      var motivoSaque = prompt('Motivo da rejeição do saque:');
      if (motivoSaque !== null && motivoSaque.trim()) rejeitarSaque(target.dataset.id, motivoSaque.trim());
    }
    if (target.id === 'btnNovaPagina') criarNovaPagina();
    if (target.id === 'btnGerarBots') gerarBotsConfigurados();
    if (target.id === 'btnGerarPodio') gerarPodio();
    if (target.id === 'btnSalvarConfig') salvarConfig();
    if (target.id === 'btnSalvarNiveis') salvarNiveis();
    if (target.id === 'btnCriarTarefa') criarTarefa();
    if (target.id === 'btnLimparTodosBots') {
      modalConfirmar('Eliminar TODOS os Bots', 'Isto vai remover todos os bots do sistema. Esta ação é irreversível!', function() {
        limparTodosBots();
      });
    }
  });
});

function criarCabecalhoGestor(usuario) {
  var h2 = document.querySelector('.admin-painel h2');
  if (!h2) return;
  
  h2.innerHTML = '<div class="admin-header" style="width:100%;">' +
    '<div class="gestor-info">' +
    '<div class="gestor-avatar">🛡️</div>' +
    '<div>' +
    '<span style="color:var(--dourado);font-weight:700;">' + escapeHTML(usuario.nome || usuario.user) + '</span>' +
    '<br><small style="color:var(--sucesso);">✅ Gestor</small>' +
    '</div>' +
    '</div>' +
    '<div class="acoes-rapidas">' +
    '<button class="btn btn-sm" onclick="carregarAprovacoes()">✅ Aprovações</button>' +
    '<button class="btn btn-sm negro" onclick="document.querySelector(\'.abas button[data-aba=bots]\').click()">🤖 Bots</button>' +
    '</div>' +
    '</div>';
}

async function criarStatsAdmin() {
  var container = document.getElementById('aprovacoes');
  if (!container) return;
  
  container.insertAdjacentHTML('afterbegin', 
    '<div class="admin-stats">' +
    '<div class="admin-stat-card"><div class="stat-numero" id="statPendentes">...</div><div class="stat-rotulo">⏳ Pendentes</div></div>' +
    '<div class="admin-stat-card"><div class="stat-numero" id="statAprovadas">...</div><div class="stat-rotulo">✅ Aprovadas</div></div>' +
    '<div class="admin-stat-card"><div class="stat-numero" id="statUtilizadores">...</div><div class="stat-rotulo">👥 Utilizadores</div></div>' +
    '<div class="admin-stat-card"><div class="stat-numero" id="statTarefas">...</div><div class="stat-rotulo">📝 Tarefas</div></div>' +
    '</div>'
  );
  atualizarStats();
}

async function atualizarStats() {
  try {
    var submissoes = await api.listarSubmissoesPendentes();
    var utilizadores = await api.listarUtilizadores();
    var tarefas = await api.listarTarefas(0);
    
    document.getElementById('statPendentes').textContent = (submissoes.submissoes && submissoes.submissoes.length) || 0;
    document.getElementById('statUtilizadores').textContent = (utilizadores.utilizadores && utilizadores.utilizadores.length) || 0;
    document.getElementById('statTarefas').textContent = (tarefas.tarefas && tarefas.tarefas.length) || 0;
  } catch (e) {}
}

function modalConfirmar(titulo, mensagem, callback) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal-box">' +
    '<h3>' + titulo + '</h3>' +
    '<p>' + mensagem + '</p>' +
    '<button class="btn" id="modalConfirmar">✅ Confirmar</button>' +
    '<button class="btn negro" id="modalCancelar">❌ Cancelar</button>' +
    '</div>';
  document.body.appendChild(overlay);
  
  overlay.querySelector('#modalConfirmar').onclick = function() { 
    overlay.remove(); 
    if (callback) callback(); 
  };
  overlay.querySelector('#modalCancelar').onclick = function() { overlay.remove(); };
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
}

function mostrarToast(mensagem, tipo) {
  tipo = tipo || 'sucesso';
  var container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast ' + tipo;
  var icone = tipo === 'sucesso' ? '✅' : tipo === 'erro' ? '❌' : '⚠️';
  toast.textContent = icone + ' ' + mensagem;
  container.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3000);
}

// ========== APROVAÇÕES ==========
async function carregarAprovacoes() {
  var painel = document.getElementById('aprovacoes');
  painel.innerHTML = '<div class="skeleton" style="height:100px;"></div>';
  var res = await api.listarSubmissoesPendentes();
  
  if (res.erro) { painel.innerHTML = '<div class="status-bar erro">' + res.erro + '</div>'; return; }
  if (!res.submissoes || !res.submissoes.length) { 
    painel.innerHTML = '<div class="status-bar sucesso">✅ Nenhuma submissão pendente.</div>'; 
    return; 
  }
  
  var html = '<table class="tabela"><thead><tr><th>ID</th><th>Utilizador</th><th>Tarefa</th><th>Data</th><th>Link</th><th>Obs</th><th>Ações</th></tr></thead><tbody>';
  res.submissoes.forEach(function(s) {
    html += '<tr>' +
      '<td>#' + s.id + '</td>' +
      '<td>' + escapeHTML(s.nome) + '</td>' +
      '<td>' + escapeHTML(s.tarefa) + '</td>' +
      '<td>' + formatarData(s.data) + '</td>' +
      '<td><a href="' + escapeHTML(s.link) + '" target="_blank" style="color:var(--dourado);">🔗 Ver</a></td>' +
      '<td><small>' + escapeHTML(s.observacao || '-') + '</small></td>' +
      '<td class="acoes">' +
      '<button class="btn btn-sm btn-aprovar" data-id="' + s.id + '">✅</button>' +
      '<button class="btn btn-sm negro btn-rejeitar" data-id="' + s.id + '">❌</button>' +
      '</td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  painel.innerHTML = html;
  atualizarStats();
}

async function aprovarSubmissao(id) {
  var res = await api.aprovar(id);
  mostrarToast(res.erro || 'Submissão aprovada!', res.erro ? 'erro' : 'sucesso');
  carregarAprovacoes();
}

async function rejeitarSubmissao(id, motivo) {
  var res = await api.rejeitar(id, motivo);
  mostrarToast(res.erro || 'Submissão rejeitada.', res.erro ? 'erro' : 'aviso');
  carregarAprovacoes();
}

// ========== SAQUES ==========
async function carregarSaques() {
  var painel = document.getElementById('saques');
  painel.innerHTML = '<div class="skeleton" style="height:80px;"></div>';
  var res = await api.listarSaquesPendentes();
  
  if (res.erro) { painel.innerHTML = '<div class="status-bar erro">' + res.erro + '</div>'; return; }
  if (!res.saques || !res.saques.length) { 
    painel.innerHTML = '<div class="status-bar sucesso">✅ Nenhum saque pendente.</div>'; 
    return; 
  }
  
  var html = '<table class="tabela"><thead><tr><th>ID</th><th>Utilizador</th><th>Valor</th><th>Data</th><th>Ações</th></tr></thead><tbody>';
  res.saques.forEach(function(s) {
    html += '<tr>' +
      '<td>#' + s.id + '</td>' +
      '<td>' + escapeHTML(s.nome) + '</td>' +
      '<td>' + formatarMoeda(s.valor) + '</td>' +
      '<td>' + formatarData(s.data) + '</td>' +
      '<td class="acoes">' +
      '<button class="btn btn-sm btn-confirmar-saque" data-id="' + s.id + '">💸 Pagar</button>' +
      '<button class="btn btn-sm negro btn-rejeitar-saque" data-id="' + s.id + '">❌ Rejeitar</button>' +
      '</td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  painel.innerHTML = html;
}

async function confirmarPagamento(saqueId, comprovativoUrl) {
  var res = await api.confirmarPagamento(saqueId, comprovativoUrl);
  mostrarToast(res.erro || 'Pagamento confirmado!', res.erro ? 'erro' : 'sucesso');
  carregarSaques();
}

async function rejeitarSaque(saqueId, motivo) {
  var res = await api.rejeitarSaque(saqueId, motivo);
  mostrarToast(res.erro || 'Saque rejeitado!', res.erro ? 'erro' : 'aviso');
  carregarSaques();
}

// ========== TAREFAS ==========
async function carregarTarefasAdmin() {
  var painel = document.getElementById('tarefasAdmin');
  painel.innerHTML = '<div class="card-form">' +
    '<h3>📝 Criar Nova Tarefa</h3>' +
    '<input type="text" id="tituloTarefa" placeholder="Título da tarefa">' +
    '<textarea id="descricaoTarefa" placeholder="Descrição detalhada"></textarea>' +
    '<input type="number" id="valorTarefa" placeholder="Valor (Kz)">' +
    '<input type="text" id="tempoTarefa" placeholder="Tempo estimado (ex: 5 min)">' +
    '<select id="nivelTarefa">' +
    '<option value="">Nível (todos)</option>' +
    '<option value="Bronze">🥉 Bronze</option>' +
    '<option value="Prata">🥈 Prata</option>' +
    '<option value="Ouro">🥇 Ouro</option>' +
    '<option value="Platina">💎 Platina</option>' +
    '<option value="Diamante">💠 Diamante</option>' +
    '</select>' +
    '<button class="btn" id="btnCriarTarefa">➕ Criar Tarefa</button>' +
    '</div>' +
    '<div id="listaTarefasAdmin"></div>';
  await listarTarefasAdmin();
}

async function criarTarefa() {
  var titulo = document.getElementById('tituloTarefa').value.trim();
  var valor = document.getElementById('valorTarefa').value;
  if (!titulo || !valor) { mostrarToast('Preencha título e valor.', 'aviso'); return; }
  
  var dados = {
    titulo: titulo,
    descricao: document.getElementById('descricaoTarefa').value.trim(),
    valor: Number(valor),
    tempoEstimado: document.getElementById('tempoTarefa').value.trim(),
    nivel: document.getElementById('nivelTarefa').value
  };
  
  var res = await api.criarTarefa(dados);
  mostrarToast(res.erro || 'Tarefa criada!', res.erro ? 'erro' : 'sucesso');
  if (!res.erro) { carregarTarefasAdmin(); atualizarStats(); }
}

async function editarTarefaPrompt(id) {
  var res = await api.listarTarefas(0);
  var tarefa = null;
  if (res.tarefas) {
    for (var i = 0; i < res.tarefas.length; i++) {
      if (res.tarefas[i].id == id) { tarefa = res.tarefas[i]; break; }
    }
  }
  if (!tarefa) return;
  
  var novoTitulo = prompt('Novo título:', tarefa.titulo);
  if (novoTitulo === null) return;
  var novaDescricao = prompt('Nova descrição:', tarefa.descricao || '');
  if (novaDescricao === null) return;
  var novoValor = prompt('Novo valor (Kz):', tarefa.valor);
  if (novoValor === null) return;
  var novoTempo = prompt('Novo tempo estimado:', tarefa.tempoEstimado || '');
  if (novoTempo === null) return;
  
  var dados = {
    id: id,
    titulo: novoTitulo.trim(),
    descricao: novaDescricao.trim(),
    valor: Number(novoValor),
    tempoEstimado: novoTempo.trim(),
    nivel: tarefa.nivel
  };
  
  var resultado = await api.editarTarefa(dados);
  mostrarToast(resultado.erro || 'Tarefa atualizada!', resultado.erro ? 'erro' : 'sucesso');
  if (!resultado.erro) carregarTarefasAdmin();
}

async function eliminarTarefa(id) {
  var res = await api.editarTarefa({ id: id, acao: 'excluir' });
  mostrarToast(res.erro || 'Tarefa eliminada!', res.erro ? 'erro' : 'aviso');
  if (!res.erro) { carregarTarefasAdmin(); atualizarStats(); }
}

async function listarTarefasAdmin() {
  var container = document.getElementById('listaTarefasAdmin');
  var res = await api.listarTarefas(0);
  if (res.erro) { container.innerHTML = '<p class="erro">' + res.erro + '</p>'; return; }
  
  var html = '';
  res.tarefas.forEach(function(t) {
    html += '<div class="card-tarefa">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<strong>' + escapeHTML(t.titulo) + '</strong>' +
      '<span class="badge-status pendente">' + (t.nivel || 'Todos') + '</span>' +
      '</div>' +
      '<p>' + escapeHTML(t.descricao || '') + '</p>' +
      '<p class="valor">' + formatarMoeda(t.valor) + '</p>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<small>⏱️ ' + (t.tempoEstimado || 'N/D') + ' | ID: #' + t.id + '</small>' +
      '<span>' +
      '<button class="btn btn-sm btn-editar-tarefa" data-id="' + t.id + '">✏️</button>' +
      '<button class="btn btn-sm negro btn-eliminar-tarefa" data-id="' + t.id + '">🗑️</button>' +
      '</span>' +
      '</div>' +
      '</div>';
  });
  container.innerHTML = html;
}

// ========== UTILIZADORES ==========
async function carregarUtilizadores() {
  var painel = document.getElementById('utilizadores');
  painel.innerHTML = '<div class="skeleton" style="height:100px;"></div>';
  var res = await api.listarUtilizadores();
  
  if (res.erro) { painel.innerHTML = '<div class="status-bar erro">' + res.erro + '</div>'; return; }
  
  var html = '<table class="tabela"><thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>User</th><th>Tipo</th><th>Saldo</th><th>Ações</th></tr></thead><tbody>';
  res.utilizadores.forEach(function(u) {
    var tipoBadge = u.tipo === 'gestor' ? 'pago' : u.tipo === 'banido' ? 'rejeitada' : 'pendente';
    html += '<tr>' +
      '<td>#' + u.id + '</td>' +
      '<td>' + escapeHTML(u.nome) + '</td>' +
      '<td>' + escapeHTML(u.email || '-') + '</td>' +
      '<td>' + escapeHTML(u.user || '-') + '</td>' +
      '<td><span class="badge-status ' + tipoBadge + '">' + (u.tipo || 'participante') + '</span></td>' +
      '<td>' + formatarMoeda(u.saldo) + '</td>' +
      '<td class="acoes">' +
      '<button class="btn btn-sm" onclick="promoverUsuario(' + u.id + ')" title="Promover a Gestor">⭐</button>' +
      '<button class="btn btn-sm" onclick="redefinirSenhaPrompt(' + u.id + ')" title="Redefinir Senha">🔑</button>' +
      '<button class="btn btn-sm negro btn-banir-utilizador" data-id="' + u.id + '" title="Banir">🚫</button>' +
      '<button class="btn btn-sm negro btn-eliminar-utilizador" data-id="' + u.id + '" title="Eliminar">🗑️</button>' +
      '</td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  painel.innerHTML = html;
}

async function promoverUsuario(userId) {
  modalConfirmar('Promover Utilizador', 'Promover este utilizador a gestor?', async function() {
    var res = await api.redefinirSenha(userId, '', 'promover');
    mostrarToast(res.erro || 'Promovido a gestor!', res.erro ? 'erro' : 'sucesso');
    if (!res.erro) carregarUtilizadores();
  });
}

async function redefinirSenhaPrompt(userId) {
  var nova = prompt('Nova senha:');
  if (!nova) return;
  if (nova.length < 4) { mostrarToast('Mínimo 4 caracteres.', 'aviso'); return; }
  var res = await api.redefinirSenha(userId, nova);
  mostrarToast(res.erro || 'Senha redefinida!', res.erro ? 'erro' : 'sucesso');
}

async function eliminarUtilizador(userId) {
  var res = await api.eliminarUtilizador(userId);
  mostrarToast(res.erro || 'Utilizador eliminado!', res.erro ? 'erro' : 'sucesso');
  if (!res.erro) { carregarUtilizadores(); atualizarStats(); }
}

async function banirUtilizador(userId) {
  var res = await api.banirUtilizador(userId);
  mostrarToast(res.erro || 'Utilizador banido!', res.erro ? 'erro' : 'aviso');
  if (!res.erro) carregarUtilizadores();
}

// ========== NÍVEIS ==========
function carregarNiveis() {
  document.getElementById('niveis').innerHTML = '<div class="card-form">' +
    '<h3>📊 Pontos para cada nível</h3>' +
    '<div class="config-grid">' +
    '<div class="config-item"><label>🥉 Bronze</label><input type="number" id="ptsBronze" value="1000"></div>' +
    '<div class="config-item"><label>🥈 Prata</label><input type="number" id="ptsPrata" value="5000"></div>' +
    '<div class="config-item"><label>🥇 Ouro</label><input type="number" id="ptsOuro" value="15000"></div>' +
    '<div class="config-item"><label>💎 Platina</label><input type="number" id="ptsPlatina" value="50000"></div>' +
    '<div class="config-item"><label>💠 Diamante</label><input type="number" id="ptsDiamante" value="100000"></div>' +
    '</div>' +
    '<button class="btn" id="btnSalvarNiveis" style="margin-top:15px;">💾 Salvar Níveis</button>' +
    '</div>';
}

async function salvarNiveis() {
  var dados = { niveis: {
    bronze: document.getElementById('ptsBronze').value,
    prata: document.getElementById('ptsPrata').value,
    ouro: document.getElementById('ptsOuro').value,
    platina: document.getElementById('ptsPlatina').value,
    diamante: document.getElementById('ptsDiamante').value
  }};
  var res = await api.configSistema(dados);
  mostrarToast(res.erro || 'Níveis salvos!', res.erro ? 'erro' : 'sucesso');
}

// ========== CONFIGURAÇÕES ==========
function carregarConfig() {
  document.getElementById('config').innerHTML = '<div class="card-form">' +
    '<h3>⚙️ Configurações Gerais</h3>' +
    '<div class="config-grid">' +
    '<div class="config-item"><label>📱 WhatsApp</label><input type="text" id="whatsapp" placeholder="9944669"></div>' +
    '<div class="config-item"><label>📧 Email Suporte</label><input type="text" id="emailSuporte" placeholder="suporte@ngtrafego.com"></div>' +
    '<div class="config-item"><label>🔧 Modo Manutenção</label><select id="manutencao"><option value="0">🟢 Online</option><option value="1">🔴 Manutenção</option></select></div>' +
    '</div>' +
    '<button class="btn" id="btnSalvarConfig">💾 Salvar Configurações</button>' +
    '</div>';
}

async function salvarConfig() {
  var dados = {
    whatsapp: document.getElementById('whatsapp').value.trim(),
    emailSuporte: document.getElementById('emailSuporte').value.trim(),
    manutencao: document.getElementById('manutencao').value
  };
  var res = await api.configSistema(dados);
  mostrarToast(res.erro || 'Configurações salvas!', res.erro ? 'erro' : 'sucesso');
}

// ========== PÁGINAS DINÂMICAS ==========
async function carregarPaginas() {
  var painel = document.getElementById('paginas');
  painel.innerHTML = '<button class="btn" id="btnNovaPagina" style="margin-bottom:15px;">📄 + Nova Página</button>' +
    '<div id="listaPaginas" class="lista-paginas"><div class="skeleton" style="height:60px;"></div></div>';
  
  var res = await api.listarPaginas();
  var container = document.getElementById('listaPaginas');
  
  if (res.erro) { container.innerHTML = '<div class="status-bar erro">' + res.erro + '</div>'; return; }
  if (!res.paginas || !res.paginas.length) { 
    container.innerHTML = '<p style="color:var(--texto-terciario);text-align:center;">📭 Nenhuma página criada.</p>'; 
    return; 
  }
  
  var html = '';
  res.paginas.forEach(function(p) {
    html += '<div class="pagina-item">' +
      '<span class="titulo">📄 ' + escapeHTML(p.titulo) + '</span>' +
      '<span class="acoes">' +
      '<button class="btn btn-sm btn-editar-pagina" data-id="' + p.id + '">✏️</button>' +
      '<button class="btn btn-sm negro btn-eliminar-pagina" data-id="' + p.id + '">🗑️</button>' +
      '</span>' +
      '</div>';
  });
  container.innerHTML = html;
}

async function criarNovaPagina() {
  var titulo = prompt('📄 Título da página:');
  if (!titulo || !titulo.trim()) return;
  var conteudo = prompt('📝 Conteúdo HTML:');
  var res = await api.criarPagina({ titulo: titulo.trim(), conteudo: conteudo || '' });
  mostrarToast(res.erro || 'Página criada!', res.erro ? 'erro' : 'sucesso');
  if (!res.erro) carregarPaginas();
}

async function editarPagina(id) {
  var res = await api.listarPaginas();
  var pagina = null;
  if (res.paginas) {
    for (var i = 0; i < res.paginas.length; i++) {
      if (res.paginas[i].id == id) { pagina = res.paginas[i]; break; }
    }
  }
  if (!pagina) return;
  
  var novoTitulo = prompt('Novo título:', pagina.titulo);
  if (novoTitulo === null) return;
  var novoConteudo = prompt('Novo conteúdo:', pagina.conteudo || '');
  if (novoConteudo === null) return;
  
  var dados = { id: id };
  if (novoTitulo.trim()) dados.titulo = novoTitulo.trim();
  if (novoConteudo.trim()) dados.conteudo = novoConteudo.trim();
  
  var resultado = await api.editarPagina(dados);
  mostrarToast(resultado.erro || 'Página atualizada!', resultado.erro ? 'erro' : 'sucesso');
  if (!resultado.erro) carregarPaginas();
}

async function eliminarPagina(id) {
  var res = await api.editarPagina({ id: id, acao: 'excluir' });
  mostrarToast(res.erro || 'Página eliminada.', res.erro ? 'erro' : 'aviso');
  if (!res.erro) carregarPaginas();
}

// ========== GESTORES ==========
async function carregarGestores() {
  var painel = document.getElementById('gestores');
  var res = await api.listarUtilizadores();
  if (res.erro) { painel.innerHTML = '<div class="status-bar erro">' + res.erro + '</div>'; return; }
  
  var gestores = [];
  if (res.utilizadores) {
    for (var i = 0; i < res.utilizadores.length; i++) {
      if (res.utilizadores[i].tipo === 'gestor') gestores.push(res.utilizadores[i]);
    }
  }
  if (!gestores.length) { 
    painel.innerHTML = '<p style="color:var(--texto-terciario);">Nenhum gestor além de você.</p>'; 
    return; 
  }
  
  var html = '<table class="tabela"><thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>Saldo</th></tr></thead><tbody>';
  gestores.forEach(function(g) {
    html += '<tr>' +
      '<td>#' + g.id + '</td>' +
      '<td>🛡️ ' + escapeHTML(g.nome) + '</td>' +
      '<td>' + escapeHTML(g.email) + '</td>' +
      '<td>' + formatarMoeda(g.saldo) + '</td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  painel.innerHTML = html;
}

// ========== MENSAGENS ==========
function carregarMensagens() {
  document.getElementById('mensagens').innerHTML = '<div class="card-form">' +
    '<h3>✉️ Enviar Mensagem</h3>' +
    '<p style="color:var(--texto-terciario);margin-bottom:15px;">Funcionalidade disponível em breve.</p>' +
    '<input type="text" placeholder="Destinatário" disabled>' +
    '<textarea placeholder="Mensagem..." disabled></textarea>' +
    '<button class="btn" disabled>📨 Enviar</button>' +
    '</div>';
}

// =============================================
// 🤖 BOTS COM NOMES REAIS - 4 PAÍSES
// =============================================

var NOMES_ANGOLA_PRIMEIROS = [
  'Adilson', 'Amélia', 'António', 'Beatriz', 'Carlos', 'Cátia', 'Daniel', 'Djamila',
  'Edgar', 'Eliane', 'Fernando', 'Filomena', 'Gabriel', 'Graciete', 'Hamilton', 'Helena',
  'Ildo', 'Isabel', 'João', 'Josefina', 'Kelson', 'Laurinda', 'Leonardo', 'Lúcia',
  'Manuel', 'Margarida', 'Mateus', 'Natália', 'Nelson', 'Odete', 'Paulo', 'Quitéria',
  'Rafael', 'Roberta', 'Samuel', 'Sofia', 'Tiago', 'Valéria', 'Victor', 'Yolanda',
  'Walter', 'Xandra', 'Zeca', 'Vera', 'Ulisses', 'Tânia', 'Sérgio', 'Rita',
  'Pedro', 'Olga', 'Mauro', 'Carla', 'Jacinto', 'Luzia', 'Fausto', 'Dulce',
  'Hélder', 'Iracema', 'Geraldo', 'Mónica'
];

var NOMES_ANGOLA_APELIDOS = [
  'Manuel', 'Kiesse', 'Nogueira', 'Cassule', 'Benguela', 'Mussolo', 'Chivukuvuku', 'António',
  'Cuanza', 'Ndonge', 'Huambo', 'Zango', 'Cabinda', 'Lunda', 'Dikota', 'Quiçama',
  'Chipindo', 'Malanje', 'Cazenga', 'Cunene', 'Namibe', 'Huíla', 'Saurimo', 'Menongue',
  'Uíge', 'Bié', 'Lubango', 'Soyo', 'Bengo', 'Kwanza', 'Dande', 'Zaire',
  'Moxico', 'Lwena', 'Cuando', 'Cubango', 'Maianga', 'Cacuaco', 'Sumbe', 'Ndalatando',
  'Cuito', 'Lobito', 'Moçâmedes', 'Chibia', 'Ondjiva', 'Caluquembe', 'Gabela', 'Cassongue',
  'Catumbela', 'Balombo', 'Talatona', 'Cazombo', 'Luena', 'Samba', 'Ganda', 'Tômbwa'
];

var NOMES_BRASIL_PRIMEIROS = [
  'Ana Beatriz', 'Bruno César', 'Camila', 'Diego Henrique', 'Eduarda', 'Fábio',
  'Gabriela', 'Henrique', 'Isabela Cristina', 'João Victor', 'Karina', 'Lucas Matheus',
  'Mariana', 'Nicolas', 'Patrícia', 'Rafael', 'Sabrina', 'Thiago Augusto',
  'Vanessa', 'William', 'Yasmin', 'Anderson', 'Larissa', 'Marcelo',
  'Natália', 'Gustavo Henrique', 'Priscila', 'Renato', 'Sandra', 'Vinícius',
  'Tatiane', 'Wesley', 'Aline', 'Ricardo', 'Bianca', 'Leandro',
  'Carolina', 'Eduardo', 'Fernanda', 'Rodrigo', 'Juliana', 'Alexandre',
  'Leticia', 'Roberto', 'Daniela', 'Marcos', 'Teresa', 'Francisco',
  'Cecília', 'Antônio', 'Lorena', 'Raimundo', 'Clara', 'Severino'
];

var NOMES_BRASIL_APELIDOS = [
  'Silva', 'Oliveira', 'dos Santos', 'Costa', 'Souza Lima', 'Pereira',
  'Martins Ferreira', 'Alves Carvalho', 'Rocha', 'Almeida', 'Ribeiro Nunes', 'Barbosa',
  'Castro Araújo', 'Freitas Gomes', 'Duarte Vieira', 'Monteiro Campos',
  'Farias Correia', 'Pinto', 'Lopes Teixeira', 'Cardoso Moraes',
  'Borges Machado', 'Neves Batista', 'Peixoto Guimarães', 'Tavares Reis',
  'Barreto Andrade', 'Dias', 'Moreira', 'Nascimento', 'Azevedo', 'Melo',
  'Cavalcanti', 'Pires', 'Coelho', 'Siqueira', 'Xavier', 'Macedo',
  'Figueiredo', 'Miranda', 'Camargo', 'Batista', 'Ramos', 'Rezende'
];

var NOMES_STP_PRIMEIROS = [
  'Alcino', 'Alda', 'Anselmo', 'Celeste', 'Damião', 'Elsa',
  'Euclides', 'Fátima', 'Gualdino', 'Hélio', 'Inocência', 'Jerónimo',
  'Lúcio', 'Mafalda', 'Nataniel', 'Odete', 'Pascoal', 'Quirino',
  'Raul', 'Sandra', 'Telma', 'Valdemiro', 'Xavier', 'Zuleica',
  'Armando', 'Benvinda', 'Crispim', 'Delfina', 'Evaristo', 'Florinda',
  'Gaspar', 'Hermínia', 'Ilídio', 'Josefa', 'Leonel', 'Marcelina'
];

var NOMES_STP_APELIDOS = [
  'Espírito Santo', 'Bandeira', 'Vaz', 'Neto', 'Trindade', 'Tiny',
  'da Graça', 'Vila Nova', 'do Espírito Santo', 'Varela', 'Mata', 'Costa Alegre',
  'Pires', 'da Lomba', 'Cravid', 'Semedo', 'da Conceição', 'Neto',
  'Cravid', 'Dias', 'Bonfim', 'Pina', 'Menezes', 'da Mata',
  'Sousa', 'Amado', 'Rodrigues', 'Fernandes', 'Lopes', 'Monteiro',
  'Gomes', 'Soares', 'Tavares', 'Andrade', 'Barros', 'Nunes'
];

var NOMES_MOCAMBIQUE_PRIMEIROS = [
  'Alberto', 'Benigna', 'Celso', 'Dalila', 'Edson', 'Felisberta',
  'Gonçalves', 'Hermínia', 'Ismael', 'Júlia', 'Kátia', 'Leonardo',
  'Márcia', 'Nélson', 'Olinda', 'Paulino', 'Quitéria', 'Rosália',
  'Suleimane', 'Teresa', 'Ussene', 'Vânia', 'Wilfredo', 'Xavier',
  'Yolanda', 'Zacarias', 'Armando', 'Berta', 'Carlitos', 'Delfina',
  'Eusébio', 'Flora', 'Guilherme', 'Helena', 'Ivan', 'Joana',
  'Lourenço', 'Madalena', 'Nadir', 'Orlando', 'Preciosa', 'Rui'
];

var NOMES_MOCAMBIQUE_APELIDOS = [
  'Chissano', 'Zimba', 'Mutadi', 'Macuácua', 'Macamo', 'Mondlane',
  'Mabota', 'Cumbane', 'Nhantumbo', 'Muthemba', 'Nhavoto', 'Chavane',
  'Matsinhe', 'Saúte', 'Muianga', 'Uamba', 'Guivala', 'Cuna',
  'Mbalate', 'Muando', 'Issa', 'Chibalo', 'Langa', 'Zavala',
  'Matusse', 'Zimba', 'Guebuza', 'Nhampossa', 'Muchanga', 'Sitoe',
  'Tembe', 'Manhiça', 'Cuamba', 'Maputo', 'Beira', 'Nampula',
  'Quelimane', 'Tete', 'Lichinga', 'Xai-Xai', 'Inhambane', 'Pemba'
];

var EMOJIS_BOTS = [
  '👨‍💻', '👩‍💻', '🧑‍🔬', '👨‍🎨', '👩‍🏫', '🧑‍💼', '👨‍🔧', '👩‍⚕️',
  '🧑‍🌾', '👨‍🍳', '👩‍🚀', '🧑‍🚒', '👨‍🎤', '👩‍🎓', '🧑‍🏭', '👨‍⚖️',
  '👩‍✈️', '🧑‍🔧', '👨‍💼', '👩‍🔬', '🧑‍🎨', '👨‍🏫', '👩‍💻', '🧑‍🍳'
];

function embaralharArray(arr) {
  var novo = arr.slice();
  for (var i = novo.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = novo[i];
    novo[i] = novo[j];
    novo[j] = temp;
  }
  return novo;
}

function gerarNomesCombinados(quantidade) {
  var todosPrimeiros = NOMES_ANGOLA_PRIMEIROS.concat(NOMES_BRASIL_PRIMEIROS, NOMES_STP_PRIMEIROS, NOMES_MOCAMBIQUE_PRIMEIROS);
  var todosApelidos = NOMES_ANGOLA_APELIDOS.concat(NOMES_BRASIL_APELIDOS, NOMES_STP_APELIDOS, NOMES_MOCAMBIQUE_APELIDOS);
  
  var primeiros = embaralharArray(todosPrimeiros);
  var apelidos = embaralharArray(todosApelidos);
  
  var nomesGerados = [];
  var usados = {};
  var tentativas = 0;
  var maxTentativas = quantidade * 10;
  
  while (nomesGerados.length < quantidade && tentativas < maxTentativas) {
    var p = primeiros[Math.floor(Math.random() * primeiros.length)];
    var a = apelidos[Math.floor(Math.random() * apelidos.length)];
    var nomeCompleto = p + ' ' + a;
    
    if (!usados[nomeCompleto]) {
      usados[nomeCompleto] = true;
      nomesGerados.push(nomeCompleto);
    }
    tentativas++;
  }
  
  if (nomesGerados.length < quantidade) {
    for (var i = 0; i < primeiros.length && nomesGerados.length < quantidade; i++) {
      for (var j = 0; j < apelidos.length && nomesGerados.length < quantidade; j++) {
        var nomeForcado = primeiros[i] + ' ' + apelidos[j];
        if (!usados[nomeForcado]) {
          usados[nomeForcado] = true;
          nomesGerados.push(nomeForcado);
        }
      }
    }
  }
  
  return embaralharArray(nomesGerados);
}

function carregarBotsPainel() {
  var painel = document.getElementById('bots');
  painel.innerHTML = '<div class="card-form">' +
    '<h3>🤖 Gerar Bots com Nomes Reais</h3>' +
    '<p style="color:var(--texto-secundario);font-size:0.85em;margin-bottom:15px;">' +
    '🇦🇴 Angola • 🇧🇷 Brasil • 🇸🇹 São Tomé • 🇲🇿 Moçambique</p>' +
    '<div class="config-grid">' +
    '<div class="config-item"><label>👥 Quantidade de Bots</label><input type="number" id="quantidadeBots" value="50" min="1" max="500"></div>' +
    '<div class="config-item"><label>💰 Ponto Máximo (Kz)</label><input type="number" id="pontoMaximoBots" value="50000" min="100" step="100"></div>' +
    '<div class="config-item"><label>🏆 Bots no Topo (1º lugar)</label><input type="number" id="botsNoTopo" value="5" min="1" max="50"></div>' +
    '<div class="config-item"><label>📊 Bots Intermediários</label><input type="number" id="botsMedianos" value="15" min="0" max="100"></div>' +
    '</div>' +
    '<p style="color:var(--texto-secundario);font-size:0.85em;margin:10px 0;">' +
    '🎯 <b>Topo:</b> 80-100% do máximo (podem ficar em 1º)<br>' +
    '📊 <b>Intermediários:</b> 20-80% do máximo<br>' +
    '📉 <b>Restantes:</b> 1-40% do máximo</p>' +
    '<button class="btn" id="btnGerarBots" style="width:100%;padding:14px;font-size:1.1em;">🤖 Gerar Bots</button>' +
    '<button class="btn negro" id="btnLimparTodosBots" style="width:100%;margin-top:8px;">🗑️ Eliminar Todos os Bots</button>' +
    '<p id="statusBots" style="margin-top:12px;text-align:center;"></p>' +
    '</div>' +
    '<div id="listaBotsGerados" style="margin-top:20px;"></div>';
}

async function gerarBotsConfigurados() {
  var quantidade = parseInt(document.getElementById('quantidadeBots').value) || 50;
  var pontoMaximo = parseInt(document.getElementById('pontoMaximoBots').value) || 50000;
  var botsNoTopo = parseInt(document.getElementById('botsNoTopo').value) || 5;
  var botsMedianos = parseInt(document.getElementById('botsMedianos').value) || 15;
  
  if (quantidade < 1 || quantidade > 500) { mostrarToast('Quantidade: 1-500.', 'aviso'); return; }
  if (botsNoTopo + botsMedianos > quantidade) { mostrarToast('Topo + Intermediários excede o total.', 'erro'); return; }
  
  var btn = document.getElementById('btnGerarBots');
  var status = document.getElementById('statusBots');
  btn.disabled = true;
  btn.textContent = '⏳ Gerando...';
  status.innerHTML = '<p style="color:var(--dourado);">🤖 Criando bots com nomes de Angola, Brasil, STP e Moçambique...</p>';
  
  try {
    var nomesGerados = gerarNomesCombinados(quantidade);
    
    var res = await api.gerarBotsPersonalizados({
      quantidade: quantidade,
      pontoMaximo: pontoMaximo,
      botsNoTopo: botsNoTopo,
      botsMedianos: botsMedianos,
      nomes: JSON.stringify(nomesGerados),
      emojis: JSON.stringify(EMOJIS_BOTS)
    });
    
    if (res.erro) {
      status.innerHTML = '<p class="erro">' + res.erro + '</p>';
      mostrarToast(res.erro, 'erro');
    } else {
      status.innerHTML = '<p class="sucesso">✅ ' + (res.mensagem || 'Bots gerados!') + '</p>';
      mostrarToast(res.mensagem || 'Bots gerados!', 'sucesso');
      if (res.bots) exibirBotsGerados(res.bots);
      atualizarStats();
    }
  } catch (e) {
    status.innerHTML = '<p class="erro">Erro: ' + e.message + '</p>';
    mostrarToast('Erro ao gerar bots.', 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = '🤖 Gerar Bots';
  }
}

function exibirBotsGerados(bots) {
  var container = document.getElementById('listaBotsGerados');
  if (!container) return;
  
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
    '<h4 style="color:var(--dourado);margin:0;">📋 Bots Gerados (' + bots.length + ')</h4>' +
    '<button class="btn btn-sm negro btn-limpar-bots" style="font-size:0.75em;">🗑️ Limpar Lista</button>' +
    '</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;max-height:400px;overflow-y:auto;">';
  
  var limite = Math.min(bots.length, 30);
  for (var i = 0; i < limite; i++) {
    var bot = bots[i];
    html += '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;position:relative;">' +
      '<span style="font-size:1.4em;">' + escapeHTML(bot.emoji || '👤') + '</span>' +
      '<div style="flex:1;">' +
      '<span style="color:var(--dourado);font-size:0.9em;">' + escapeHTML(bot.nome) + '</span>' +
      '<br><small style="color:var(--texto-terciario);">' + formatarMoeda(bot.pontos) + '</small>' +
      '</div>' +
      '<button class="btn btn-sm negro btn-eliminar-bot" data-id="' + bot.id + '" style="font-size:0.7em;padding:3px 6px;" title="Eliminar bot">🗑️</button>' +
      '</div>';
  }
  
  if (bots.length > 30) {
    html += '<p style="color:var(--texto-terciario);text-align:center;margin-top:8px;">... e mais ' + (bots.length - 30) + ' bots</p>';
  }
  
  html += '</div>';
  container.innerHTML = html;
}

async function eliminarBot(userId) {
  var res = await api.eliminarUtilizador(userId);
  mostrarToast(res.erro || 'Bot eliminado!', res.erro ? 'erro' : 'sucesso');
  if (!res.erro) atualizarStats();
}

async function limparTodosBots() {
  var res = await api.limparBots();
  mostrarToast(res.erro || res.mensagem || 'Todos os bots foram eliminados!', res.erro ? 'erro' : 'sucesso');
  if (!res.erro) {
    document.getElementById('listaBotsGerados').innerHTML = '';
    atualizarStats();
  }
}

// ========== PÓDIO ==========
async function gerarPodio() {
  var res = await api.gerarPodio();
  if (res.podio) {
    sessionStorage.setItem('podioData', JSON.stringify(res.podio));
    mostrarToast('Pódio gerado! Abrindo...', 'sucesso');
    setTimeout(function() { window.open('podio.html', '_blank'); }, 500);
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
window.eliminarUtilizador = eliminarUtilizador;
window.banirUtilizador = banirUtilizador;
window.eliminarBot = eliminarBot;
window.limparTodosBots = limparTodosBots;
