// =============================================
// 🛡️ NG TAREFAS - PAINEL DO GESTOR (COM PRAZO NAS TAREFAS)
// =============================================

let usuarioGestor = null;

document.addEventListener('DOMContentLoaded', () => {
  const usuario = verificarGestor();
  if (!usuario) return;
  usuarioGestor = usuario;
  preencherCabecalhoGestor(usuario);
  configurarAbas();
  configurarSubAbas();
  configurarDelegacaoDeEventos();
  carregarAnunciosGestor();
  document.querySelector('#abasAdmin button[data-aba="aprovacoes"]')?.click();
});

// ========== CABEÇALHO (PREENCHER EXISTENTE) ==========
function preencherCabecalhoGestor(usuario) {
  document.getElementById('nomeGestor').textContent = usuario.nome || usuario.user;
  document.getElementById('idGestor').textContent = `ID: #${usuario.id}`;
  atualizarResumoGeral();
}

async function atualizarResumoGeral() {
  try {
    const [submissoes, utilizadores] = await Promise.all([
      api.listarSubmissoesPendentes(),
      api.listarUtilizadores('todos')
    ]);
    document.getElementById('pendentesAprovacao').textContent = submissoes.submissoes?.length || 0;
    const humanos = utilizadores.utilizadores?.filter(u => u.tipo !== 'bot') || [];
    const bots = utilizadores.utilizadores?.filter(u => u.tipo === 'bot') || [];
    document.getElementById('totalHumanos').textContent = humanos.length;
    document.getElementById('totalBots').textContent = bots.length;
    document.getElementById('saquesPendentes').textContent = '?';
  } catch (e) {}
}

// ========== NAVEGAÇÃO POR ABAS ==========
function configurarAbas() {
  const botoes = document.querySelectorAll('#abasAdmin button[data-aba]');
  const paineis = document.querySelectorAll('.aba-painel');
  botoes.forEach(btn => {
    btn.addEventListener('click', () => {
      botoes.forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      const aba = btn.dataset.aba;
      paineis.forEach(p => p.classList.add('oculto'));
      document.getElementById(aba)?.classList.remove('oculto');
      carregarAba(aba);
    });
  });
}

function carregarAba(aba) {
  switch (aba) {
    case 'aprovacoes': carregarAprovacoes(); break;
    case 'saques': carregarSaques(); break;
    case 'tarefasAdmin': carregarTarefasAdmin(); break;
    case 'especiaisAdmin': carregarEspeciaisAdmin(); break;
    case 'utilizadores': carregarUtilizadores(); break;
    case 'bots': carregarBotsPainel(); break;
    case 'anuncios': carregarAnunciosAdmin(); break;
    case 'dicasAdmin': carregarDicasAdmin(); break;
    case 'paginas': carregarPaginasAdmin(); break;
    case 'config': carregarConfig(); break;
    case 'chatAdmin': carregarChatAdmin(); break;
  }
}

// ========== SUB-ABAS GENÉRICAS ==========
function configurarSubAbas() {
  document.querySelectorAll('.sub-abas').forEach(container => {
    container.querySelectorAll('button[data-subaba]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('button').forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        const subaba = btn.dataset.subaba;
        const parent = container.parentElement;
        parent.querySelectorAll('.subaba-painel').forEach(p => p.classList.add('oculto'));
        const painel = parent.querySelector(`#sub${subaba.charAt(0).toUpperCase() + subaba.slice(1)}`) ||
                       parent.querySelector(`#${subaba}`);
        painel?.classList.remove('oculto');
        switch (subaba) {
          case 'appsModeracao': carregarModeracaoAplicativos(); break;
          case 'regrasEditor': carregarEditorRegras(); break;
          case 'ajudaEditor': carregarEditorAjuda(); break;
          case 'reclamacoesAdmin': carregarReclamacoesAdmin(); break;
          case 'humanos': carregarListaHumanos(); break;
          case 'botsAdmin': carregarListaBots(); break;
        }
      });
    });
  });
}

// ========== DELEGAÇÃO DE EVENTOS ==========
function configurarDelegacaoDeEventos() {
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('btn-aprovar')) aprovarSubmissao(target.dataset.id);
    if (target.classList.contains('btn-rejeitar')) rejeitarSubmissao(target.dataset.id);
    if (target.classList.contains('btn-confirmar-saque')) confirmarPagamento(target.dataset.id);
    if (target.classList.contains('btn-aprovar-especial')) aprovarTarefaEspecial(target.dataset.id);
    if (target.id === 'btnSalvarRegras') salvarConteudoDica('regras');
    if (target.id === 'btnSalvarAjuda') salvarConteudoDica('ajuda');
  });

  document.getElementById('btnExportarRelatorio')?.addEventListener('click', gerarRelatorioUtilizadores);
}

