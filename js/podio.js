// =============================================
// 🏆 NG TRAFEGO - PÓDIO FINAL
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('podio');
  if (!container) return;

  criarParticulas();

  const dadosJSON = sessionStorage.getItem('podioData');
  
  if (!dadosJSON) {
    container.innerHTML = `
      <div class="podio-vazio">
        <p style="font-size:3em;margin-bottom:15px;">🏆</p>
        <p>O pódio ainda não foi gerado pelo gestor.</p>
        <p style="font-size:0.85em;margin-top:8px;">Volte mais tarde para ver os vencedores!</p>
      </div>`;
    return;
  }

  let dados;
  try {
    dados = JSON.parse(dadosJSON);
  } catch (e) {
    container.innerHTML = '<p class="erro">❌ Erro ao carregar os dados do pódio.</p>';
    return;
  }

  if (!Array.isArray(dados) || dados.length === 0) {
    container.innerHTML = `
      <div class="podio-vazio">
        <p style="font-size:3em;margin-bottom:15px;">🏅</p>
        <p>Nenhum participante classificado.</p>
      </div>`;
    return;
  }

  const medalhas = ['🥇', '🥈', '🥉'];
  const classes = ['ouro', 'prata', 'bronze'];
  const rotulos = ['1º Lugar', '2º Lugar', '3º Lugar'];

  container.innerHTML = dados.map((p, i) => {
    const medalha = medalhas[i] || '🏅';
    const classe = classes[i] || '';
    const rotulo = rotulos[i] || `${i + 1}º Lugar`;
    
    return `
      <div class="posicao ${classe}">
        <div class="trofeu">${medalha}</div>
        <div class="nome-participante">${escapeHTML(p.nome || 'Anônimo')}</div>
        <div class="pontos-participante">${formatarMoeda(p.pontos || 0)}</div>
        <small style="color:var(--texto-terciario);margin-top:4px;">${rotulo}</small>
      </div>
    `;
  }).join('');

  const h1 = document.querySelector('.podio-container h1');
  if (h1) {
    h1.insertAdjacentHTML('afterend', '<p class="subtitulo">🎉 Os melhores do momento!</p>');
  }

  const rodape = document.createElement('div');
  rodape.className = 'creditos';
  rodape.innerHTML = '<span class="selo-verificado">✔️ Verificado</span> © ' + new Date().getFullYear() + ' Pacheco Gonçalves — Todos os direitos reservados.';
  document.body.appendChild(rodape);
});

function criarParticulas() {
  const container = document.createElement('div');
  container.className = 'particulas';
  
  for (let i = 0; i < 8; i++) {
    const particula = document.createElement('div');
    particula.className = 'particula';
    container.appendChild(particula);
  }
  
  document.body.appendChild(container);
}