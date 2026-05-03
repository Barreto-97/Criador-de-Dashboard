/**
 * main.js
 * Orquestrador principal — controla fluxo de telas, eventos e integrações
 */

/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
const AppState = {
  currentScreen: 'screen-upload',
  uploadedFile: null,
  parsedData: null,
  schema: null,
  intent: null,
  suggestions: [],
  selectedSuggestion: null,
  selectedTheme: 'corporate'
};

/* ============================================================
   NAVEGAÇÃO
   ============================================================ */
function goToScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.style.display = 'flex';
    target.classList.add('active');
    AppState.currentScreen = screenId;
  }
}

/* ============================================================
   TELA 1 — UPLOAD
   ============================================================ */

// Configura drag & drop
document.addEventListener('DOMContentLoaded', () => {
  // Garante que apenas a tela de upload é visível no início
  document.querySelectorAll('.screen').forEach(s => {
    if (!s.classList.contains('active')) s.style.display = 'none';
  });
  document.getElementById('screen-upload').style.display = 'flex';

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  // Drag over
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.getElementById('upload-card').classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    document.getElementById('upload-card').classList.remove('drag-over');
  });

  // Drop
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    document.getElementById('upload-card').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  });

  // Input change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelected(file);
  });

  // Clique na drop zone (fora do botão)
  dropZone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      fileInput.click();
    }
  });

  // Enter no chat
  document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Theme radio change
  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      AppState.selectedTheme = e.target.value;
      AIEngine.setSelectedTheme(e.target.value);
    });
  });
});

/**
 * Processa o arquivo selecionado
 */
async function handleFileSelected(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (!['xlsx', 'csv', 'xls'].includes(ext)) {
    showToast('Formato inválido. Use arquivos .xlsx ou .csv', 'error');
    return;
  }

  showLoading('Lendo e analisando arquivo...');

  try {
    const result = await DataProcessor.readFile(file);
    AppState.uploadedFile = file;
    AppState.parsedData = result.data;
    AppState.schema = result.schema;

    hideLoading();

    // Atualiza UI de status
    document.getElementById('drop-zone').classList.add('hidden');
    const statusEl = document.getElementById('upload-status');
    statusEl.classList.remove('hidden');
    document.getElementById('status-filename').textContent = file.name;
    document.getElementById('status-meta').textContent =
      `${result.rowCount.toLocaleString('pt-BR')} linhas · ${result.schema.length} colunas · ${(file.size / 1024).toFixed(1)} KB`;

    document.getElementById('btn-next-chat').disabled = false;
    showToast(`Arquivo carregado com sucesso! ${result.rowCount} registros detectados.`, 'success');

  } catch (err) {
    hideLoading();
    showToast(err.message, 'error');
  }
}

/**
 * Reseta o upload
 */
function resetUpload() {
  AppState.uploadedFile = null;
  AppState.parsedData = null;
  AppState.schema = null;

  document.getElementById('drop-zone').classList.remove('hidden');
  document.getElementById('upload-status').classList.add('hidden');
  document.getElementById('btn-next-chat').disabled = true;
  document.getElementById('file-input').value = '';
}

/**
 * Avança para o chat
 */
function goToChat() {
  if (!AppState.schema) return;

  goToScreen('screen-chat');
  populateDataPanel(AppState.schema, AppState.parsedData);
}

/**
 * Preenche o painel lateral de dados detectados
 */
function populateDataPanel(schema, data) {
  const panel = document.getElementById('data-preview-panel');

  const typeLabels = { number: 'NUM', date: 'DATA', text: 'TEXTO', category: 'CAT' };
  const typeClass  = { number: 'num', date: 'date', text: 'text', category: 'text' };

  panel.innerHTML = `
    <p style="font-size:12px;color:var(--text3);margin-bottom:16px;">
      ${data.length.toLocaleString('pt-BR')} linhas · ${schema.length} colunas
    </p>
  `;

  schema.forEach(col => {
    const sample = col.samples[0] !== undefined ? String(col.samples[0]).substring(0, 20) : '—';
    const div = document.createElement('div');
    div.className = 'data-col-item';
    div.innerHTML = `
      <span class="col-type-badge ${typeClass[col.type] || 'text'}">${typeLabels[col.type] || 'TEXT'}</span>
      <span class="col-name">${col.name}</span>
      <span class="col-sample">${sample}</span>
    `;
    panel.appendChild(div);
  });
}