// ========== APROVAÇÕES ==========
async function carregarAprovacoes() {
  const container = document.getElementById('listaAprovacoes');
  container.innerHTML = '<div class="skeleton" style="height:80px;"></div>';
  const res = await api.listarSubmissoesPendentes();
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  if (!res.submissoes?.length) {
    container.innerHTML = '<p style="color:var(--sucesso);">✅ Nenhuma submissão pendente.</p>';
    return;
  }
  container.innerHTML = `
    <table class="tabela">
      <thead><tr><th>ID</th><th>Utilizador</th><th>Tarefa</th><th>Data</th><th>Link/Img</th><th>Ações</th></tr></thead>
      <tbody>${res.submissoes.map(s => `
        <tr>
          <td>#${s.id}</td><td>${escapeHTML(s.nome)}</td><td>${escapeHTML(s.tarefa)}</td>
          <td>${formatarData(s.data)}</td>
          <td>${s.link ? `<a href="${escapeHTML(s.link)}" target="_blank">🔗</a>` : ''} ${s.imagem ? `<a href="${escapeHTML(s.imagem)}" target="_blank">🖼️</a>` : ''}</td>
          <td><button class="btn btn-sm btn-aprovar" data-id="${s.id}">✅</button> <button class="btn btn-sm negro btn-rejeitar" data-id="${s.id}">❌</button></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  atualizarResumoGeral();
}

async function aprovarSubmissao(id) {
  const res = await api.aprovar(id);
  mostrarToast(res.erro || 'Aprovada!', res.erro ? 'erro' : 'sucesso');
  carregarAprovacoes();
}

async function rejeitarSubmissao(id) {
  const motivo = prompt('Motivo da rejeição (opcional):');
  const res = await api.rejeitar(id, motivo || '');
  mostrarToast(res.erro || 'Rejeitada.', res.erro ? 'erro' : 'aviso');
  carregarAprovacoes();
}

