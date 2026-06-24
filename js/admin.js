// =============================================
// 🛡️ NG TAREFAS - PAINEL DO GESTOR (COMPLETO COM SUB‑GESTORES E MODELOS)
// =============================================

let usuarioGestor = null;
let regrasCache = [];
let mensagensCache = [];
let modelosCache = [];

// ⚡ Função para verificar permissão rapidamente
function temPermissao(acao) {
  if (!usuarioGestor) return false;
  if (usuarioGestor.tipo === 'gestor') return true; // gestor principal pode tudo
  return usuarioGestor.permissoes && usuarioGestor.permissoes[acao] === true;
}

// ⚡ Exibe toast de permissão negada
function negado(msg = 'Sem permissão para esta ação.') {
  mostrarToast(msg, 'erro');
}

document.addEventListener('DOMContentLoaded', () => {
  const usuario = verificarGestor();
  if (!usuario) return;
  usuarioGestor = usuario;
  preencherCabecalhoGestor(usuario);
  configurarAbas();
  configurarSubAbas();
  configurarDelegacaoDeEventos();
  carregarAnunciosGestor();
  // Se for sub‑gestor, esconder abas que exigem permissão global
  if (usuario.tipo !== 'gestor') {
    document.querySelector('[data-aba="config"]').classList.add('oculto');
    document.querySelector('[data-aba="subgestores"]').classList.add('oculto');
    document.querySelector('[data-aba="utilizadores"]').classList.add('oculto');
    document.querySelector('[data-aba="bots"]').classList.add('oculto');
  }
  document.querySelector('#abasAdmin button[data-aba="aprovacoes"]')?.click();
});

// ... (mantenha todas as funções existentes: preencherCabecalhoGestor, atualizarResumoGeral, configurarAbas, etc.)
// A única diferença é que em algumas funções de ação (aprovar, criar tarefa, etc.) adicionaremos verificação de permissão.

// ========== SUB‑ABAS DE TAREFAS (LISTA + MODELOS) ==========
function configurarSubAbas() {
  // ... (código existente para outras sub‑abas)
  // Adicionar suporte às sub‑abas de tarefas
  document.querySelectorAll('#subAbasTarefas button[data-subaba]').forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.parentElement;
      container.querySelectorAll('button').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      const subaba = btn.dataset.subaba;
      document.getElementById('subTarefasLista').classList.toggle('oculto', subaba !== 'tarefasLista');
      document.getElementById('subModelos').classList.toggle('oculto', subaba !== 'modelos');
      if (subaba === 'tarefasLista') carregarTarefasAdmin();
      else if (subaba === 'modelos') carregarModelosAdmin();
    });
  });
}

