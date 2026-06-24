// =============================================
// 👤 NG TAREFAS - PAINEL DO PARTICIPANTE (VERSÃO COMPLETA COM BÓNUS, MENSAGENS, PONTOS, METAS, REPUTAÇÃO)
// =============================================

let tarefasCache = [];
let notificacoes = [];
let participantesCache = [];
let usuarioAtual = null;
let chatAberto = false;
let modoFoco = false;
let mensagensExibidas = []; // IDs de mensagens já exibidas nesta sessão

document.addEventListener('DOMContentLoaded', () => {
  const usuario = verificarAutenticacao();
  if (!usuario) return;
  usuarioAtual = usuario;

  preencherCabecalho(usuario);
  configurarSidebarDetalhes();
  carregarNotificacoes();
  carregarAnuncios();
  configurarModoFoco();
  configurarChatFlutuante(usuario);
  configurarSeletorTemas();
  verificarMensagensMotivacionais();  // 🆕 exibe pop-ups motivacionais
  agendarMensagensPeriodicas();       // 🆕 a cada 2h

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

      switch(aba) {
        case 'perfil': preencherFormularioPerfil(usuario); break;
        case 'tarefas': carregarTarefas(usuario.id); break;
        case 'enviar': carregarTarefasSelect(usuario.id); break;
        case 'participantes': carregarParticipantes(usuario.id); break;
        case 'especiais': configurarTarefasEspeciais(usuario.id); break;
        case 'dicas': configurarDicas(usuario.id); break;
        case 'resgate': carregarSaldo(usuario.id); break;
      }
    });
  });

  document.querySelector('.abas button[data-aba="tarefas"]')?.click();

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

  document.getElementById('btnLogout')?.addEventListener('click', () => logout());
});

// ========== CABEÇALHO (PREENCHER) ==========
function preencherCabecalho(usuario) {
  document.getElementById('nomeParticipante').textContent = usuario.nome || usuario.user;
  document.getElementById('idUsuario').textContent = `ID: #${usuario.id}`;
  const pontos = usuario.pontos || 0;
  document.getElementById('saldoAtual').textContent = formatarPontosComKz(pontos);
  document.getElementById('nivelAtual').textContent = usuario.nivel || 'Bronze';
  document.getElementById('reputacao').textContent = usuario.reputacao || '--';
  const pontosNivel = usuario.pontosNivel || 0;
  const proximoNivel = usuario.proximoNivel || 100;
  const progresso = Math.min((pontosNivel / proximoNivel) * 100, 100);
  document.getElementById('barraNivel').style.width = `${progresso}%`;
  document.getElementById('pontosNivel').textContent = `${pontosNivel} / ${proximoNivel} pontos`;
}

// ========== SIDEBAR DE DETALHES ==========
function configurarSidebarDetalhes() {
  const toggle = document.querySelector('.sidebar-toggle');
  if (toggle) toggle.addEventListener('click', toggleSidebar);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebarDetalhes');
  const toggle = document.querySelector('.sidebar-toggle');
  if (!sidebar || !toggle) return;
  sidebar.classList.toggle('ativo');
  toggle.textContent = sidebar.classList.contains('ativo') ? '✖' : '❗';
}

// ========== MODO FOCO ==========
function configurarModoFoco() {
  const btn = document.getElementById('btnModoFoco');
  if (!btn) return;
  btn.addEventListener('click', () => {
    modoFoco = !modoFoco;
    btn.classList.toggle('ativo', modoFoco);
    document.getElementById('anunciosRolantes')?.classList.toggle('oculto', modoFoco);
    document.querySelector('.whatsapp-float')?.classList.toggle('oculto', modoFoco);
    document.querySelector('.chat-float-btn')?.classList.toggle('oculto', modoFoco);
    document.getElementById('chatJanela')?.classList.remove('ativo');
    mostrarToast(modoFoco ? 'Modo Foco ativado' : 'Modo Foco desativado', 'info');
  });
}

