// =============================================
// 👤 NG TRAFEGO - PAINEL DO PARTICIPANTE
// =============================================

let tarefasCache = [];
let notificacoes = [];
let sidebarAberta = false;

document.addEventListener('DOMContentLoaded', () => {
  const usuario = verificarAutenticacao();
  if (!usuario) return;
  document.getElementById('nomeUser').textContent = usuario.nome || usuario.user;

  criarCabecalhoPremium(usuario);
  criarSidebarExpansao(usuario);
  carregarNotificacoes();

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

      if (aba === 'tarefas') carregarTarefas(usuario.id);
      if (aba === 'equipa') carregarEquipa(usuario.id);
      if (aba === 'resgate') carregarSaldo(usuario.id);
      if (aba === 'info') carregarInfo();
    });
  });

  carregarTarefas(usuario.id);

  const buscaInput = document.getElementById('buscaTarefas');
  if (buscaInput) {
    buscaInput.addEventListener('input', debounce(function () {
      filtrarTarefas(this.value.toLowerCase());
    }, 250));
  }

  const formEnvio = document.getElementById('formEnvio');
  if (formEnvio) {
    formEnvio.addEventListener('submit', async function (e) {
      e.preventDefault();
      await submeterComprovativo(usuario.id);
    });
  }
});

// ====== CABEÇALHO PREMIUM ======
function criarCabecalhoPremium(usuario) {
  const h2 = document.querySelector('.painel h2');
  if (!h2) return;
  
  h2.innerHTML = `
    <div class="cabecalho-usuario" style="width:100%;">
      <div class="info-user">
        <div class="avatar">${(usuario.nome || usuario.user).charAt(0).toUpperCase()}</div>
        <div class="detalhes">
          <span style="color:var(--dourado);font-weight:700;">${escapeHTML(usuario.nome || usuario.user)}</span>
          <br><small>${usuario.tipo === 'gestor' ? '🛡️ Gestor' : '👤 Participante'}</small>
        </div>
      </div>
      <div class="sino-notificacoes" onclick="abrirNotificacoes()" title="Notificações">
        🔔
        <span class="badge oculto" id="badgeNotificacoes">0</span>
      </div>
    </div>
  `;
}

// ====== SIDEBAR EXPANSÃO ======
function criarSidebarExpansao(usuario) {
  const toggle = document.createElement('button');
  toggle.className = 'sidebar-toggle';
  toggle.textContent = '◀';
  toggle.title = 'Painel de Expansão';
  toggle.onclick = toggleSidebar;
  document.body.appendChild(toggle);
  
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar-overlay';
  sidebar.id = 'sidebarExpansao';
  sidebar.innerHTML = `
    <h3 style="color:var(--dourado);margin-bottom:20px;">📊 Detalhes</h3>
    <div id="sidebarConteudo">
      <p style="color:var(--texto-secundario);">Selecione uma tarefa para ver detalhes.</p>
    </div>
  `;
  document.body.appendChild(sidebar);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebarExpansao');
  const toggle = document.querySelector('.sidebar-toggle');
  sidebarAberta = !sidebarAberta;
  
  if (sidebarAberta) {
    sidebar.classList.add('ativo');
    toggle.textContent = '▶';
  } else {
    sidebar.classList.remove('ativo');
    toggle.textContent = '◀';
  }
}

// ====== TAREFAS E BUSCA ======
async function carregarTarefas(userId) {
  const container = document.getElementById('listaTarefas');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:60px;"></div><div class="skeleton" style="height:60px;margin-top:10px;"></div><div class="skeleton" style="height:60px;margin-top:10px;"></div>';
  
  const resposta = await api.listarTarefas(userId);
  if (resposta.erro) {
    container.innerHTML = `<p class="erro">${resposta.erro}</p>`;
    return;
  }
  tarefasCache = resposta.tarefas || [];
  exibirTarefas(tarefasCache);
  atualizarStats(tarefasCache);
}