// ========== SAQUES ==========
async function carregarSaques() {
  const container = document.getElementById('listaSaques');
  container.innerHTML = '<p>Carregando...</p>';
  const res = await api.listarSaquesPendentes();
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  if (!res.saques?.length) {
    container.innerHTML = '<p style="color:var(--sucesso);">✅ Nenhum saque pendente.</p>';
    document.getElementById('saquesPendentes').textContent = '0';
    return;
  }
  document.getElementById('saquesPendentes').textContent = res.saques.length;
  container.innerHTML = `
    <table class="tabela">
      <thead><tr><th>ID</th><th>Utilizador</th><th>Valor</th><th>Método</th><th>Data</th><th>Ações</th></tr></thead>
      <tbody>${res.saques.map(s => `
        <tr>
          <td>#${s.id}</td><td>${escapeHTML(s.nome)}</td><td>${formatarMoeda(s.valor)}</td>
          <td>${escapeHTML(s.metodo)}</td><td>${formatarData(s.data)}</td>
          <td><button class="btn btn-sm btn-confirmar-saque" data-id="${s.id}">💸 Pagar</button></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

async function confirmarPagamento(saqueId) {
  const comprovativo = prompt('Link ou mensagem do comprovativo:');
  if (!comprovativo) return;
  const res = await api.confirmarPagamento(saqueId, comprovativo);
  mostrarToast(res.erro || 'Pagamento confirmado!', res.erro ? 'erro' : 'sucesso');
  carregarSaques();
}

// ========== TAREFAS (CRUD COM PRAZO) ==========
function carregarTarefasAdmin() {
  document.getElementById('formTarefaContainer')?.classList.remove('oculto');
  listarTarefasAdmin();
  document.getElementById('btnNovaTarefa')?.addEventListener('click', () => {
    document.getElementById('formTarefaContainer').classList.remove('oculto');
    document.getElementById('formTarefa').reset();
    document.getElementById('tarefaIdEdit').value = '';
    document.getElementById('tituloFormTarefa').textContent = 'Nova Tarefa';
  });
  document.getElementById('formTarefa').onsubmit = async (e) => {
    e.preventDefault();
    await salvarTarefa();
  };
}

async function salvarTarefa() {
  const id = document.getElementById('tarefaIdEdit').value;
  const titulo = document.getElementById('tarefaTitulo').value.trim();
  const valor = document.getElementById('tarefaValor').value;
  if (!titulo || !valor) { mostrarToast('Preencha título e valor.', 'aviso'); return; }
  const dados = {
    id: id || undefined,
    titulo,
    descricao: document.getElementById('tarefaDescricao').value.trim(),
    valor: Number(valor),
    nivel: document.getElementById('tarefaNivel').value,
    tempoEstimado: document.getElementById('tarefaTempo').value.trim()
  };

  // 📅 NOVO: campo prazo
  const prazo = document.getElementById('tarefaPrazo')?.value;
  if (prazo) {
    dados.prazo = new Date(prazo).toISOString();
  }

  const imagemFile = document.getElementById('tarefaImagem').files[0];
  if (imagemFile) {
    if (imagemFile.size > 5*1024*1024) { mostrarToast('Imagem máxima 5MB.', 'erro'); return; }
    dados.imagem = await lerArquivoBase64(imagemFile);
  }
  const criarAnuncio = document.getElementById('criarAnuncioTarefa').checked;
  const res = id ? await api.editarTarefa(dados) : await api.criarTarefa(dados);
  if (res.erro) { mostrarToast(res.erro, 'erro'); return; }
  mostrarToast('Tarefa salva!', 'sucesso');
  if (criarAnuncio) {
    await api.criarAnuncio({ texto: `📢 Nova tarefa: ${titulo}`, link: `/pages/participante.html`, ativo: 1, ordem: 0 });
    mostrarToast('Anúncio automático criado.', 'info');
    carregarAnunciosGestor();
  }
  document.getElementById('formTarefaContainer').classList.add('oculto');
  document.getElementById('formTarefa').reset();
  listarTarefasAdmin();
  atualizarResumoGeral();
}

async function listarTarefasAdmin() {
  const container = document.getElementById('listaTarefasAdmin');
  const res = await api.listarTarefas(0);
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.tarefas.map(t => `
    <div class="card-tarefa" style="margin-bottom:10px;">
      <strong>${escapeHTML(t.titulo)}</strong> <span>${formatarMoeda(t.valor)}</span>
      <small>${t.nivel || 'Todos'} | ${t.tempoEstimado || 'N/D'} ${t.prazo ? '| 📅 ' + formatarData(t.prazo) : ''}</small>
      <div><button class="btn btn-sm" onclick="editarTarefaPrompt('${t.id}')">✏️</button> <button class="btn btn-sm negro" onclick="eliminarTarefa('${t.id}')">🗑️</button></div>
    </div>`).join('');
}

function editarTarefaPrompt(id) {
  const tarefa = tarefasCacheGlobal?.find(t => t.id == id);
  if (!tarefa) return mostrarToast('Tarefa não encontrada.', 'erro');
  document.getElementById('formTarefaContainer').classList.remove('oculto');
  document.getElementById('tarefaIdEdit').value = tarefa.id;
  document.getElementById('tarefaTitulo').value = tarefa.titulo || '';
  document.getElementById('tarefaDescricao').value = tarefa.descricao || '';
  document.getElementById('tarefaValor').value = tarefa.valor || 0;
  document.getElementById('tarefaNivel').value = tarefa.nivel || 'Todos';
  document.getElementById('tarefaTempo').value = tarefa.tempoEstimado || '';
  // 📅 Preencher prazo no formato datetime-local
  if (tarefa.prazo && document.getElementById('tarefaPrazo')) {
    const data = new Date(tarefa.prazo);
    const offset = data.getTimezoneOffset();
    const local = new Date(data.getTime() - offset * 60000);
    document.getElementById('tarefaPrazo').value = local.toISOString().slice(0, 16);
  } else if (document.getElementById('tarefaPrazo')) {
    document.getElementById('tarefaPrazo').value = '';
  }
  document.getElementById('tituloFormTarefa').textContent = 'Editar Tarefa';
  document.getElementById('abasAdmin button[data-aba="tarefasAdmin"]')?.click();
}

async function eliminarTarefa(id) {
  if (!confirm('Eliminar esta tarefa?')) return;
  const res = await api.editarTarefa({ id, acao: 'excluir' });
  mostrarToast(res.erro || 'Eliminada!', res.erro ? 'erro' : 'sucesso');
  listarTarefasAdmin();
}

let tarefasCacheGlobal = [];
(async () => { const r = await api.listarTarefas(0); tarefasCacheGlobal = r.tarefas || []; })();

// ========== TAREFAS ESPECIAIS ==========
async function carregarEspeciaisAdmin() {
  const container = document.getElementById('listaEspeciaisAdmin');
  container.innerHTML = '<p>Carregando...</p>';
  const res = await api.listarTarefasEspeciais(0, 'admin');
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  if (!res.tarefas?.length) { container.innerHTML = '<p>Nenhuma tarefa especial.</p>'; return; }
  container.innerHTML = res.tarefas.map(t => `
    <div style="padding:10px;border-bottom:1px solid var(--borda-vidro);">
      <strong>${escapeHTML(t.nome)}</strong> <small>por ${escapeHTML(t.usuario_nome)}</small>
      <span>${t.aprovado ? '✅' : '⏳'}</span>
      ${!t.aprovado ? `<button class="btn btn-sm btn-aprovar-especial" data-id="${t.id}">✅ Aprovar</button>` : ''}
      <button class="btn btn-sm negro" onclick="eliminarTarefaEspecial(${t.id})">🗑️</button>
    </div>`).join('');
}

async function aprovarTarefaEspecial(id) {
  const res = await api.aprovarTarefaEspecial(id);
  mostrarToast(res.erro || 'Aprovada!', res.erro ? 'erro' : 'sucesso');
  carregarEspeciaisAdmin();
}

async function eliminarTarefaEspecial(id) {
  if (!confirm('Eliminar?')) return;
  const res = await api.eliminarTarefaEspecial(id);
  mostrarToast(res.erro || 'Eliminada!', res.erro ? 'erro' : 'sucesso');
  carregarEspeciaisAdmin();
}

// ========== UTILIZADORES ==========
async function carregarUtilizadores() {
  document.querySelector('#subAbasUtilizadores button[data-subaba="humanos"]')?.click();
}

async function carregarListaHumanos() {
  const container = document.getElementById('listaHumanos');
  container.innerHTML = '<p>Carregando...</p>';
  const res = await api.listarUtilizadores('humanos');
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.utilizadores.map(u => `
    <div style="padding:8px;border-bottom:1px solid var(--borda-vidro);display:flex;justify-content:space-between;">
      <span>${u.foto ? `<img src="${escapeHTML(u.foto)}" style="width:24px;height:24px;border-radius:50%;">` : '👤'} ${escapeHTML(u.nome)} (${escapeHTML(u.email)})</span>
      <span>
        <button class="btn btn-sm" onclick="promoverUsuario(${u.id})">⭐</button>
        <button class="btn btn-sm negro" onclick="redefinirSenhaPrompt(${u.id})">🔑</button>
      </span>
    </div>`).join('');
}

async function carregarListaBots() {
  const container = document.getElementById('listaBotsAdmin');
  container.innerHTML = '<p>Carregando...</p>';
  const res = await api.listarUtilizadores('bots');
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.utilizadores.map(b => `
    <div style="padding:8px;border-bottom:1px solid var(--borda-vidro);">🤖 ${escapeHTML(b.nome)} <button class="btn btn-sm negro" onclick="eliminarBot(${b.id})">🗑️</button></div>`).join('');
}

async function promoverUsuario(id) {
  if (!confirm('Promover a gestor?')) return;
  const res = await api.redefinirSenha(id, '', 'promover');
  mostrarToast(res.erro || 'Promovido!', res.erro ? 'erro' : 'sucesso');
  carregarListaHumanos();
}

function redefinirSenhaPrompt(id) {
  const nova = prompt('Nova senha (mín. 6 caracteres):');
  if (!nova || nova.length < 6) return mostrarToast('Mínimo 6 caracteres.', 'aviso');
  api.redefinirSenha(id, nova).then(res => mostrarToast(res.erro || 'Senha redefinida!', res.erro ? 'erro' : 'sucesso'));
}

// ========== EXPORTAÇÃO DE RELATÓRIOS ==========
function exportarCSV(dados, nomeFicheiro = 'relatorio.csv') {
  if (!dados || !dados.length) {
    mostrarToast('Sem dados para exportar.', 'aviso');
    return;
  }
  const cabecalhos = Object.keys(dados[0]);
  const linhas = dados.map(obj =>
    cabecalhos.map(chave => {
      let valor = obj[chave] ?? '';
      if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"'))) {
        valor = '"' + valor.replace(/"/g, '""') + '"';
      }
      return valor;
    }).join(',')
  );
  const csv = [cabecalhos.join(','), ...linhas].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeFicheiro;
  link.click();
  URL.revokeObjectURL(url);
  mostrarToast('Relatório exportado!', 'sucesso');
}

async function gerarRelatorioUtilizadores() {
  const res = await api.listarUtilizadores('humanos');
  if (res.erro) {
    mostrarToast(res.erro, 'erro');
    return;
  }
  const dados = res.utilizadores.map(u => ({
    ID: u.id,
    Nome: u.nome,
    Email: u.email,
    Saldo: formatarMoeda(u.saldo),
    Tipo: u.tipo,
    Cadastro: formatarData(u.data_cadastro)
  }));
  exportarCSV(dados, 'utilizadores_ng.csv');
}

// ========== BOTS ==========
function carregarBotsPainel() {
  document.getElementById('formBotsPersonalizados')?.classList.remove('oculto');
  listarBotsGestor();
  document.getElementById('formGerarBots').onsubmit = async (e) => {
    e.preventDefault();
    await gerarBots();
  };
  document.getElementById('btnGerarBots')?.addEventListener('click', gerarBots);
}

async function gerarBots() {
  const quantidade = document.getElementById('quantidadeBots').value || 5;
  const res = await api.gerarBotsPersonalizados({ quantidade });
  mostrarToast(res.erro || 'Bots gerados!', res.erro ? 'erro' : 'sucesso');
  listarBotsGestor();
}

async function listarBotsGestor() {
  const container = document.getElementById('listaBots');
  const res = await api.listarUtilizadores('bots');
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.utilizadores.map(b => `
    <div>🤖 ${escapeHTML(b.nome)} <button class="btn btn-sm negro" onclick="eliminarBot(${b.id})">🗑️</button></div>`).join('');
}

async function eliminarBot(id) {
  if (!confirm('Eliminar bot?')) return;
  const res = await api.eliminarBot(id);
  mostrarToast(res.erro || 'Eliminado!', res.erro ? 'erro' : 'sucesso');
  listarBotsGestor();
}

// ========== ANÚNCIOS ==========
function carregarAnunciosAdmin() {
  document.getElementById('formAnuncioContainer')?.classList.remove('oculto');
  listarAnunciosAdminLista();
  document.getElementById('btnNovoAnuncio')?.addEventListener('click', () => {
    document.getElementById('formAnuncioContainer').classList.remove('oculto');
    document.getElementById('formAnuncio').reset();
    document.getElementById('anuncioIdEdit').value = '';
    document.getElementById('tituloFormAnuncio').textContent = 'Novo Anúncio';
  });
  document.getElementById('formAnuncio').onsubmit = async (e) => {
    e.preventDefault();
    await salvarAnuncio();
  };
}

async function salvarAnuncio() {
  const id = document.getElementById('anuncioIdEdit').value;
  const texto = document.getElementById('anuncioTexto').value.trim();
  const link = document.getElementById('anuncioLink').value.trim();
  const ordem = document.getElementById('anuncioOrdem').value || 0;
  const ativo = document.getElementById('anuncioAtivo').checked ? 1 : 0;
  if (!texto || !link) { mostrarToast('Texto e link obrigatórios.', 'aviso'); return; }
  let imagem = '';
  const file = document.getElementById('anuncioImagem').files[0];
  if (file) imagem = await lerArquivoBase64(file);
  const dados = { id: id || undefined, texto, link, imagem, ordem, ativo };
  const res = id ? await api.editarAnuncio(dados) : await api.criarAnuncio(dados);
  if (res.erro) { mostrarToast(res.erro, 'erro'); return; }
  mostrarToast('Anúncio salvo!', 'sucesso');
  document.getElementById('formAnuncioContainer').classList.add('oculto');
  document.getElementById('formAnuncio').reset();
  listarAnunciosAdminLista();
  carregarAnunciosGestor();
}

async function listarAnunciosAdminLista() {
  const container = document.getElementById('listaAnunciosAdmin');
  const res = await api.listarAnuncios();
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.anuncios.map(a => `
    <div style="display:flex;justify-content:space-between;padding:5px;">
      <span>${a.ativo ? '🟢' : '🔴'} ${escapeHTML(a.texto)}</span>
      <span><button class="btn btn-sm" onclick="editarAnuncioPrompt(${a.id})">✏️</button> <button class="btn btn-sm negro" onclick="eliminarAnuncio(${a.id})">🗑️</button></span>
    </div>`).join('');
}

function editarAnuncioPrompt(id) {
  api.listarAnuncios().then(res => {
    const a = res.anuncios?.find(a => a.id == id);
    if (!a) return mostrarToast('Anúncio não encontrado.', 'erro');
    document.getElementById('formAnuncioContainer').classList.remove('oculto');
    document.getElementById('anuncioIdEdit').value = a.id;
    document.getElementById('anuncioTexto').value = a.texto || '';
    document.getElementById('anuncioLink').value = a.link || '';
    document.getElementById('anuncioOrdem').value = a.ordem || 0;
    document.getElementById('anuncioAtivo').checked = a.ativo == 1;
    document.getElementById('tituloFormAnuncio').textContent = 'Editar Anúncio';
  });
}

async function eliminarAnuncio(id) {
  if (!confirm('Eliminar anúncio?')) return;
  const res = await api.eliminarAnuncio(id);
  mostrarToast(res.erro || 'Eliminado!', res.erro ? 'erro' : 'sucesso');
  listarAnunciosAdminLista();
  carregarAnunciosGestor();
}

// ========== DICAS ADMIN ==========
function carregarDicasAdmin() {
  document.querySelector('#subAbasDicasAdmin button[data-subaba="appsModeracao"]')?.click();
}

async function carregarModeracaoAplicativos() {
  const container = document.getElementById('listaAppsModeracao');
  const res = await api.listarAplicativos(0, 'admin');
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.aplicativos?.length ? res.aplicativos.map(a => `
    <div style="padding:8px;border-bottom:1px solid var(--borda-vidro);">
      <strong>${escapeHTML(a.nome)}</strong> <small>${a.aprovado ? '✅' : '⏳'}</small>
      <button class="btn btn-sm" onclick="aprovarAplicativo(${a.id})">Aprovar</button>
      <button class="btn btn-sm negro" onclick="eliminarAplicativo(${a.id})">🗑️</button>
    </div>`).join('') : '<p>Nenhum aplicativo.</p>';
}

async function aprovarAplicativo(id) {
  const res = await api.aprovarAplicativo(id);
  mostrarToast(res.erro || 'Aprovado!', res.erro ? 'erro' : 'sucesso');
  carregarModeracaoAplicativos();
}

async function eliminarAplicativo(id) {
  if (!confirm('Eliminar?')) return;
  const res = await api.eliminarAplicativo(id);
  mostrarToast(res.erro || 'Eliminado!', res.erro ? 'erro' : 'sucesso');
  carregarModeracaoAplicativos();
}

async function carregarEditorRegras() {
  const res = await api.getConteudo('regras');
  document.getElementById('editorRegras').value = res.conteudo || '';
}

async function carregarEditorAjuda() {
  const res = await api.getConteudo('ajuda');
  document.getElementById('editorAjuda').value = res.conteudo || '';
}

async function salvarConteudoDica(tipo) {
  const textarea = document.getElementById(tipo === 'regras' ? 'editorRegras' : 'editorAjuda');
  const conteudo = textarea.value;
  const res = await api.salvarConteudo({ tipo, conteudo });
  mostrarToast(res.erro || 'Salvo!', res.erro ? 'erro' : 'sucesso');
  if (tipo === 'regras' && document.getElementById('criarAnuncioRegras')?.checked) {
    await api.criarAnuncio({ texto: '📜 Novas regras atualizadas!', link: '/pages/participante.html', ativo: 1, ordem: 0 });
    carregarAnunciosGestor();
  }
}

async function carregarReclamacoesAdmin() {
  const container = document.getElementById('listaReclamacoesAdmin');
  const res = await api.listarReclamacoes(0, 'admin');
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.reclamacoes?.length ? res.reclamacoes.map(r => `
    <div style="padding:8px;">
      <p><strong>${escapeHTML(r.usuario_nome)}</strong>: ${escapeHTML(r.texto)}</p>
      ${r.respondido ? `<p>✅ ${escapeHTML(r.resposta)}</p>` : `<input id="respRecl_${r.id}" placeholder="Resposta"> <button onclick="responderReclamacao(${r.id})">Enviar</button>`}
    </div>`).join('') : '<p>Nenhuma reclamação.</p>';
}

async function responderReclamacao(id) {
  const input = document.getElementById(`respRecl_${id}`);
  if (!input || !input.value.trim()) return mostrarToast('Digite a resposta.', 'aviso');
  const res = await api.responderReclamacao({ id, resposta: input.value.trim() });
  mostrarToast(res.erro || 'Respondida!', res.erro ? 'erro' : 'sucesso');
  carregarReclamacoesAdmin();
}

// ========== PÁGINAS DINÂMICAS ==========
function carregarPaginasAdmin() {
  document.getElementById('formPaginaContainer')?.classList.remove('oculto');
  listarPaginasAdmin();
  document.getElementById('btnNovaPagina')?.addEventListener('click', () => {
    document.getElementById('formPaginaContainer').classList.remove('oculto');
    document.getElementById('formPagina').reset();
    document.getElementById('paginaIdEdit').value = '';
  });
  document.getElementById('formPagina').onsubmit = async (e) => {
    e.preventDefault();
    await salvarPagina();
  };
  document.getElementById('paginaUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) document.getElementById('paginaConteudo').value = await file.text();
  });
}