// ========== SELEÇÃO DE TEMA ==========
function configurarSeletorTemas() {
  const opcoes = document.querySelectorAll('.opcao-tema');
  const temaAtual = document.documentElement.getAttribute('data-theme') || 'dark';
  opcoes.forEach(op => {
    op.classList.toggle('ativo', op.dataset.tema === temaAtual);
    op.addEventListener('click', () => {
      aplicarTema(op.dataset.tema);
      opcoes.forEach(o => o.classList.remove('ativo'));
      op.classList.add('ativo');
    });
  });
}

// ========== CHAT FLUTUANTE ==========
function configurarChatFlutuante(usuario) {
  const btn = document.getElementById('btnChatFloat');
  const janela = document.getElementById('chatJanela');
  const fechar = document.getElementById('chatFechar');
  const enviar = document.getElementById('chatEnviar');
  const input = document.getElementById('chatInput');
  if (!btn || !janela) return;
  btn.addEventListener('click', () => {
    chatAberto = !chatAberto;
    janela.classList.toggle('ativo', chatAberto);
    if (chatAberto) carregarMensagensChat(usuario.id);
  });
  fechar?.addEventListener('click', () => {
    chatAberto = false;
    janela.classList.remove('ativo');
  });
  enviar?.addEventListener('click', async () => {
    const texto = input.value.trim();
    if (!texto) return;
    const res = await api.enviarMensagem({ userId: usuario.id, destinatarioId: null, texto });
    if (res.erro) mostrarToast(res.erro, 'erro');
    else {
      input.value = '';
      carregarMensagensChat(usuario.id);
    }
  });
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') enviar?.click();
  });
}