function exibirTarefas(tarefas) {
  const container = document.getElementById('listaTarefas');
  if (!container) return;
  if (tarefas.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--texto-terciario);">📭 Nenhuma tarefa disponível.</p>';
    return;
  }

  const emojis = ['🟪', '🧪', '🟢', '📱', '💻', '🎯', '📊', '🎨'];
  
  container.innerHTML = tarefas.map((tarefa, i) => {
    const emoji = tarefa.emoji || emojis[i % emojis.length];
    const tempoEstimado = tarefa.tempoEstimado || 'N/D';
    
    return `
      <div class="card-tarefa" onclick="mostrarDetalhesTarefa('${tarefa.id}')">
        <div class="tarefa-header">
          <span class="tarefa-emoji">${emoji}</span>
          <span class="valor">${formatarMoeda(tarefa.valor)}</span>
        </div>
        <strong>${escapeHTML(tarefa.titulo)}</strong>
        <p>${escapeHTML(tarefa.descricao || 'Sem descrição')}</p>
        <div class="progresso">
          <div style="width: ${Math.floor(Math.random() * 60 + 20)}%;"></div>
        </div>
        <div class="tarefa-footer">
          <span class="tarefa-tempo">🕒 ${tempoEstimado} | 🏷️ ${tarefa.nivel || 'Todos'}</span>
          <button class="btn-tarefa" onclick="event.stopPropagation();iniciarTarefa('${tarefa.id}')">➡️</button>
        </div>
      </div>
    `;
  }).join('');
}

function filtrarTarefas(termo) {
  if (!termo) {
    exibirTarefas(tarefasCache);
    return;
  }
  const filtradas = tarefasCache.filter(t => {
    return (t.titulo || '').toLowerCase().includes(termo) ||
           (t.descricao || '').toLowerCase().includes(termo) ||
           (t.nivel || '').toLowerCase().includes(termo);
  });
  exibirTarefas(filtradas);
}

function mostrarDetalhesTarefa(id) {
  const tarefa = tarefasCache.find(t => t.id == id);
  if (!tarefa) return;
  
  const sidebar = document.getElementById('sidebarConteudo');
  if (sidebar) {
    sidebar.innerHTML = `
      <div style="text-align:center;margin-bottom:15px;">
        <span style="font-size:3em;">🧪</span>
      </div>
      <h4 style="color:var(--dourado);">${escapeHTML(tarefa.titulo)}</h4>
      <p style="color:var(--texto-secundario);margin:8px 0;">${escapeHTML(tarefa.descricao || '')}</p>
      <p style="color:var(--dourado);font-size:1.4em;font-weight:800;">${formatarMoeda(tarefa.valor)}</p>
      <p style="color:var(--texto-terciario);">🕒 ${tarefa.tempoEstimado || 'N/D'} | Nível: ${tarefa.nivel || 'Todos'}</p>
      <button class="btn" style="width:100%;margin-top:15px;" onclick="iniciarTarefa('${tarefa.id}')">▶️ Iniciar Tarefa</button>
    `;
  }
  
  if (!sidebarAberta) toggleSidebar();
}

function iniciarTarefa(id) {
  const tarefa = tarefasCache.find(t => t.id == id);
  if (!tarefa) return;
  
  const select = document.getElementById('tarefaSelect');
  if (select) select.value = id;
  
  document.querySelector('.abas button[data-aba="enviar"]')?.click();
  mostrarToast(`Tarefa "${tarefa.titulo}" selecionada!`, 'sucesso');
}