/* ============================================================
   TELA 2 — CHAT IA
   ============================================================ */

/**
 * Usa sugestão rápida
 */
function useSuggestion(btn) {
  document.getElementById('chat-input').value = btn.textContent;
  document.getElementById('chat-suggestions').classList.add('hidden');
}

/**
 * Envia mensagem para o chat
 */
async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();

  if (!text) return;
  if (!AppState.parsedData || !AppState.schema) {
    showToast('Dados não carregados. Volte e faça o upload.', 'error');
    return;
  }

  // Adiciona msg do usuário
  appendChatMessage(text, 'user');
  input.value = '';
  input.disabled = true;
  document.getElementById('btn-send-chat').disabled = true;

  // Processa intenção
  await sleep(800);

  const intent = AIEngine.parseIntent(text, AppState.schema);
  AppState.intent = intent;

  const aiResponse = AIEngine.generateChatResponse(text, intent, AppState.schema);
  appendChatMessage(aiResponse, 'ai');

  await sleep(1200);

  showLoading('Gerando sugestões de layout...');

  try {
    await sleep(1000);

    const suggestions = AIEngine.generateLayoutSuggestions(intent, AppState.schema, AppState.parsedData);
    AppState.suggestions = suggestions;

    hideLoading();
    appendChatMessage('Pronto! Preparei 3 opções de dashboard para você. Clique abaixo para ver e escolher o seu favorito.', 'ai');

    await sleep(500);

    // Avança para sugestões
    goToScreen('screen-suggestions');
    renderSuggestions(suggestions);

  } catch (err) {
    hideLoading();
    showToast('Erro ao gerar sugestões: ' + err.message, 'error');
  }

  input.disabled = false;
  document.getElementById('btn-send-chat').disabled = false;
}

/**
 * Adiciona mensagem no chat
 */