async function salvarPagina() {
  const id = document.getElementById('paginaIdEdit').value;
  const titulo = document.getElementById('paginaTitulo').value.trim();
  const slug = document.getElementById('paginaSlug').value.trim();
  const conteudo = document.getElementById('paginaConteudo').value;
  if (!titulo || !slug) { mostrarToast('Título e slug obrigatórios.', 'aviso'); return; }
  const dados = { id: id || undefined, titulo, slug, conteudo };
  const res = id ? await api.editarPagina(dados) : await api.criarPagina(dados);
  if (res.erro) { mostrarToast(res.erro, 'erro'); return; }
  mostrarToast('Página salva!', 'sucesso');
  document.getElementById('formPaginaContainer').classList.add('oculto');
  listarPaginasAdmin();
}

async function listarPaginasAdmin() {
  const container = document.getElementById('listaPaginas');
  const res = await api.listarPaginas();
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.paginas?.map(p => `
    <div>📄 ${escapeHTML(p.titulo)} (${p.slug}) <button class="btn btn-sm" onclick="editarPaginaPrompt('${p.id}')">✏️</button></div>`).join('');
}

function editarPaginaPrompt(id) {
  api.listarPaginas().then(res => {
    const p = res.paginas?.find(p => p.id == id);
    if (!p) return mostrarToast('Página não encontrada.', 'erro');
    document.getElementById('formPaginaContainer').classList.remove('oculto');
    document.getElementById('paginaIdEdit').value = p.id;
    document.getElementById('paginaTitulo').value = p.titulo || '';
    document.getElementById('paginaSlug').value = p.slug || '';
    document.getElementById('paginaConteudo').value = p.conteudo || '';
  });
}

