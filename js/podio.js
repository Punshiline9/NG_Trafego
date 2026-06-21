// =============================================
// 🏆 NG TAREFAS - PÓDIO (VERSÃO REFORÇADA)
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('podio');
  if (!container) return;

  // Garantir que funções utilitárias existam
  if (typeof formatarMoeda === 'undefined') {
    window.formatarMoeda = (v) => Number(v).toFixed(2).replace('.', ',') + ' Kz';
  }

  criarParticulas();

  // Tenta carregar da API em tempo real
  let dados = await carregarDadosPodio();

  // Fallback para sessionStorage se a API não retornar dados
  if (!dados || dados.length === 0) {
    const sessionData = sessionStorage.getItem('podioData');
    if (sessionData) {
      try {
        dados = JSON.parse(sessionData);
      } catch (e) {}
    }
  }

  exibirPodio(container, dados);
});

// ========== CARREGAR DADOS (API) ==========
async function carregarDadosPodio() {
  try {
    const res = await api.listarTarefas(0); // Podemos usar um endpoint genérico
    if (res && !res.erro && res.tarefas) {
      // Simulação: obter utilizadores com mais submissões aprovadas
      // Idealmente haveria um endpoint 'listarPodium'
      const resposta = await api.buscar('podium');
      if (resposta && !resposta.erro && resposta.participantes) {
        return resposta.participantes;
      }
    }
  } catch (e) {
    console.warn('⚠️ Pódio: erro ao carregar dados da API, usando sessionStorage');
  }
  return null;
}

// ========== EXIBIR PÓDIO ==========
function exibirPodio(container, dados) {
  // Se dados vier como objeto { participantes: [...] }, normalizar
  if (dados && dados.participantes && Array.isArray(dados.participantes)) {
    dados = dados.participantes;
  }

  if (!Array.isArray(dados) || dados.length === 0) {
    container.innerHTML = `
      <div class="podio-vazio">
        <p style="font-size:3em;margin-bottom:15px;">🏆</p>
        <p>O pódio ainda não foi gerado pelo gestor.</p>
        <p style="font-size:0.85em;margin-top:8px;">Os vencedores aparecerão aqui em breve!</p>
        <button class="btn" onclick="location.reload()" style="margin-top:20px;">🔄 Atualizar</button>
      </div>`;
    return;
  }

  const medalhas = ['🥇', '🥈', '🥉'];
  const classes = ['ouro', 'prata', 'bronze'];
  const rotulos = ['1º Lugar', '2º Lugar', '3º Lugar'];

  container.innerHTML = dados.slice(0, 10).map((p, i) => {
    const medalha = medalhas[i] || '🏅';
    const classe = classes[i] || '';
    const rotulo = rotulos[i] || `${i + 1}º Lugar`;
    const nome = escapeHTML(p.nome || 'Anónimo');
    const pontos = formatarMoeda(p.pontos || p.saldo || 0);
    const emoji = p.emoji || '';

    return `
      <div class="posicao ${classe}" style="animation: fadeInUp 0.5s ${i * 0.1}s both;">
        <div class="trofeu">${medalha}</div>
        <div class="nome-participante">${emoji} ${nome}</div>
        <div class="pontos-participante">${pontos}</div>
        <small style="color:var(--texto-terciario);margin-top:4px;">${rotulo}</small>
      </div>
    `;
  }).join('');

  // Inserir subtítulo se existir o elemento
  const h1 = document.querySelector('.podio-container h1');
  if (h1 && !document.querySelector('.subtitulo')) {
    h1.insertAdjacentHTML('afterend', '<p class="subtitulo" style="color:var(--dourado);text-align:center;">🎉 Os melhores do momento!</p>');
  }

  // Rodapé de créditos
  if (!document.querySelector('.creditos')) {
    const rodape = document.createElement('div');
    rodape.className = 'creditos';
    rodape.innerHTML = '<span class="selo-verificado">✔️ Verificado</span> © ' + new Date().getFullYear() + ' Pacheco Gonçalves — Todos os direitos reservados.';
    document.body.appendChild(rodape);
  }
}

// ========== PARTÍCULAS (COM ESTILOS INLINE DE FALLBACK) ==========
function criarParticulas() {
  const container = document.createElement('div');
  container.className = 'particulas';
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';

  for (let i = 0; i < 12; i++) {
    const particula = document.createElement('div');
    particula.className = 'particula';
    particula.style.cssText = `
      position: absolute;
      width: 6px;
      height: 6px;
      background: var(--dourado);
      border-radius: 50%;
      opacity: 0.3;
      animation: flutuar ${5 + Math.random() * 10}s linear infinite;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 5}s;
    `;
    container.appendChild(particula);
  }

  // Inserir animação keyframes se não existir no CSS
  if (!document.querySelector('#anim-particulas')) {
    const style = document.createElement('style');
    style.id = 'anim-particulas';
    style.textContent = `
      @keyframes flutuar {
        0% { transform: translateY(0) translateX(0); opacity: 0.3; }
        50% { transform: translateY(-60px) translateX(30px); opacity: 0.6; }
        100% { transform: translateY(0) translateX(0); opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(container);
}