function appendChatMessage(text, role) {
  const container = document.getElementById('chat-messages');
  const label = role === 'ai' ? 'IA' : 'EU';

  const div = document.createElement('div');
  div.className = `msg ${role}`;

  // Converte **texto** em <strong>
  const formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  div.innerHTML = `
    <div class="msg-avatar">${label}</div>
    <div class="msg-bubble">${formatted}</div>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

/* ============================================================
   TELA 3 — SUGESTÕES
   ============================================================ */

/**
 * Renderiza cards de sugestão de layout
 */
function renderSuggestions(suggestions) {
  const grid = document.getElementById('suggestions-grid');
  grid.innerHTML = '';

  suggestions.forEach((sug, i) => {
    const card = document.createElement('div');
    card.className = 'suggestion-card' + (i === 0 ? ' selected' : '');
    card.dataset.id = sug.id;
    card.onclick = () => selectSuggestion(card, sug);

    card.innerHTML = `
      <span class="card-badge">SELECIONADO</span>
      <div class="card-preview ${sug.previewLayout}">
        ${buildPreviewBlocks(sug.previewLayout)}
      </div>
      <div class="card-info">
        <div class="card-title">${sug.title}</div>
        <div class="card-desc">${sug.description}</div>
        <div class="card-tags">
          ${sug.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Seleciona o primeiro por padrão
  if (suggestions.length > 0) {
    AppState.selectedSuggestion = suggestions[0];
    AIEngine.setSelectedLayout(suggestions[0]);
  }
}

/**
 * Monta os blocos de preview para cada layout
 */
function buildPreviewBlocks(layoutType) {
  const configs = {
    'layout-1': `
      <div class="preview-block kpi span3">KPI · KPI · KPI</div>
      <div class="preview-block chart span2">LINHA / BARRAS</div>
      <div class="preview-block table">TABELA</div>
    `,
    'layout-2': `
      <div class="preview-block kpi span2">KPIs RESUMIDOS</div>
      <div class="preview-block chart">BARRAS H</div>
      <div class="preview-block chart">PIZZA</div>
    `,
    'layout-3': `
      <div class="preview-block chart rowspan2">GRÁFICO PRINCIPAL</div>
      <div class="preview-block kpi">KPI</div>
      <div class="preview-block table">TABELA</div>
    `
  };
  return configs[layoutType] || configs['layout-1'];
}

/**
 * Seleciona uma sugestão
 */
function selectSuggestion(cardEl, sug) {
  document.querySelectorAll('.suggestion-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');
  AppState.selectedSuggestion = sug;
  AIEngine.setSelectedLayout(sug);
}

/* ============================================================
   TELA 4 — DASHBOARD
   ============================================================ */

/**
 * Gera o dashboard final
 */
async function generateDashboard() {
  if (!AppState.selectedSuggestion) {
    showToast('Por favor, selecione um layout de dashboard', 'error');
    return;
  }

  const theme = AppState.selectedTheme;
  AIEngine.setSelectedTheme(theme);

  showLoading('Gerando seu dashboard...');

  try {
    await sleep(1200);

    // Aplica tema
    applyTheme(theme);

    goToScreen('screen-dashboard');

    await sleep(300);

    ChartRenderer.buildDashboard(
      'dashboard-container',
      AppState.selectedSuggestion,
      AppState.parsedData,
      AppState.schema,
      theme,
      AppState.intent
    );

    hideLoading();

  } catch (err) {
    hideLoading();
    showToast('Erro ao gerar dashboard: ' + err.message, 'error');
    console.error(err);
  }
}

/**
 * Aplica o tema ao body
 */
function applyTheme(theme) {
  document.body.classList.remove('theme-dark', 'theme-minimal', 'theme-corporate');
  if (theme === 'dark') document.body.classList.add('theme-dark');
  else if (theme === 'minimal') document.body.classList.add('theme-minimal');
}

/* ============================================================
   PIVOT TABLE MODAL
   ============================================================ */

function openPivot() {
  const pivotData = DataProcessor.buildPivotTable(AppState.parsedData, AppState.schema);
  if (!pivotData) {
    showToast('Não foi possível gerar a tabela pivot com os dados disponíveis.', 'error');
    return;
  }
  ChartRenderer.renderPivotTable('pivot-content', pivotData);
  document.getElementById('pivot-modal').classList.remove('hidden');
}

function closePivot() {
  document.getElementById('pivot-modal').classList.add('hidden');
}

/* ============================================================
   EXPORTAÇÃO
   ============================================================ */

/**
 * Exporta o dashboard como imagem PNG
 */
async function exportImage() {
  showLoading('Gerando imagem...');
  try {
    const el = document.getElementById('dashboard-container');
    const canvas = await html2canvas(el, {
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg') || '#0a0e1a',
      scale: 2,
      useCORS: true
    });
    const link = document.createElement('a');
    link.download = 'dashboard-dashia.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    hideLoading();
    showToast('Imagem exportada com sucesso!', 'success');
  } catch (err) {
    hideLoading();
    showToast('Erro ao exportar imagem: ' + err.message, 'error');
  }
}

/**
 * Exporta o dashboard como PDF
 */
async function exportPDF() {
  showLoading('Gerando PDF...');
  try {
    const { jsPDF } = window.jspdf;
    const el = document.getElementById('dashboard-container');
    const canvas = await html2canvas(el, {
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg') || '#0a0e1a',
      scale: 1.5,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('dashboard-dashia.pdf');

    hideLoading();
    showToast('PDF exportado com sucesso!', 'success');
  } catch (err) {
    hideLoading();
    showToast('Erro ao exportar PDF: ' + err.message, 'error');
  }
}

/* ============================================================
   RESET GERAL
   ============================================================ */
function resetAll() {
  if (!confirm('Deseja criar um novo dashboard? Os dados atuais serão perdidos.')) return;

  ChartRenderer.destroyAll();
  Object.assign(AppState, {
    currentScreen: 'screen-upload',
    uploadedFile: null,
    parsedData: null,
    schema: null,
    intent: null,
    suggestions: [],
    selectedSuggestion: null,
    selectedTheme: 'corporate'
  });

  applyTheme('corporate');
  resetUpload();
  document.getElementById('chat-messages').innerHTML = `
    <div class="msg ai">
      <div class="msg-avatar">IA</div>
      <div class="msg-bubble">
        Olá! Analisei sua planilha e detectei as colunas. <br/>
        Agora me descreva o dashboard que você precisa.
      </div>
    </div>
  `;
  document.getElementById('chat-suggestions').classList.remove('hidden');

  goToScreen('screen-upload');
}

/* ============================================================
   UTILITIES
   ============================================================ */

function showLoading(text = 'Processando...') {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