async function carregarMensagensChat(userId) {
  const container = document.getElementById('chatMensagens');
  if (!container) return;
  const res = await api.listarMensagens(userId);
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = (res.mensagens || []).map(m => {
    const classe = m.remetente === userId ? 'mensagem-enviada' : 'mensagem-recebida';
    return `<div class="${classe}">${escapeHTML(m.texto)}</div>`;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

// ========== PERFIL (REPUTAÇÃO, METAS, E-MAIL, CALENDÁRIO) ==========
function preencherFormularioPerfil(usuario) {
  document.getElementById('perfilNome').value = usuario.nome || '';
  document.getElementById('perfilEmail').value = usuario.email || '';
  const fotoPreview = document.getElementById('fotoPerfilPreview');
  if (fotoPreview) {
    fotoPreview.innerHTML = usuario.foto ? `<img src="${escapeHTML(usuario.foto)}" alt="Foto">` : (usuario.nome || usuario.user).charAt(0).toUpperCase();
  }
  document.getElementById('notifEmail').checked = usuario.notifEmail !== false;

  const reputacao = usuario.reputacao || 0;
  document.getElementById('barraReputacao').style.width = `${reputacao}%`;
  document.getElementById('textoReputacao').textContent = `${reputacao} pontos`;
  if (reputacao > 80) document.getElementById('barraReputacao').style.background = 'var(--sucesso)';
  else if (reputacao > 50) document.getElementById('barraReputacao').style.background = 'var(--aviso)';
  else document.getElementById('barraReputacao').style.background = 'var(--erro)';

  document.getElementById('formPerfil').onsubmit = async (e) => {
    e.preventDefault();
    const nome = document.getElementById('perfilNome').value.trim();
    const email = document.getElementById('perfilEmail').value.trim();
    const senha = document.getElementById('perfilSenha').value;
    const notifEmail = document.getElementById('notifEmail').checked;
    if (!nome || !email) { mostrarToast('Nome e email são obrigatórios.', 'aviso'); return; }
    if (!validarEmail(email)) { mostrarToast('Email inválido.', 'erro'); return; }
    const dados = { nome, email, notifEmail };
    if (senha && senha.length >= 6) dados.senha = senha;
    const res = await api.atualizarPerfil(dados);
    if (res.erro) mostrarToast(res.erro, 'erro');
    else {
      mostrarToast('Perfil atualizado!', 'sucesso');
      const sessao = obterSessao();
      if (sessao) {
        sessao.nome = nome;
        sessao.email = email;
        sessao.notifEmail = notifEmail;
        salvarSessao(sessao, true);
        preencherCabecalho(sessao);
      }
    }
  };

  document.getElementById('btnUploadFoto')?.addEventListener('click', () => document.getElementById('inputFotoPerfil')?.click());
  document.getElementById('inputFotoPerfil')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { mostrarToast('Foto máxima 5MB.', 'erro'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      document.getElementById('fotoPerfilPreview').innerHTML = `<img src="${base64}" alt="Foto">`;
      const res = await api.atualizarPerfil({ foto: base64 });
      if (res.erro) mostrarToast(res.erro, 'erro');
      else {
        mostrarToast('Foto atualizada!', 'sucesso');
        usuario.foto = base64;
        preencherCabecalho(usuario);
      }
    };
    reader.readAsDataURL(file);
  });

  atualizarForcaSenha('perfilSenha', 'forcaSenhaPerfil');
  configurarToggleSenha('perfilSenha', 'toggleSenhaPerfil');
  carregarMetas(usuario.id);
  document.getElementById('btnSalvarMetas')?.addEventListener('click', async () => {
    const diaria = document.getElementById('metaDiaria').value;
    const semanal = document.getElementById('metaSemanal').value;
    if (!diaria && !semanal) { mostrarToast('Defina pelo menos uma meta.', 'aviso'); return; }
    const res = await api.salvarMetas({ userId: usuario.id, diaria, semanal });
    if (res.erro) mostrarToast(res.erro, 'erro');
    else { mostrarToast('Metas guardadas!', 'sucesso'); carregarMetas(usuario.id); }
  });
  
  // 🆕 Exibir medalhas (bónus já recebidos)
  carregarMedalhas(usuario.id);
}

async function carregarMetas(userId) {
  const res = await api.verMetas(userId);
  if (!res || res.erro) return;
  document.getElementById('metaDiaria').value = res.metaDiaria || '';
  document.getElementById('metaSemanal').value = res.metaSemanal || '';
  document.getElementById('metaDiariaValor').textContent = formatarMoeda(res.metaDiaria || 0);
  document.getElementById('metaSemanalValor').textContent = formatarMoeda(res.metaSemanal || 0);
  document.getElementById('ganhoHoje').textContent = formatarMoeda(res.ganhoHoje || 0);
  document.getElementById('ganhoSemana').textContent = formatarMoeda(res.ganhoSemana || 0);
  const percDiario = res.metaDiaria ? Math.min((res.ganhoHoje / res.metaDiaria) * 100, 100) : 0;
  const percSemanal = res.metaSemanal ? Math.min((res.ganhoSemana / res.metaSemanal) * 100, 100) : 0;
  document.getElementById('barraDiaria').style.width = percDiario + '%';
  document.getElementById('barraSemanal').style.width = percSemanal + '%';
}

// 🆕 Exibir medalhas de bónus já recebidos
async function carregarMedalhas(userId) {
  const container = document.getElementById('medalhasContainer');
  if (!container) return;
  const res = await api.listarBonusRecebidos(userId);
  if (res.erro || !res.bonus || res.bonus.length === 0) {
    container.innerHTML = '<p style="font-size:0.85em;color:var(--texto-terciario);">Nenhuma medalha ainda.</p>';
    return;
  }
  container.innerHTML = res.bonus.map(b => `
    <span style="display:inline-block;margin:4px;padding:4px 8px;background:rgba(255,215,0,0.1);border-radius:12px;font-size:0.8em;">
      🏅 ${escapeHTML(b.nivel)} +${formatarMoeda(b.valor)}
    </span>
  `).join('');
}

function configurarToggleSenha(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!input || !btn) return;
  const alternar = () => {
    const tipo = input.type === 'password' ? 'text' : 'password';
    input.type = tipo;
    btn.textContent = tipo === 'password' ? '👁️' : '🙈';
  };
  btn.addEventListener('click', alternar);
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); }
  });
}