// ========== CONFIGURAÇÕES ==========
async function carregarConfig() {
  const res = await api.configSistema({ acao: 'get' });
  if (res.erro) return;
  document.getElementById('configWhatsapp').value = res.whatsapp || '';
  document.getElementById('configEmail').value = res.email || '';
  document.getElementById('configManutencao').value = res.manutencao || 'false';
  if (res.pontos) {
    document.getElementById('configPontosBronze').value = res.pontos.bronze || 0;
    document.getElementById('configPontosPrata').value = res.pontos.prata || 0;
    document.getElementById('configPontosOuro').value = res.pontos.ouro || 0;
    document.getElementById('configPontosPlatina').value = res.pontos.platina || 0;
    document.getElementById('configPontosDiamante').value = res.pontos.diamante || 0;
  }
  document.getElementById('metodoMulticaixa').checked = res.metodos?.multicaixa !== false;
  document.getElementById('metodoEKwanza').checked = res.metodos?.ekwanza !== false;
  document.getElementById('metodoUnitel').checked = res.metodos?.unitel !== false;
  document.getElementById('metodoBancaria').checked = res.metodos?.bancaria !== false;

  document.getElementById('formConfig').onsubmit = async (e) => {
    e.preventDefault();
    const dados = {
      whatsapp: document.getElementById('configWhatsapp').value.trim(),
      email: document.getElementById('configEmail').value.trim(),
      manutencao: document.getElementById('configManutencao').value,
      pontos: {
        bronze: document.getElementById('configPontosBronze').value,
        prata: document.getElementById('configPontosPrata').value,
        ouro: document.getElementById('configPontosOuro').value,
        platina: document.getElementById('configPontosPlatina').value,
        diamante: document.getElementById('configPontosDiamante').value
      },
      metodos: {
        multicaixa: document.getElementById('metodoMulticaixa').checked,
        ekwanza: document.getElementById('metodoEKwanza').checked,
        unitel: document.getElementById('metodoUnitel').checked,
        bancaria: document.getElementById('metodoBancaria').checked
      }
    };
    const res = await api.configSistema({ ...dados, acao: 'set' });
    mostrarToast(res.erro || 'Configurações salvas!', res.erro ? 'erro' : 'sucesso');
  };
}

