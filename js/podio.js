document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('podio');
  if (!container) return;

  // Obter dados do pódio (guardados pelo gestor)
  const dadosJSON = sessionStorage.getItem('podioData');
  if (!dadosJSON) {
    container.innerHTML = '<p class="podio-vazio">🏆 O pódio ainda não foi gerado pelo gestor.</p>';
    return;
  }

  let dados;
  try {
    dados = JSON.parse(dadosJSON);
  } catch (e) {
    container.innerHTML = '<p class="erro">Erro ao carregar os dados do pódio.</p>';
    return;
  }

  if (!Array.isArray(dados) || dados.length === 0) {
    container.innerHTML = '<p class="podio-vazio">Nenhum participante classificado.</p>';
    return;
  }

  // Medalhas por posição
  const medalhas = ['🥇', '🥈', '🥉'];
  const classes = ['ouro', 'prata', 'bronze'];

  container.innerHTML = dados.map((p, i) => {
    const medalha = medalhas[i] || '🏅';
    const classe = classes[i] || '';
    return `
      <div class="posicao ${classe}">
        <div class="trofeu">${medalha}</div>
        <h2>${escapeHTML(p.nome || '---')}</h2>
        <p>${formatarMoeda(p.pontos || 0)}</p>
      </div>
    `;
  }).join('');

  // Rodapé com créditos
  const rodape = document.createElement('div');
  rodape.className = 'creditos';
  rodape.innerHTML = `<span class="selo-verificado">✔️ Verificado</span> © ${new Date().getFullYear()} Pacheco Gonçalves — Todos os direitos reservados.`;
  document.body.appendChild(rodape);
});