// ========== TAREFAS (COM PONTOS E CALENDÁRIO) ==========
async function carregarTarefas(userId) {
  const container = document.getElementById('listaTarefas');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:60px;"></div><div class="skeleton" style="height:60px;margin-top:10px;"></div>';
  const resposta = await api.listarTarefas(userId);
  if (resposta.erro) { container.innerHTML = `<p class="erro">${resposta.erro}</p>`; return; }
  tarefasCache = resposta.tarefas || [];
  exibirTarefas(tarefasCache);
  document.getElementById('tarefasHoje').textContent = '0';
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
    const pontos = tarefa.pontos || converterKzParaPontos(tarefa.valor);
    return `
      <div class="card-tarefa glass" style="margin-bottom:12px;cursor:pointer;" onclick="mostrarDetalhesTarefa('${tarefa.id}')">
        <div class="tarefa-header">
          <span class="tarefa-emoji">${emoji}</span>
          <span class="valor">${formatarPontosComKz(pontos)}</span>
        </div>
        <strong>${escapeHTML(tarefa.titulo)}</strong>
        <p>${escapeHTML(tarefa.descricao || 'Sem descrição')}</p>
        <div class="progresso"><div style="width: ${Math.floor(Math.random() * 40 + 30)}%;"></div></div>
        <div class="tarefa-footer">
          <span>🕒 ${tempoEstimado} | 🏷️ ${tarefa.nivel || 'Todos'}</span>
          <button class="btn btn-sm" onclick="event.stopPropagation();iniciarTarefa('${tarefa.id}')">➡️</button>
        </div>
      </div>
    `;
  }).join('');
}

function filtrarTarefas(termo) {
  if (!termo) { exibirTarefas(tarefasCache); return; }
  const filtradas = tarefasCache.filter(t =>
    (t.titulo || '').toLowerCase().includes(termo) ||
    (t.descricao || '').toLowerCase().includes(termo) ||
    (t.nivel || '').toLowerCase().includes(termo)
  );
  exibirTarefas(filtradas);
}

function mostrarDetalhesTarefa(id) {
  const tarefa = tarefasCache.find(t => t.id == id);
  if (!tarefa) return;
  const conteudo = document.getElementById('detalhesConteudo');
  const titulo = document.getElementById('detalhesTitulo');
  const pontos = tarefa.pontos || converterKzParaPontos(tarefa.valor);

  let btnCalendario = '';
  if (tarefa.prazo) {
    const data = new Date(tarefa.prazo);
    const tituloEnc = encodeURIComponent(tarefa.titulo);
    const inicio = data.toISOString().replace(/-|:|\.\d+/g, '');
    const fim = new Date(data.getTime() + 30 * 60000).toISOString().replace(/-|:|\.\d+/g, '');
    btnCalendario = `
      <a href="https://www.google.com/calendar/render?action=TEMPLATE&text=${tituloEnc}&dates=${inicio}/${fim}&details=${encodeURIComponent(tarefa.descricao || '')}"
         target="_blank" class="btn btn-sm" style="margin-top:10px;display:inline-block;">📅 Adicionar ao Calendário</a>`;
  }

  if (conteudo) {
    conteudo.innerHTML = `
      <div style="text-align:center;margin-bottom:15px;"><span style="font-size:3em;">🧪</span></div>
      <h4 style="color:var(--dourado);">${escapeHTML(tarefa.titulo)}</h4>
      <p>${escapeHTML(tarefa.descricao || '')}</p>
      <p style="color:var(--dourado);font-size:1.4em;font-weight:800;">${formatarPontosComKz(pontos)}</p>
      <p>🕒 ${tarefa.tempoEstimado || 'N/D'} | Nível: ${tarefa.nivel || 'Todos'}</p>
      <button class="btn" onclick="iniciarTarefa('${tarefa.id}')">▶️ Iniciar Tarefa</button>
      ${btnCalendario}
    `;
  }
  if (titulo) titulo.textContent = `Detalhes: ${tarefa.titulo}`;
  const sidebar = document.getElementById('sidebarDetalhes');
  if (sidebar && !sidebar.classList.contains('ativo')) toggleSidebar();
}