// ========== GESTÃO DE SUB‑GESTORES ==========
async function carregarSubgestores() {
  if (!temPermissao('gerirUtilizadores')) { negado(); return; }
  const container = document.getElementById('listaSubgestores');
  container.innerHTML = '<p>Carregando...</p>';
  const res = await api.listarUtilizadores('humanos');
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  const humanos = res.utilizadores.filter(u => u.tipo === 'subgestor' || u.tipo === 'gestor');
  container.innerHTML = humanos.map(u => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--borda-vidro);">
      <span>${u.foto ? `<img src="${escapeHTML(u.foto)}" style="width:24px;height:24px;border-radius:50%;">` : '👤'} ${escapeHTML(u.nome)} (${u.tipo})</span>
      <span>
        ${u.tipo === 'subgestor' ? `<button class="btn btn-sm" onclick="abrirModalPermissoes(${u.id}, '${escapeHTML(u.nome)}')">🔧 Permissões</button>` : ''}
        <button class="btn btn-sm negro" onclick="removerSubgestor(${u.id})">🗑️</button>
      </span>
    </div>
  `).join('');
}

function abrirModalPermissoes(userId, nome) {
  if (!temPermissao('gerirUtilizadores')) { negado(); return; }
  const modal = document.getElementById('modalPermissoes');
  document.getElementById('nomeSubgestorModal').textContent = nome;
  const permissoesPadrao = {
    criarTarefas: false,
    publicarTarefas: false,
    criarAplicativos: false,
    publicarAplicativos: false,
    criarAnuncios: false,
    publicarAnuncios: false,
    aprovarSubmissoes: false,
    gerirUtilizadores: false,
    acederConfig: false
  };
  // Obter permissões atuais do utilizador (se existirem)
  api.obterPermissoes(userId).then(res => {
    const permissoes = res.permissoes || permissoesPadrao;
    const checkboxesDiv = document.getElementById('checkboxesPermissoes');
    checkboxesDiv.innerHTML = Object.keys(permissoes).map(p => `
      <label style="display:block;margin:6px 0;">
        <input type="checkbox" id="perm_${p}" ${permissoes[p] ? 'checked' : ''}> ${p}
      </label>
    `).join('');
    modal.dataset.userId = userId;
    modal.classList.remove('oculto');
  });
}

document.getElementById('btnFecharModal')?.addEventListener('click', () => {
  document.getElementById('modalPermissoes').classList.add('oculto');
});

document.getElementById('btnSalvarPermissoes')?.addEventListener('click', async () => {
  const modal = document.getElementById('modalPermissoes');
  const userId = modal.dataset.userId;
  const permissoes = {};
  document.querySelectorAll('#checkboxesPermissoes input').forEach(cb => {
    permissoes[cb.id.replace('perm_', '')] = cb.checked;
  });
  const res = await api.salvarPermissoes({ userId, permissoes });
  if (res.erro) mostrarToast(res.erro, 'erro');
  else {
    mostrarToast('Permissões guardadas!', 'sucesso');
    modal.classList.add('oculto');
    carregarSubgestores();
  }
});

async function removerSubgestor(id) {
  if (!temPermissao('gerirUtilizadores')) { negado(); return; }
  if (!confirm('Remover este sub‑gestor?')) return;
  const res = await api.redefinirSenha(id, '', 'rebaixar');
  if (res.erro) mostrarToast(res.erro, 'erro');
  else {
    mostrarToast('Sub‑gestor removido.', 'sucesso');
    carregarSubgestores();
  }
}

// ========== MODELOS DE TAREFAS ==========
async function carregarModelosAdmin() {
  if (!temPermissao('criarTarefas')) { negado(); return; }
  document.getElementById('formModeloContainer')?.classList.add('oculto');
  const container = document.getElementById('listaModelosAdmin');
  const res = await api.listarModelos();
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  modelosCache = res.modelos || [];
  container.innerHTML = modelosCache.map(m => `
    <div style="display:flex;justify-content:space-between;padding:5px;border-bottom:1px solid var(--borda-vidro);">
      <span>${escapeHTML(m.titulo)} (${m.pontos} pts)</span>
      <span>
        <button class="btn btn-sm" onclick="editarModelo('${m.id}')">✏️</button>
        <button class="btn btn-sm negro" onclick="eliminarModelo('${m.id}')">🗑️</button>
      </span>
    </div>
  `).join('');
}

document.getElementById('btnNovoModelo')?.addEventListener('click', () => {
  document.getElementById('formModeloContainer').classList.remove('oculto');
  document.getElementById('formModelo').reset();
  document.getElementById('modeloIdEdit').value = '';
});

document.getElementById('formModelo')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('modeloIdEdit').value;
  const dados = {
    id: id || undefined,
    titulo: document.getElementById('modeloTitulo').value.trim(),
    descricao: document.getElementById('modeloDescricao').value.trim(),
    pontos: parseInt(document.getElementById('modeloPontos').value),
    nivel: document.getElementById('modeloNivel').value,
    tempoEstimado: document.getElementById('modeloTempo').value.trim()
  };
  if (!dados.titulo || isNaN(dados.pontos)) { mostrarToast('Título e pontos obrigatórios.', 'aviso'); return; }
  const res = id ? await api.editarModelo(dados) : await api.criarModelo(dados);
  if (res.erro) { mostrarToast(res.erro, 'erro'); return; }
  mostrarToast('Modelo salvo!', 'sucesso');
  document.getElementById('formModeloContainer').classList.add('oculto');
  carregarModelosAdmin();
});

async function editarModelo(id) {
  const modelo = modelosCache.find(m => m.id == id);
  if (!modelo) return;
  document.getElementById('formModeloContainer').classList.remove('oculto');
  document.getElementById('modeloIdEdit').value = modelo.id;
  document.getElementById('modeloTitulo').value = modelo.titulo || '';
  document.getElementById('modeloDescricao').value = modelo.descricao || '';
  document.getElementById('modeloPontos').value = modelo.pontos || 0;
  document.getElementById('modeloNivel').value = modelo.nivel || 'Todos';
  document.getElementById('modeloTempo').value = modelo.tempoEstimado || '';
}

async function eliminarModelo(id) {
  if (!confirm('Eliminar modelo?')) return;
  const res = await api.eliminarModelo(id);
  if (res.erro) mostrarToast(res.erro, 'erro');
  else { mostrarToast('Modelo eliminado.', 'sucesso'); carregarModelosAdmin(); }
}

// ========== CRIAÇÃO DE TAREFA POR SUB‑GESTOR (usando modelo) ==========
async function carregarTarefasAdmin() {
  // ... (código existente, mas adaptado)
  if (usuarioGestor.tipo !== 'gestor') {
    // Sub‑gestor: mostrar seletor de modelos antes do formulário
    document.getElementById('modeloRapidoContainer').classList.remove('oculto');
    document.getElementById('formTarefaContainer').classList.add('oculto');
    const select = document.getElementById('modeloRapidoSelect');
    select.innerHTML = '<option value="">— Escolha um modelo —</option>';
    const res = await api.listarModelos();
    if (!res.erro) {
      res.modelos.forEach(m => {
        select.innerHTML += `<option value="${m.id}">${escapeHTML(m.titulo)} (${m.pontos} pts)</option>`;
      });
    }
    document.getElementById('btnUsarModelo').onclick = async () => {
      const modeloId = select.value;
      if (!modeloId) return mostrarToast('Selecione um modelo.', 'aviso');
      const modelo = res.modelos.find(m => m.id == modeloId);
      if (!modelo) return;
      // Preencher formulário e bloquear campos
      document.getElementById('formTarefaContainer').classList.remove('oculto');
      document.getElementById('tarefaTitulo').value = modelo.titulo || '';
      document.getElementById('tarefaDescricao').value = modelo.descricao || '';
      document.getElementById('tarefaPontos').value = modelo.pontos || 0;
      document.getElementById('tarefaValorKz').value = formatarMoeda(converterPontosParaKz(modelo.pontos));
      document.getElementById('tarefaNivel').value = modelo.nivel || 'Todos';
      document.getElementById('tarefaTempo').value = modelo.tempoEstimado || '';
      document.getElementById('tarefaPontos').readOnly = true;
      document.getElementById('tarefaNivel').disabled = true;
      document.getElementById('tarefaTempo').readOnly = true;
      document.getElementById('modeloRapidoContainer').classList.add('oculto');
    };
  } else {
    // Gestor principal: formulário normal
    document.getElementById('btnNovaTarefa').onclick = () => {
      document.getElementById('formTarefaContainer').classList.remove('oculto');
      document.getElementById('formTarefa').reset();
      document.getElementById('tarefaIdEdit').value = '';
      document.getElementById('tituloFormTarefa').textContent = 'Nova Tarefa';
      document.getElementById('tarefaPontos').readOnly = false;
      document.getElementById('tarefaNivel').disabled = false;
      document.getElementById('tarefaTempo').readOnly = false;
    };
  }
  listarTarefasAdmin();
}

async function salvarTarefa() {
  if (!temPermissao('criarTarefas')) { negado(); return; }
  // ... (restante código, igual ao anterior)
  // Adicionar verificação de permissão para publicar sem aprovação? Fica a critério.
}

// ========== AJUSTES NAS AÇÕES EXISTENTES ==========
// Em cada função de ação, adicione no início:
// if (!temPermissao('xxxx')) { negado(); return; }
// Por exemplo:
async function aprovarSubmissao(id) {
  if (!temPermissao('aprovarSubmissoes')) { negado(); return; }
  // ... código original
}
// Faça o mesmo para: rejeitarSubmissao, aprovarAplicativo, eliminarAplicativo, confirmarPagamento, etc.

// ========== CARREGAMENTO DA ABA SUB‑GESTORES ==========
function carregarAba(aba) {
  // ... (case adicional)
  case 'subgestores': carregarSubgestores(); break;
  // ...
}

// ========== EXPORTAÇÕES ADICIONAIS ==========
window.abrirModalPermissoes = abrirModalPermissoes;
window.removerSubgestor = removerSubgestor;
window.editarModelo = editarModelo;
window.eliminarModelo = eliminarModelo;