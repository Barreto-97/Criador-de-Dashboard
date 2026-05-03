/**
 * chartRenderer.js
 * Camada de visualização — renderiza todos os gráficos e componentes do dashboard
 */

const ChartRenderer = (() => {

  // Instâncias de gráficos ativos (para destruir ao recriar)
  const activeCharts = {};

  /**
   * Retorna as cores do tema atual
   */
  function getThemeColors(theme) {
    const themes = {
      corporate: {
        colors: ['#4f8ef7', '#7eb4ff', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#38bdf8', '#fb923c'],
        gridColor: 'rgba(99,137,212,0.1)',
        textColor: '#8a9fc4',
        bg: 'transparent'
      },
      dark: {
        colors: ['#a78bfa', '#c4b5fd', '#34d399', '#fbbf24', '#38bdf8', '#f87171', '#4f8ef7', '#fb923c'],
        gridColor: 'rgba(160,130,255,0.1)',
        textColor: '#9090b8',
        bg: 'transparent'
      },
      minimal: {
        colors: ['#2563eb', '#3b82f6', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#ea580c'],
        gridColor: 'rgba(60,80,160,0.08)',
        textColor: '#4a5680',
        bg: 'transparent'
      }
    };
    return themes[theme] || themes.corporate;
  }

  /**
   * Configuração global do Chart.js baseada no tema
   */
  function applyGlobalChartDefaults(theme) {
    const tc = getThemeColors(theme);
    Chart.defaults.color = tc.textColor;
    Chart.defaults.borderColor = tc.gridColor;
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.font.size = 12;
  }

  /**
   * Destrói um gráfico existente pelo ID
   */
  function destroyChart(id) {
    if (activeCharts[id]) {
      activeCharts[id].destroy();
      delete activeCharts[id];
    }
  }

  /**
   * Renderiza gráfico de linha (série temporal)
   */
  function renderLineChart(canvasId, labels, datasets, theme) {
    destroyChart(canvasId);
    const tc = getThemeColors(theme);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    activeCharts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          borderColor: tc.colors[i % tc.colors.length],
          backgroundColor: tc.colors[i % tc.colors.length] + '18',
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: datasets.length > 1, position: 'top', labels: { boxWidth: 12, padding: 16 } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { grid: { color: tc.gridColor }, ticks: { maxTicksLimit: 10 } },
          y: { grid: { color: tc.gridColor }, ticks: { callback: v => DataProcessor.formatNumber(v) } }
        }
      }
    });
  }

  /**
   * Renderiza gráfico de barras vertical
   */
  function renderBarChart(canvasId, labels, datasets, theme, maxItems = 12) {
    destroyChart(canvasId);
    const tc = getThemeColors(theme);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Limita itens para não poluir
    const limitedLabels = labels.slice(0, maxItems);
    const limitedDatasets = datasets.map(ds => ({
      ...ds,
      data: ds.data.slice(0, maxItems)
    }));

    const ctx = canvas.getContext('2d');
    activeCharts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: limitedLabels,
        datasets: limitedDatasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: tc.colors[i % tc.colors.length] + 'cc',
          borderColor: tc.colors[i % tc.colors.length],
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: datasets.length > 1 },
          tooltip: { callbacks: { label: ctx => ' ' + DataProcessor.formatNumber(ctx.raw) } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 45 } },
          y: { grid: { color: tc.gridColor }, ticks: { callback: v => DataProcessor.formatNumber(v) } }
        }
      }
    });
  }

  /**
   * Renderiza gráfico de barras horizontal
   */
  function renderBarHChart(canvasId, labels, values, theme, maxItems = 10) {
    destroyChart(canvasId);
    const tc = getThemeColors(theme);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const limitedLabels = labels.slice(0, maxItems);
    const limitedValues = values.slice(0, maxItems);

    const ctx = canvas.getContext('2d');
    activeCharts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: limitedLabels,
        datasets: [{
          data: limitedValues,
          backgroundColor: limitedValues.map((_, i) => tc.colors[i % tc.colors.length] + 'cc'),
          borderColor: limitedValues.map((_, i) => tc.colors[i % tc.colors.length]),
          borderWidth: 1.5,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ' ' + DataProcessor.formatNumber(ctx.raw) } }
        },
        scales: {
          x: { grid: { color: tc.gridColor }, ticks: { callback: v => DataProcessor.formatNumber(v) } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  /**
   * Renderiza gráfico de pizza/donut
   */
  function renderPieChart(canvasId, labels, values, theme, isDoughnut = true) {
    destroyChart(canvasId);
    const tc = getThemeColors(theme);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Limita a top 8 para legibilidade
    const maxItems = 8;
    const lim = Math.min(labels.length, maxItems);
    const limLabels = labels.slice(0, lim);
    let limValues = values.slice(0, lim);

    if (labels.length > maxItems) {
      const othersVal = values.slice(maxItems).reduce((a, b) => a + b, 0);
      limLabels.push('Outros');
      limValues.push(othersVal);
    }

    const ctx = canvas.getContext('2d');
    activeCharts[canvasId] = new Chart(ctx, {
      type: isDoughnut ? 'doughnut' : 'pie',
      data: {
        labels: limLabels,
        datasets: [{
          data: limValues,
          backgroundColor: tc.colors.map(c => c + 'cc'),
          borderColor: tc.colors,
          borderWidth: 1.5,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: isDoughnut ? '65%' : 0,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct = ((ctx.raw / limValues.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                return ` ${DataProcessor.formatNumber(ctx.raw)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Renderiza KPI Cards
   */
  function renderKPICards(containerId, kpis) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    kpis.forEach((kpi, i) => {
      const delta = kpi.delta !== undefined ? kpi.delta : null;
      const deltaClass = delta !== null ? (delta >= 0 ? '' : ' neg') : '';
      const deltaText = delta !== null ? `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}%` : '';

      const card = document.createElement('div');
      card.className = 'kpi-card';
      card.style.animationDelay = `${i * 0.08}s`;
      card.innerHTML = `
        <div class="kpi-label">${kpi.label}</div>
        <div class="kpi-value">${kpi.value}</div>
        ${deltaText ? `<div class="kpi-delta${deltaClass}">${deltaText} vs período anterior</div>` : ''}
      `;
      container.appendChild(card);
    });
  }

  /**
   * Renderiza tabela de dados
   */
  function renderDataTable(containerId, data, schema, maxRows = 15) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const displayData = data.slice(0, maxRows);
    const cols = schema.slice(0, 8); // Limita colunas

    let html = `<table class="data-table"><thead><tr>`;
    cols.forEach(col => {
      html += `<th>${col.name}</th>`;
    });
    html += `</tr></thead><tbody>`;

    displayData.forEach(row => {
      html += `<tr>`;
      cols.forEach(col => {
        const val = row[col.name];
        const isNum = col.type === 'number';
        const formatted = isNum ? DataProcessor.formatNumber(val) : (val !== null && val !== undefined ? val : '—');
        html += `<td class="${isNum ? 'num' : ''}">${formatted}</td>`;
      });
      html += `</tr>`;
    });

    if (data.length > maxRows) {
      html += `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--text3);font-size:12px;padding:12px;">
        ... e mais ${data.length - maxRows} linhas
      </td></tr>`;
    }

    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  /**
   * Renderiza tabela pivot no modal
   */
  function renderPivotTable(containerId, pivotData) {
    const container = document.getElementById(containerId);
    if (!container || !pivotData) return;

    let html = `
      <p style="color:var(--text2);font-size:13px;margin-bottom:16px;">
        <strong>Dimensão:</strong> ${pivotData.dimensionName} &nbsp;|&nbsp;
        <strong>Métrica:</strong> ${pivotData.metricName} &nbsp;|&nbsp;
        <strong>Total:</strong> ${DataProcessor.formatNumber(pivotData.total)}
      </p>
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>${pivotData.dimensionName}</th>
            <th style="text-align:right">${pivotData.metricName} (Soma)</th>
            <th style="text-align:right">% do Total</th>
            <th style="text-align:right">Contagem</th>
          </tr>
        </thead>
        <tbody>
    `;

    pivotData.rows.forEach((row, i) => {
      html += `
        <tr>
          <td style="color:var(--text3)">${i + 1}</td>
          <td>${row.label}</td>
          <td class="num">${DataProcessor.formatNumber(row.value)}</td>
          <td class="num">${row.percent.toFixed(1)}%</td>
          <td class="num">${row.count}</td>
        </tr>
      `;
    });

    html += `
        <tr style="border-top:2px solid var(--border)">
          <td colspan="2" style="font-weight:700;color:var(--text)">TOTAL</td>
          <td class="num" style="font-weight:700;color:var(--text)">${DataProcessor.formatNumber(pivotData.total)}</td>
          <td class="num">100%</td>
          <td></td>
        </tr>
      </tbody></table>
    `;

    container.innerHTML = html;
  }

  /**
   * Gera e renderiza o dashboard completo
   */
  function buildDashboard(containerId, layout, data, schema, theme, intent) {
    const container = document.getElementById(containerId);
    if (!container) return;

    applyGlobalChartDefaults(theme);
    const cols = intent?.focusColumns || AIEngine.mapColumnsToIntent(schema, 'generic');

    // Calcula KPIs
    const mainMetric = cols.mainMetric || schema.find(c => c.type === 'number')?.name;
    const kpiData = mainMetric ? DataProcessor.calcKPIs(data, mainMetric) : null;

    const kpis = [];
    if (kpiData && mainMetric) {
      kpis.push({ label: `Total ${mainMetric}`, value: DataProcessor.formatNumber(kpiData.total), delta: kpiData.crescimento });
      kpis.push({ label: `Média ${mainMetric}`, value: DataProcessor.formatNumber(kpiData.media) });
      kpis.push({ label: `Máximo`, value: DataProcessor.formatNumber(kpiData.maximo) });
      kpis.push({ label: `Registros`, value: DataProcessor.formatNumber(kpiData.count) });
    }

    // Prepara dados para charts
    const dateCol = cols.dateCol;
    const catCol = cols.categoryCol || cols.dimensions[0] || schema.find(c => c.type === 'text')?.name;

    let timeLabels = [], timeValues = [];
    if (dateCol && mainMetric) {
      const ts = DataProcessor.timeSeries(data, dateCol, mainMetric);
      timeLabels = ts.map(r => r.label);
      timeValues = ts.map(r => r.value);
    }

    let catLabels = [], catValues = [];
    if (catCol && mainMetric) {
      const pv = DataProcessor.pivotAggregate(data, catCol, mainMetric, 'sum');
      catLabels = pv.map(r => r.label);
      catValues = pv.map(r => r.value);
    }

    let secMetricLabels = [], secMetricValues = [];
    if (catCol && cols.secondaryMetrics.length > 0) {
      const secPv = DataProcessor.pivotAggregate(data, catCol, cols.secondaryMetrics[0], 'sum');
      secMetricLabels = secPv.map(r => r.label);
      secMetricValues = secPv.map(r => r.value);
    }

    // Monta HTML do dashboard
    const dashHTML = buildDashboardHTML(layout, kpis, schema, intent, catLabels, catValues, timeLabels, timeValues, secMetricLabels, secMetricValues, cols);
    container.innerHTML = dashHTML;

    // Renderiza gráficos após inserção no DOM
    setTimeout(() => {
      if (kpis.length > 0) renderKPICards('kpi-container', kpis);

      const layout_ = layout.layoutType;

      // Chart 1 — Temporal ou Barras Principal
      if (timeLabels.length > 1) {
        renderLineChart('chart-1', timeLabels, [{ label: mainMetric, data: timeValues }], theme);
      } else if (catLabels.length > 0) {
        renderBarChart('chart-1', catLabels, [{ label: mainMetric, data: catValues }], theme);
      }

      // Chart 2 — Barras Horizontal ou Pizza
      if (layout_ === 'comparative' || catLabels.length > 0) {
        if (layout_ === 'comparative') {
          renderBarHChart('chart-2', catLabels, catValues, theme);
        } else {
          renderBarChart('chart-2', catLabels, [{ label: mainMetric, data: catValues }], theme);
        }
      }

      // Chart 3 — Pizza
      if (catLabels.length > 0) {
        renderPieChart('chart-3', catLabels, catValues, theme);
      }

      // Chart 4 — Secundário
      if (secMetricLabels.length > 0 && cols.secondaryMetrics.length > 0) {
        renderBarChart('chart-4', secMetricLabels, [{ label: cols.secondaryMetrics[0], data: secMetricValues }], theme);
      } else if (catLabels.length > 0) {
        renderBarChart('chart-4', catLabels, [{ label: mainMetric, data: catValues }], theme);
      }

      // Tabela
      renderDataTable('table-container', data, schema);

    }, 100);
  }

  /**
   * Monta o HTML do dashboard com base no layout selecionado
   */
  function buildDashboardHTML(layout, kpis, schema, intent, catLabels, catValues, timeLabels, timeValues, secLabels, secValues, cols) {
    const title = intent?.businessContext || 'Painel Analítico';
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const mainMetric = cols.mainMetric || '—';
    const catCol = cols.categoryCol || cols.dimensions[0] || schema.find(c => c.type === 'text')?.name || '—';
    const hasTime = timeLabels.length > 1;

    const layoutType = layout.layoutType;

    let chartsHTML = '';

    if (layoutType === 'executive' || layoutType === 'operational') {
      chartsHTML = `
        <div class="chart-grid cols-2">
          <div class="chart-card">
            <div class="chart-title">${hasTime ? `Evolução de ${mainMetric}` : `${mainMetric} por ${catCol}`}</div>
            <div class="chart-wrapper"><canvas id="chart-1"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">${mainMetric} por ${catCol}</div>
            <div class="chart-wrapper"><canvas id="chart-2"></canvas></div>
          </div>
        </div>
        <div class="chart-grid cols-2">
          <div class="chart-card">
            <div class="chart-title">Distribuição Proporcional</div>
            <div class="chart-wrapper"><canvas id="chart-3"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">${secValues.length > 0 ? `${cols.secondaryMetrics?.[0]} por ${catCol}` : `Comparativo de ${mainMetric}`}</div>
            <div class="chart-wrapper"><canvas id="chart-4"></canvas></div>
          </div>
        </div>
      `;
    } else if (layoutType === 'comparative') {
      chartsHTML = `
        <div class="chart-grid cols-1">
          <div class="chart-card">
            <div class="chart-title">Ranking — ${mainMetric} por ${catCol}</div>
            <div class="chart-wrapper" style="height:300px"><canvas id="chart-2"></canvas></div>
          </div>
        </div>
        <div class="chart-grid cols-2">
          <div class="chart-card">
            <div class="chart-title">${hasTime ? `Tendência de ${mainMetric}` : `${mainMetric} por ${catCol}`}</div>
            <div class="chart-wrapper"><canvas id="chart-1"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">Proporção por ${catCol}</div>
            <div class="chart-wrapper"><canvas id="chart-3"></canvas></div>
          </div>
        </div>
        <div class="chart-grid cols-1" style="display:none"><div><canvas id="chart-4"></canvas></div></div>
      `;
    }

    return `
      <div class="dash-title-area">
        <div>
          <div class="dash-title">${title}</div>
          <div class="dash-subtitle">${layout.description}</div>
        </div>
        <div class="dash-meta">
          Gerado em ${today}<br/>
          ${DataProcessor.getData().length} registros · ${schema.length} colunas
        </div>
      </div>

      <div class="pivot-btn-row">
        <button class="btn-ghost" onclick="openPivot()">📊 Ver Modelo de Dados (Pivot)</button>
      </div>

      <div class="kpi-grid" id="kpi-container"></div>

      ${chartsHTML}

      <div class="table-card">
        <div class="chart-title">Dados Detalhados</div>
        <div id="table-container"></div>
      </div>
    `;
  }

  return {
    renderLineChart,
    renderBarChart,
    renderBarHChart,
    renderPieChart,
    renderKPICards,
    renderDataTable,
    renderPivotTable,
    buildDashboard,
    applyGlobalChartDefaults,
    destroyAll: () => Object.keys(activeCharts).forEach(destroyChart)
  };

})();