function iniciarTarefa(id) {
  const tarefa = tarefasCache.find(t => t.id == id);
  if (!tarefa) return;
  const select = document.getElementById('tarefaSelect');
  if (select) select.value = id;
  document.querySelector('.abas button[data-aba="enviar"]')?.click();
  mostrarToast(`Tarefa "${tarefa.titulo}" selecionada!`, 'sucesso');
}

// ========== ENVIO DE COMPROVATIVO ==========
async function carregarTarefasSelect(userId) {
  const select = document.getElementById('tarefaSelect');
  if (!select) return;
  const res = await api.listarTarefas(userId);
  if (res.erro || !res.tarefas) return;
  select.innerHTML = '<option value="">Selecione uma tarefa...</option>' +
    res.tarefas.map(t => {
      const pontos = t.pontos || converterKzParaPontos(t.valor);
      return `<option value="${t.id}">${escapeHTML(t.titulo)} - ${formatarPontosComKz(pontos)}</option>`;
    }).join('');
}

async function submeterComprovativo(userId) {
  const tarefaId = document.getElementById('tarefaSelect').value;
  const link = document.getElementById('linkComprovativo').value.trim();
  const observacao = document.getElementById('obsEnvio').value.trim();
  const statusDiv = document.getElementById('statusEnvio');
  const fileInput = document.getElementById('arquivoComprovativo');
  const arquivo = fileInput?.files[0];

  if (!tarefaId) { statusDiv.innerHTML = '<p class="erro">Selecione uma tarefa.</p>'; return; }
  if (!link && !arquivo) { statusDiv.innerHTML = '<p class="erro">Forneça um link ou imagem.</p>'; return; }
  if (link && !validarURL(link)) { statusDiv.innerHTML = '<p class="erro">Link inválido.</p>'; return; }

  const btn = document.querySelector('#formEnvio .btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando...'; }

  let dados = { userId, tarefaId, link, observacao };
  if (arquivo) {
    if (arquivo.size > 5 * 1024 * 1024) {
      statusDiv.innerHTML = '<p class="erro">Arquivo máximo 5MB.</p>';
      if (btn) { btn.disabled = false; btn.textContent = '📨 Submeter'; }
      return;
    }
    const reader = new FileReader();
    const base64 = await new Promise(resolve => { reader.onload = e => resolve(e.target.result); reader.readAsDataURL(arquivo); });
    dados.imagem = base64;
  }

  const resposta = await api.submeter(dados);
  if (btn) { btn.disabled = false; btn.textContent = '📨 Submeter'; }

  if (resposta.erro) {
    statusDiv.innerHTML = `<p class="erro">${resposta.erro}</p>`;
  } else {
    statusDiv.innerHTML = '<p class="sucesso">✅ Enviado com sucesso!</p>';
    document.getElementById('formEnvio').reset();
    mostrarToast('Comprovativo submetido!', 'sucesso');
    dispararConfetti();
  }
}

