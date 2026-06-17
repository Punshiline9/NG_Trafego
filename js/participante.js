document.addEventListener('DOMContentLoaded', () => {
  const usuario = verificarAutenticacao();
  if (!usuario) return;
  document.getElementById('nomeUser').textContent = usuario.nome || usuario.user;

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
    buscaInput.addEventListener('input', function () {
      const termo = this.value.toLowerCase();
      filtrarTarefas(termo);
    });
  }

  const formEnvio = document.getElementById('formEnvio');
  if (formEnvio) {
    formEnvio.addEventListener('submit', async function (e) {
      e.preventDefault();
      await submeterComprovativo(usuario.id);
    });
  }

  const btnSaque = document.getElementById('btnPedirSaque');
  if (btnSaque) {
    btnSaque.addEventListener('click', () => pedirSaque(usuario.id));
  }
});

// ====== TAREFAS E BUSCA ======
let tarefasCache = [];

async function carregarTarefas(userId) {
  const container = document.getElementById('listaTarefas');
  if (!container) return;
  container.innerHTML = '<p>A carregar tarefas...</p>';
  const resposta = await api.listarTarefas(userId);
  if (resposta.erro) {
    container.innerHTML = `<p class="erro">${resposta.erro}</p>`;
    return;
  }
  tarefasCache = resposta.tarefas || [];
  exibirTarefas(tarefasCache);
}

function exibirTarefas(tarefas) {
  const container = document.getElementById('listaTarefas');
  if (!container) return;
  if (tarefas.length === 0) {
    container.innerHTML = '<p>Nenhuma tarefa disponível.</p>';
    return;
  }
  container.innerHTML = tarefas.map(tarefa => `
    <div class="card-tarefa">
      <strong>${escapeHTML(tarefa.titulo)}</strong>
      <p>${escapeHTML(tarefa.descricao || '')}</p>
      <p class="valor">${formatarMoeda(tarefa.valor)}</p>
      <small>⏱️ ${tarefa.tempoEstimado || 'N/D'} | Nível: ${tarefa.nivel || 'Todos'}</small>
    </div>
  `).join('');
}

function filtrarTarefas(termo) {
  if (!termo) {
    exibirTarefas(tarefasCache);
    return;
  }
  const filtradas = tarefasCache.filter(t => {
    return t.titulo.toLowerCase().includes(termo) ||
           (t.descricao && t.descricao.toLowerCase().includes(termo));
  });
  exibirTarefas(filtradas);
}

// ====== ENVIO ======
async function submeterComprovativo(userId) {
  const tarefaId = document.getElementById('tarefaSelect').value;
  const link = document.getElementById('linkComprovativo').value.trim();
  const observacao = document.getElementById('obsEnvio').value.trim();
  const msgStatus = document.getElementById('statusEnvio');

  if (!tarefaId || !link) {
    msgStatus.innerHTML = '<p class="erro">Selecione a tarefa e insira o link do comprovativo.</p>';
    return;
  }
  const resposta = await api.submeter({ userId, tarefaId, link, observacao });
  if (resposta.erro) {
    msgStatus.innerHTML = `<p class="erro">${resposta.erro}</p>`;
  } else {
    msgStatus.innerHTML = `<p class="sucesso">${resposta.mensagem || 'Enviado com sucesso!'}</p>`;
    document.getElementById('formEnvio').reset();
  }
}

// ====== EQUIPA ======
async function carregarEquipa(userId) {
  const container = document.getElementById('equipaPainel');
  if (!container) return;
  container.innerHTML = '<p>A carregar equipa...</p>';
  container.innerHTML = `
    <div class="progresso">
      <div style="width: ${Math.floor(Math.random() * 100)}%;"></div>
    </div>
    <p>Progresso da equipa: <span class="texto-dourado">${Math.floor(Math.random() * 100)}%</span></p>
    <div class="equipa-lista">
      <div class="membro-equipa"><span class="bandeira">🇧🇷</span><p class="nome">Bot 1</p></div>
      <div class="membro-equipa"><span class="bandeira">🇦🇴</span><p class="nome">Bot 2</p></div>
      <div class="membro-equipa"><span class="bandeira">🇵🇹</span><p class="nome">Bot 3</p></div>
    </div>
  `;
}

// ====== SALDO E SAQUE ======
async function carregarSaldo(userId) {
  const container = document.getElementById('resgatePainel');
  if (!container) return;
  container.innerHTML = '<p>A carregar saldo...</p>';
  const resposta = await api.verSaldo(userId);
  if (resposta.erro) {
    container.innerHTML = `<p class="erro">${resposta.erro}</p>`;
    return;
  }
  container.innerHTML = `
    <div class="saldo-atual">${formatarMoeda(resposta.saldo)}</div>
    <p>Saldo disponível para saque</p>
    <button class="btn" id="btnPedirSaque">Pedir Saque</button>
    <p id="msgSaque" class="erro"></p>
  `;
  document.getElementById('btnPedirSaque').addEventListener('click', () => pedirSaque(userId));
}

async function pedirSaque(userId) {
  const valor = prompt('Quanto deseja sacar? (mínimo 500 Kz)');
  if (!valor) return;
  const valorNum = Number(valor);
  if (isNaN(valorNum) || valorNum < 500) {
    alert('Valor inválido. Mínimo de 500 Kz.');
    return;
  }
  const resposta = await api.pedirSaque(userId, valorNum);
  if (resposta.erro) {
    document.getElementById('msgSaque').textContent = resposta.erro;
  } else {
    alert('Pedido de saque enviado! Aguarde o comprovativo do gestor.');
    carregarSaldo(userId);
  }
}

// ====== INFORMAÇÕES (AGORA VIA PÁGINA DINÂMICA) ======
async function carregarInfo() {
  const container = document.getElementById('infoPainel');
  if (!container) return;
  container.innerHTML = '<p>A carregar informações...</p>';

  // Buscar a página com título "info_geral"
  const res = await api.listarPaginas();
  if (res.erro) {
    container.innerHTML = `<p class="erro">${res.erro}</p>`;
    return;
  }
  const paginaInfo = res.paginas.find(p => p.titulo.toLowerCase() === 'info_geral');
  if (!paginaInfo) {
    // Conteúdo padrão se o gestor ainda não tiver criado a página
    container.innerHTML = `
      <div class="info-texto">
        <h3>📜 Regras</h3>
        <p>Complete tarefas para ganhar pontos. Cada tarefa aprovada adiciona saldo à sua conta.</p>
        <h3>⚖️ Leis</h3>
        <p>Respeite as regras da plataforma. Submissões fraudulentas resultam em banimento.</p>
        <h3>🎓 Tutorial</h3>
        <p>1. Vá em Tarefas e escolha uma.<br>2. Siga as instruções e submeta o comprovativo.<br>3. Aguarde aprovação e acumule saldo.<br>4. Peça saque quando desejar.</p>
        <p style="margin-top:15px; font-style:italic;">O gestor ainda não personalizou esta página.</p>
      </div>
    `;
    return;
  }
  // Exibir o conteúdo da página (pode conter HTML formatado)
  container.innerHTML = `<div class="info-texto">${paginaInfo.conteudo}</div>`;
}