// ========== CHAT DO GESTOR ==========
async function carregarChatAdmin() {
  const containerContatos = document.getElementById('chatAdminContatos');
  const containerMensagens = document.getElementById('chatAdminMensagens');
  containerContatos.innerHTML = '<p>Carregando contatos...</p>';
  const res = await api.listarUtilizadores('todos');
  if (res.erro) { containerContatos.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  const usuarios = res.utilizadores || [];
  containerContatos.innerHTML = usuarios.map(u => `
    <div class="chat-contato" onclick="abrirConversaAdmin('${u.id}', '${escapeHTML(u.nome)}')" style="padding:10px;cursor:pointer;border-bottom:1px solid var(--borda-vidro);">
      ${u.tipo === 'bot' ? '🤖' : '👤'} ${escapeHTML(u.nome)}
    </div>`).join('');
}

async function abrirConversaAdmin(userId, nome) {
  const container = document.getElementById('chatAdminMensagens');
  container.innerHTML = `<h4>Chat com ${nome}</h4><div id="chatMsgsAdmin"></div>
    <div style="display:flex;margin-top:10px;"><input id="inputMsgAdmin" placeholder="Responder como ${nome}..." style="flex:1;"><button onclick="enviarMsgAdmin('${userId}')">➤</button></div>`;
  const res = await api.listarMensagens(userId);
  const msgs = document.getElementById('chatMsgsAdmin');
  if (res.erro) { msgs.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  msgs.innerHTML = (res.mensagens || []).map(m => `<p><strong>${m.remetente == userId ? nome : 'Eu'}:</strong> ${escapeHTML(m.texto)}</p>`).join('');
}

async function enviarMsgAdmin(userId) {
  const input = document.getElementById('inputMsgAdmin');
  const texto = input.value.trim();
  if (!texto) return;
  const res = await api.enviarMensagem({ userId: usuarioGestor.id, destinatarioId: userId, texto });
  if (res.erro) { mostrarToast(res.erro, 'erro'); return; }
  input.value = '';
  abrirConversaAdmin(userId, '');
}

// ========== ANÚNCIOS ROLANTES ==========
async function carregarAnunciosGestor() {
  const container = document.getElementById('anunciosRolantes');
  if (!container) return;
  const res = await api.listarAnuncios();
  if (res.erro || !res.anuncios?.length) { container.innerHTML = ''; return; }
  container.innerHTML = res.anuncios.map(a => `
    <button class="anuncio-btn" onclick="window.open('${escapeHTML(a.link)}', '${a.link.startsWith('/') ? '_self' : '_blank'}')">
      ${a.imagem ? `<img src="${escapeHTML(a.imagem)}" alt="">` : ''}
      <span>${escapeHTML(a.texto)}</span>
    </button>`).join('');
}

// ========== UTILITÁRIOS ==========
function lerArquivoBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

// ========== EXPORTAÇÕES GLOBAIS ==========
window.aprovarSubmissao = aprovarSubmissao;
window.rejeitarSubmissao = rejeitarSubmissao;
window.confirmarPagamento = confirmarPagamento;
window.editarTarefaPrompt = editarTarefaPrompt;
window.eliminarTarefa = eliminarTarefa;
window.promoverUsuario = promoverUsuario;
window.redefinirSenhaPrompt = redefinirSenhaPrompt;
window.eliminarBot = eliminarBot;
window.editarAnuncioPrompt = editarAnuncioPrompt;
window.eliminarAnuncio = eliminarAnuncio;
window.aprovarAplicativo = aprovarAplicativo;
window.eliminarAplicativo = eliminarAplicativo;
window.responderReclamacao = responderReclamacao;
window.eliminarTarefaEspecial = eliminarTarefaEspecial;
window.editarPaginaPrompt = editarPaginaPrompt;
window.abrirConversaAdmin = abrirConversaAdmin;
window.enviarMsgAdmin = enviarMsgAdmin;
window.gerarRelatorioUtilizadores = gerarRelatorioUtilizadores;