// ========== PARTICIPANTES ==========
async function carregarParticipantes(userId) {
  const container = document.getElementById('participantesPainel');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:100px;"></div>';
  const res = await api.listarParticipantes(userId);
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  participantesCache = res.participantes || [];
  if (participantesCache.length === 0) {
    container.innerHTML = '<p>Nenhum participante no momento.</p>';
    return;
  }
  participantesCache.forEach(p => { if (!p.emoji) p.emoji = gerarEmojiAleatorio(); });
  container.innerHTML = `
    <p>👥 ${participantesCache.length} participantes</p>
    <div class="lista-participantes">
      ${participantesCache.map(p => `
        <div class="card-participante" onclick="abrirChatComParticipante('${p.id}')">
          <div class="avatar-emoji">${p.emoji}</div>
          <div class="nome-participante">${escapeHTML(p.nome || 'Anônimo')}</div>
          <div class="status-participante">${p.online ? '🟢 Online' : '⚪ Offline'}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function abrirChatComParticipante(id) {
  const janela = document.getElementById('chatJanela');
  const btn = document.getElementById('btnChatFloat');
  if (!janela || !btn) return;
  if (!janela.classList.contains('ativo')) btn.click();
  mostrarToast(`Chat com participante #${id} aberto.`, 'info');
}

// ========== TAREFAS ESPECIAIS ==========
function configurarTarefasEspeciais(userId) {
  const form = document.getElementById('formEspecial');
  const btnCriar = document.getElementById('btnNovaEspecial');
  const container = document.getElementById('formEspecialContainer');

  btnCriar?.addEventListener('click', () => container?.classList.toggle('oculto'));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('especialNome').value.trim();
    const descricao = document.getElementById('especialDescricao').value.trim();
    const link = document.getElementById('especialLink').value.trim();
    if (!nome) { mostrarToast('Nome é obrigatório.', 'aviso'); return; }
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('nome', nome);
    formData.append('descricao', descricao);
    formData.append('link', link);
    const imagens = document.getElementById('especialImagens').files;
    for (let img of imagens) formData.append('imagens', img);
    const audio = document.getElementById('especialAudio').files[0];
    if (audio) formData.append('audio', audio);
    const video = document.getElementById('especialVideo').files[0];
    if (video) formData.append('video', video);

    const res = await api.criarTarefaEspecial(formData);
    if (res.erro) mostrarToast(res.erro, 'erro');
    else {
      mostrarToast('Tarefa especial enviada!', 'sucesso');
      form.reset();
      container?.classList.add('oculto');
      carregarMinhasTarefasEspeciais(userId);
    }
  });

  carregarMinhasTarefasEspeciais(userId);
}

async function carregarMinhasTarefasEspeciais(userId) {
  const container = document.getElementById('listaEspeciais');
  if (!container) return;
  const res = await api.listarTarefasEspeciais(userId);
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  if (!res.tarefas || res.tarefas.length === 0) {
    container.innerHTML = '<p>Nenhuma tarefa especial enviada.</p>';
    return;
  }
  container.innerHTML = res.tarefas.map(t => `
    <div class="card-tarefa">
      <strong>${escapeHTML(t.nome)}</strong>
      <p>${escapeHTML(t.descricao || '')}</p>
      <small>${t.aprovado ? '✅ Aprovado' : '⏳ Pendente'}</small>
    </div>
  `).join('');
}

// ========== DICAS ==========
function configurarDicas(userId) {
  const botoesSub = document.querySelectorAll('#subAbasDicas button[data-subaba]');
  const paineisSub = {
    aplicativos: document.getElementById('subAplicativos'),
    regras: document.getElementById('subRegras'),
    ajuda: document.getElementById('subAjuda'),
    reclamacoes: document.getElementById('subReclamacoes')
  };
  botoesSub.forEach(btn => {
    btn.addEventListener('click', () => {
      botoesSub.forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      Object.values(paineisSub).forEach(p => p?.classList.add('oculto'));
      const aba = btn.dataset.subaba;
      paineisSub[aba]?.classList.remove('oculto');
      switch(aba) {
        case 'aplicativos': carregarAplicativos(userId); break;
        case 'regras': carregarConteudoDica('regras', document.getElementById('conteudoRegras')); break;
        case 'ajuda': carregarConteudoDica('ajuda', document.getElementById('conteudoAjuda')); break;
        case 'reclamacoes': configurarReclamacoes(userId); break;
      }
    });
  });

  document.getElementById('formAplicativo')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('appNome').value.trim();
    const descricao = document.getElementById('appDescricao').value.trim();
    const arquivo = document.getElementById('appArquivo').files[0];
    if (!nome || !arquivo) { mostrarToast('Preencha o nome e selecione um ficheiro.', 'aviso'); return; }
    if (arquivo.size > 20 * 1024 * 1024) { mostrarToast('Ficheiro máximo 20MB.', 'erro'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      const res = await api.enviarAplicativo({ userId, nome, descricao, arquivo: base64, nomeArquivo: arquivo.name });
      if (res.erro) mostrarToast(res.erro, 'erro');
      else {
        mostrarToast('Aplicativo enviado para moderação!', 'sucesso');
        document.getElementById('formAplicativo').reset();
        carregarAplicativos(userId);
      }
    };
    reader.readAsDataURL(arquivo);
  });

  botoesSub[0]?.click();
}