function atualizarStats(tarefas) {
  const container = document.getElementById('listaTarefas');
  if (!container) return;
  
  const statsHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icone">💰</div>
        <div class="stat-valor">${formatarMoeda(obterSessao()?.saldo || 0)}</div>
        <div class="stat-label">Saldo Total</div>
      </div>
      <div class="stat-card">
        <div class="stat-icone">📋</div>
        <div class="stat-valor">${tarefas.length}</div>
        <div class="stat-label">Tarefas Disponíveis</div>
      </div>
      <div class="stat-card">
        <div class="stat-icone">✅</div>
        <div class="stat-valor">0</div>
        <div class="stat-label">Concluídas Hoje</div>
      </div>
      <div class="stat-card">
        <div class="stat-icone">🏆</div>
        <div class="stat-valor">Bronze</div>
        <div class="stat-label">Seu Nível</div>
      </div>
    </div>
  `;
  
  const existente = container.querySelector('.stats-grid');
  if (!existente) {
    container.insertAdjacentHTML('afterbegin', statsHTML);
  }
}

// ====== ENVIO ======
async function submeterComprovativo(userId) {
  const tarefaId = document.getElementById('tarefaSelect').value;
  const link = document.getElementById('linkComprovativo').value.trim();
  const observacao = document.getElementById('obsEnvio').value.trim();
  const msgStatus = document.getElementById('statusEnvio');

  if (!tarefaId || !link) {
    msgStatus.innerHTML = '<p class="erro">⚠️ Selecione a tarefa e insira o link.</p>';
    mostrarToast('Preencha todos os campos obrigatórios.', 'aviso');
    return;
  }

  if (!validarURL(link)) {
    msgStatus.innerHTML = '<p class="erro">🔗 Link inválido. Insira uma URL completa.</p>';
    return;
  }

  const btn = document.querySelector('#formEnvio .btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Enviando...';
  }

  const resposta = await api.submeter({ userId, tarefaId, link, observacao });
  
  if (btn) {
    btn.disabled = false;
    btn.textContent = '📨 Submeter';
  }

  if (resposta.erro) {
    msgStatus.innerHTML = `<p class="erro">${resposta.erro}</p>`;
    mostrarToast(resposta.erro, 'erro');
  } else {
    msgStatus.innerHTML = `<p class="sucesso">✅ ${resposta.mensagem || 'Enviado com sucesso!'}</p>`;
    document.getElementById('formEnvio').reset();
    mostrarToast('Comprovativo submetido! Aguarde aprovação.', 'sucesso');
    dispararConfetti();
    adicionarNotificacao('Submissão enviada', 'Seu comprovativo foi enviado e está pendente de aprovação.');
  }
}

// ====== EQUIPA ======
async function carregarEquipa(userId) {
  const container = document.getElementById('equipaPainel');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:100px;"></div>';

  const bandeiras = ['🇦🇴', '🇧🇷', '🇵🇹', '🇲🇿', '🇨🇻'];
  const nomesBots = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Epsilon'];
  const statusLista = ['Online', 'Ocupado', 'Online', 'Ausente', 'Online'];

  container.innerHTML = `
    <div class="progresso" style="margin-bottom:20px;">
      <div style="width: ${Math.floor(Math.random() * 30 + 60)}%;"></div>
    </div>
    <p>Progresso da equipa: <span class="texto-dourado">${Math.floor(Math.random() * 30 + 60)}%</span></p>
    <div class="equipa-lista">
      ${bandeiras.map((bandeira, i) => `
        <div class="membro-equipa">
          <span class="bandeira">${bandeira}</span>
          <p class="nome">${nomesBots[i]}</p>
          <p class="status-equipa">🟢 ${statusLista[i]}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// ====== SALDO E SAQUE ======
async function carregarSaldo(userId) {
  const container = document.getElementById('resgatePainel');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:80px;"></div>';
  
  const resposta = await api.verSaldo(userId);
  if (resposta.erro) {
    container.innerHTML = `<p class="erro">${resposta.erro}</p>`;
    return;
  }
  
  container.innerHTML = `
    <div class="saldo-atual">${formatarMoeda(resposta.saldo)}</div>
    <p style="color:var(--texto-secundario);">Saldo disponível para saque</p>
    <div class="resgate-opcoes">
      <button class="btn" onclick="pedirSaquePrompt(${userId}, 500)">💵 500 Kz</button>
      <button class="btn" onclick="pedirSaquePrompt(${userId}, 1000)">💵 1.000 Kz</button>
      <button class="btn" onclick="pedirSaquePrompt(${userId}, 0)">💵 Personalizado</button>
    </div>
    <p id="msgSaque" class="erro"></p>
  `;
}

function pedirSaquePrompt(userId, valorPredefinido) {
  let valor;
  if (valorPredefinido > 0) {
    valor = valorPredefinido;
  } else {
    valor = prompt('Quanto deseja sacar? (mínimo 500 Kz)');
    if (!valor) return;
  }
  pedirSaque(userId, Number(valor));
}

async function pedirSaque(userId, valor) {
  if (isNaN(valor) || valor < 500) {
    mostrarToast('Valor mínimo de saque: 500 Kz.', 'aviso');
    return;
  }
  
  const resposta = await api.pedirSaque(userId, valor);
  if (resposta.erro) {
    document.getElementById('msgSaque').textContent = resposta.erro;
    mostrarToast(resposta.erro, 'erro');
  } else {
    mostrarToast('Pedido de saque enviado! Aguarde confirmação.', 'sucesso');
    carregarSaldo(userId);
    adicionarNotificacao('Saque Solicitado', `Pedido de ${formatarMoeda(valor)} registado.`);
  }
}

// ====== INFORMAÇÕES ======
async function carregarInfo() {
  const container = document.getElementById('infoPainel');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:120px;"></div>';

  const res = await api.listarPaginas();
  if (res.erro) {
    container.innerHTML = `<p class="erro">${res.erro}</p>`;
    return;
  }
  
  const paginaInfo = res.paginas.find(p => (p.titulo || '').toLowerCase() === 'info_geral');
  if (!paginaInfo) {
    container.innerHTML = `
      <div class="info-texto">
        <h3>📜 Regras</h3>
        <ul><li>Complete tarefas para ganhar pontos.</li><li>Cada tarefa aprovada adiciona saldo.</li></ul>
        <h3>🎓 Tutorial</h3>
        <ol>
          <li>Escolha uma tarefa na aba Tarefas</li>
          <li>Siga as instruções e submeta o comprovativo</li>
          <li>Aguarde aprovação do gestor</li>
          <li>Acumule saldo e peça saque</li>
        </ol>
        <p style="margin-top:15px;font-style:italic;color:var(--texto-terciario);">O gestor ainda não personalizou esta página.</p>
      </div>
    `;
    return;
  }
  container.innerHTML = `<div class="info-texto">${paginaInfo.conteudo}</div>`;
}

// ====== NOTIFICAÇÕES ======
function carregarNotificacoes() {
  const salvas = localStorage.getItem('ng_notificacoes');
  notificacoes = salvas ? JSON.parse(salvas) : [];
  atualizarBadge();
}

function adicionarNotificacao(titulo, mensagem) {
  notificacoes.unshift({
    id: gerarId('notif'),
    titulo,
    mensagem,
    data: new Date().toISOString(),
    lida: false
  });
  
  if (notificacoes.length > 50) notificacoes.pop();
  localStorage.setItem('ng_notificacoes', JSON.stringify(notificacoes));
  atualizarBadge();
}

function atualizarBadge() {
  const badge = document.getElementById('badgeNotificacoes');
  if (!badge) return;
  const naoLidas = notificacoes.filter(n => !n.lida).length;
  badge.textContent = naoLidas;
  badge.classList.toggle('oculto', naoLidas === 0);
}

function abrirNotificacoes() {
  const naoLidas = notificacoes.filter(n => !n.lida);
  if (naoLidas.length === 0) {
    mostrarToast('Nenhuma notificação nova.', 'sucesso');
    return;
  }
  
  const lista = naoLidas.map(n => `• ${n.titulo}: ${n.mensagem}`).join('\n');
  alert(`🔔 Notificações (${naoLidas.length}):\n\n${lista}`);
  
  notificacoes.forEach(n => n.lida = true);
  localStorage.setItem('ng_notificacoes', JSON.stringify(notificacoes));
  atualizarBadge();
}

// ====== TOAST ======
function mostrarToast(mensagem, tipo = 'sucesso') {
  const container = document.querySelector('.toast-container') || criarToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  
  const icones = { sucesso: '✅', erro: '❌', aviso: '⚠️' };
  toast.textContent = `${icones[tipo] || 'ℹ️'} ${mensagem}`;
  container.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

function criarToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ====== CONFETTI ======
function dispararConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  
  const cores = ['#FFD700', '#FFED4A', '#B8860B', '#4CAF50', '#FF4444', '#42A5F5', '#FF9800', '#E91E63'];
  
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.top = -(Math.random() * 20 + 10) + 'px';
    piece.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
    piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.width = (Math.random() * 10 + 8) + 'px';
    piece.style.height = (Math.random() * 10 + 8) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(piece);
  }
  
  setTimeout(() => container.remove(), 3500);
}

// ====== EXPORTAR PARA USO GLOBAL ======
window.iniciarTarefa = iniciarTarefa;
window.mostrarDetalhesTarefa = mostrarDetalhesTarefa;
window.pedirSaquePrompt = pedirSaquePrompt;
window.toggleSidebar = toggleSidebar;
window.abrirNotificacoes = abrirNotificacoes;