async function carregarAplicativos(userId) {
  const container = document.getElementById('listaAplicativos');
  if (!container) return;
  const res = await api.listarAplicativos(userId);
  if (res.erro) { container.innerHTML = `<p class="erro">${res.erro}</p>`; return; }
  container.innerHTML = res.aplicativos?.length ? res.aplicativos.map(a => `
    <div style="padding:8px;border-bottom:1px solid var(--borda-vidro);">
      <strong>${escapeHTML(a.nome)}</strong>
      <a href="${escapeHTML(a.url)}" target="_blank" style="color:var(--dourado);">⬇️ Download</a>
      <small style="display:block;">${escapeHTML(a.descricao || '')}</small>
    </div>
  `).join('') : '<p>Nenhum aplicativo disponível.</p>';
}

async function carregarConteudoDica(tipo, container) {
  if (!container) return;
  container.innerHTML = '<p>Carregando...</p>';
  const res = await api.getConteudo(tipo);
  container.innerHTML = res.conteudo || 'Nenhum conteúdo definido.';
}

function configurarReclamacoes(userId) {
  const form = document.getElementById('formReclamacao');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = document.getElementById('reclamacaoTexto').value.trim();
    const arquivo = document.getElementById('reclamacaoArquivo').files[0];
    if (!texto) { mostrarToast('Descreva sua reclamação.', 'aviso'); return; }
    let arquivoBase64 = null;
    if (arquivo) {
      if (arquivo.size > 20 * 1024 * 1024) { mostrarToast('Ficheiro máximo 20MB.', 'erro'); return; }
      const reader = new FileReader();
      arquivoBase64 = await new Promise(resolve => { reader.onload = e => resolve(e.target.result); reader.readAsDataURL(arquivo); });
    }
    const res = await api.enviarReclamacao({ userId, texto, arquivo: arquivoBase64, nomeArquivo: arquivo?.name });
    if (res.erro) mostrarToast(res.erro, 'erro');
    else {
      mostrarToast('Reclamação enviada.', 'sucesso');
      form.reset();
    }
  });
}

// ========== SALDO E SAQUE (CONVERSÃO DE PONTOS) ==========
async function carregarSaldo(userId) {
  const res = await api.verSaldo(userId);
  if (res.erro) {
    document.getElementById('saldoResgate').textContent = 'Erro';
    return;
  }
  const pontos = res.pontos || 0;
  const taxa = obterTaxaConversao();
  const valorKz = converterPontosParaKz(pontos, taxa);
  
  document.getElementById('saldoResgate').textContent = formatarPontosComKz(pontos);
  document.getElementById('saldoAtual').textContent = formatarPontosComKz(pontos);

  const valorInput = document.getElementById('valorSaque');
  if (valorInput) {
    valorInput.min = 500;
    valorInput.placeholder = 'Mínimo 500 Kz';
  }

  document.getElementById('btnSolicitarSaque').onclick = async () => {
    const valorKzSaque = Number(document.getElementById('valorSaque').value);
    const metodo = document.getElementById('metodoSaque').value;
    if (valorKzSaque < 500 || !metodo) {
      mostrarToast('Valor mínimo 500 Kz e selecione um método.', 'aviso');
      return;
    }
    if (valorKzSaque > valorKz) {
      mostrarToast('Saldo insuficiente.', 'erro');
      return;
    }
    const dados = { userId, valor: valorKzSaque, metodo };
    const resposta = await api.pedirSaque(dados);
    if (resposta.erro) {
      mostrarToast(resposta.erro, 'erro');
    } else {
      mostrarToast('Pedido de saque enviado!', 'sucesso');
      carregarSaldo(userId);
    }
  };
}

// ========== ANÚNCIOS ROLANTES ==========
async function carregarAnuncios() {
  const container = document.getElementById('anunciosRolantes');
  if (!container) return;
  const res = await api.listarAnuncios();
  if (res.erro || !res.anuncios || res.anuncios.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = res.anuncios.map(a => `
    <button class="anuncio-btn" onclick="window.open('${escapeHTML(a.link || '#')}', '${a.link && a.link.startsWith('/') ? '_self' : '_blank'}')">
      ${a.imagem ? `<img src="${escapeHTML(a.imagem)}" alt="">` : ''}
      <span>${escapeHTML(a.texto)}</span>
    </button>
  `).join('');
}

// ========== NOTIFICAÇÕES ==========
function carregarNotificacoes() {
  const salvas = localStorage.getItem('ng_notificacoes');
  notificacoes = salvas ? JSON.parse(salvas) : [];
  atualizarBadge();
}

function adicionarNotificacao(titulo, mensagem) {
  notificacoes.unshift({ id: gerarId('notif'), titulo, mensagem, data: new Date().toISOString(), lida: false });
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
    mostrarToast('Nenhuma notificação.', 'info');
    return;
  }
  alert(`🔔 Notificações:\n\n${naoLidas.map(n => n.titulo).join('\n')}`);
  notificacoes.forEach(n => n.lida = true);
  localStorage.setItem('ng_notificacoes', JSON.stringify(notificacoes));
  atualizarBadge();
}

// ========== MENSAGENS MOTIVACIONAIS ==========
async function verificarMensagensMotivacionais() {
  try {
    const res = await api.listarMensagens();
    if (res.erro || !res.mensagens) return;
    const agora = Date.now();
    const ultimaExibicao = parseInt(localStorage.getItem('ng_ultima_msg') || '0');
    
    res.mensagens.filter(m => m.ativa).forEach(m => {
      if (m.tipo === 'login' || m.tipo === 'ambos') {
        if (!mensagensExibidas.includes(m.id)) {
          exibirPopUpMotivacional(m.texto);
          mensagensExibidas.push(m.id);
        }
      }
    });
    
    if (agora - ultimaExibicao > 2 * 60 * 60 * 1000) {
      res.mensagens.filter(m => m.ativa && (m.tipo === 'periodica' || m.tipo === 'ambos')).forEach(m => {
        exibirPopUpMotivacional(m.texto);
      });
      localStorage.setItem('ng_ultima_msg', agora.toString());
    }
  } catch (e) {}
}

function agendarMensagensPeriodicas() {
  setInterval(verificarMensagensMotivacionais, 2 * 60 * 60 * 1000);
}

function exibirPopUpMotivacional(texto) {
  const popup = document.createElement('div');
  popup.className = 'popup-motivacional';
  popup.innerHTML = `
    <div class="popup-conteudo glass">
      <p>${escapeHTML(texto)}</p>
      <button class="btn btn-sm" onclick="this.parentElement.parentElement.remove()">OK</button>
    </div>
  `;
  popup.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;';
  document.body.appendChild(popup);
  setTimeout(() => { if (popup.parentNode) popup.remove(); }, 10000);
}

// ========== CONFETTI ==========
function dispararConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  const cores = ['#FFD700', '#FFED4A', '#B8860B', '#4CAF50', '#FF4444', '#42A5F5'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
    piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 3500);
}

// ========== EXPORTAÇÕES GLOBAIS ==========
window.toggleSidebar = toggleSidebar;
window.iniciarTarefa = iniciarTarefa;
window.mostrarDetalhesTarefa = mostrarDetalhesTarefa;
window.abrirNotificacoes = abrirNotificacoes;
window.abrirChatComParticipante = abrirChatComParticipante;