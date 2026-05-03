/**
 * aiEngine.js
 * Motor de IA simulada — interpreta intenções, detecta contexto e sugere layouts
 */

const AIEngine = (() => {

  // Estado interno
  let detectedIntent = null;
  let selectedLayout = null;
  let selectedTheme = 'corporate';

  /**
   * Analisa o texto do usuário e extrai intenções e palavras-chave
   */
  function parseIntent(text, schema) {
    const lc = text.toLowerCase();
    const intent = {
      raw: text,
      keywords: [],
      dashboardType: 'generic',
      requestedCharts: [],
      focusColumns: [],
      businessContext: ''
    };

    // Detecta tipo de dashboard
    if (/financ|receita|revenue|faturamento|lucro|custo|margem|vendas|sales/.test(lc)) {
      intent.dashboardType = 'financial';
      intent.businessContext = 'Dashboard Financeiro';
      intent.keywords.push('financeiro', 'receita', 'margem');
    } else if (/venda|sale|comercial|cliente|produto|produto/.test(lc)) {
      intent.dashboardType = 'sales';
      intent.businessContext = 'Dashboard Comercial';
      intent.keywords.push('vendas', 'produtos', 'clientes');
    } else if (/rh|hr|headcount|funcionário|salário|folha|colaborador/.test(lc)) {
      intent.dashboardType = 'hr';
      intent.businessContext = 'Dashboard de RH';
      intent.keywords.push('pessoas', 'headcount', 'salários');
    } else if (/operac|operação|logístic|estoque|produção|process/.test(lc)) {
      intent.dashboardType = 'operations';
      intent.businessContext = 'Dashboard Operacional';
      intent.keywords.push('operações', 'processos');
    } else if (/market|campanha|canal|lead|conversão|reach|impression/.test(lc)) {
      intent.dashboardType = 'marketing';
      intent.businessContext = 'Dashboard de Marketing';
      intent.keywords.push('marketing', 'campanhas', 'conversão');
    } else {
      intent.dashboardType = 'executive';
      intent.businessContext = 'Painel Executivo';
    }

    // Detecta tipos de gráficos solicitados
    if (/tendência|trend|evolução|linha|crescimento/.test(lc)) intent.requestedCharts.push('line');
    if (/barra|bar|comparação|comparar/.test(lc)) intent.requestedCharts.push('bar');
    if (/pizza|pie|proporção|distribuição|percentual/.test(lc)) intent.requestedCharts.push('pie');
    if (/kpi|indicador|métrica|número|resumo/.test(lc)) intent.requestedCharts.push('kpi');
    if (/região|regional|mapa|geo|localidade/.test(lc)) intent.requestedCharts.push('geo');
    if (/tabela|table|detalhe|relatório/.test(lc)) intent.requestedCharts.push('table');

    // Mapeia colunas relevantes com base no contexto
    intent.focusColumns = mapColumnsToIntent(schema, intent.dashboardType);

    detectedIntent = intent;
    return intent;
  }

  /**
   * Mapeia colunas do schema ao tipo de dashboard
   */
  function mapColumnsToIntent(schema, dashboardType) {
    const mapped = {
      dateCol: null,
      geoCol: null,
      categoryCol: null,
      mainMetric: null,
      secondaryMetrics: [],
      dimensions: []
    };

    schema.forEach(col => {
      switch (col.semanticRole) {
        case 'dimension_time':
          if (!mapped.dateCol) mapped.dateCol = col.name;
          break;
        case 'dimension_geo':
          if (!mapped.geoCol) mapped.geoCol = col.name;
          mapped.dimensions.push(col.name);
          break;
        case 'dimension_category':
          if (!mapped.categoryCol) mapped.categoryCol = col.name;
          mapped.dimensions.push(col.name);
          break;
        case 'dimension_generic':
          mapped.dimensions.push(col.name);
          break;
        case 'metric_financial':
          if (!mapped.mainMetric) mapped.mainMetric = col.name;
          else mapped.secondaryMetrics.push(col.name);
          break;
        case 'metric_volume':
          if (!mapped.mainMetric) mapped.mainMetric = col.name;
          else mapped.secondaryMetrics.push(col.name);
          break;
        case 'metric_generic':
          if (!mapped.mainMetric) mapped.mainMetric = col.name;
          else mapped.secondaryMetrics.push(col.name);
          break;
      }
    });

    // Fallbacks
    if (!mapped.mainMetric) {
      const numericCols = schema.filter(c => c.type === 'number');
      if (numericCols.length > 0) mapped.mainMetric = numericCols[0].name;
    }
    if (!mapped.categoryCol && mapped.dimensions.length > 0) {
      mapped.categoryCol = mapped.dimensions[0];
    }

    return mapped;
  }

  /**
   * Gera 3 sugestões de layout com base no intent e schema
   */
  function generateLayoutSuggestions(intent, schema, data) {
    const cols = intent.focusColumns;
    const hasDate = !!cols.dateCol;
    const hasGeo = !!cols.geoCol;
    const hasCategory = !!cols.categoryCol || cols.dimensions.length > 0;
    const hasMetric = !!cols.mainMetric;

    const suggestions = [];

    // ========================
    // SUGESTÃO 1 — Painel Executivo com KPIs
    // ========================
    suggestions.push({
      id: 'layout-executive',
      title: 'Painel Executivo',
      description: 'Visão de alto nível com KPIs destacados, tendência temporal e breakdown por categoria. Ideal para apresentações executivas.',
      layoutType: 'executive',
      previewLayout: 'layout-1',
      tags: ['KPIs', 'Tendência', 'Breakdown'],
      charts: [
        { type: 'kpi', label: 'KPIs Principais', source: 'aggregate', col: cols.mainMetric },
        hasDate
          ? { type: 'line', label: 'Evolução Temporal', source: 'timeseries', dateCol: cols.dateCol, valueCol: cols.mainMetric }
          : { type: 'bar', label: 'Comparativo', source: 'pivot', groupBy: cols.categoryCol || schema[0]?.name, valueCol: cols.mainMetric },
        hasCategory
          ? { type: 'bar', label: `Por ${cols.categoryCol || cols.dimensions[0]}`, source: 'pivot', groupBy: cols.categoryCol || cols.dimensions[0], valueCol: cols.mainMetric }
          : { type: 'pie', label: 'Distribuição', source: 'pivot', groupBy: schema.find(c => c.type === 'text')?.name, valueCol: cols.mainMetric },
        { type: 'table', label: 'Dados Detalhados', source: 'raw' }
      ]
    });

    // ========================
    // SUGESTÃO 2 — Análise Comparativa
    // ========================
    suggestions.push({
      id: 'layout-comparative',
      title: 'Análise Comparativa',
      description: 'Foco em comparações entre categorias, proporções e rankings. Perfeito para identificar top performers e oportunidades.',
      layoutType: 'comparative',
      previewLayout: 'layout-2',
      tags: ['Ranking', 'Proporção', 'Comparativo'],
      charts: [
        { type: 'kpi', label: 'KPIs Resumidos', source: 'aggregate', col: cols.mainMetric },
        hasCategory
          ? { type: 'bar_h', label: `Top ${cols.categoryCol || cols.dimensions[0]}`, source: 'pivot', groupBy: cols.categoryCol || cols.dimensions[0], valueCol: cols.mainMetric }
          : { type: 'bar', label: 'Comparativo Geral', source: 'pivot', groupBy: schema.find(c => c.type === 'text')?.name, valueCol: cols.mainMetric },
        { type: 'pie', label: 'Distribuição Proporcional', source: 'pivot', groupBy: cols.categoryCol || cols.dimensions[0] || schema.find(c => c.type === 'text')?.name, valueCol: cols.mainMetric },
        hasGeo
          ? { type: 'bar', label: `Por ${cols.geoCol}`, source: 'pivot', groupBy: cols.geoCol, valueCol: cols.mainMetric }
          : { type: 'table', label: 'Resumo por Categoria', source: 'pivot_table', groupBy: cols.categoryCol || cols.dimensions[0], valueCol: cols.mainMetric }
      ]
    });

    // ========================
    // SUGESTÃO 3 — Painel Operacional
    // ========================
    suggestions.push({
      id: 'layout-operational',
      title: 'Painel Operacional',
      description: 'Visão detalhada dos dados com múltiplas dimensões e métricas. Ideal para gestores que precisam de granularidade.',
      layoutType: 'operational',
      previewLayout: 'layout-3',
      tags: ['Detalhado', 'Multidimensional', 'Operacional'],
      charts: [
        { type: 'kpi', label: 'KPIs Operacionais', source: 'aggregate', col: cols.mainMetric },
        hasDate
          ? { type: 'line', label: 'Evolução Temporal', source: 'timeseries', dateCol: cols.dateCol, valueCol: cols.mainMetric }
          : { type: 'bar', label: 'Comparativo', source: 'pivot', groupBy: cols.categoryCol || schema.find(c => c.type === 'text')?.name, valueCol: cols.mainMetric },
        cols.secondaryMetrics.length > 0
          ? { type: 'bar', label: `Métrica Secundária: ${cols.secondaryMetrics[0]}`, source: 'pivot', groupBy: cols.categoryCol || cols.dimensions[0] || schema.find(c => c.type === 'text')?.name, valueCol: cols.secondaryMetrics[0] }
          : { type: 'pie', label: 'Proporção', source: 'pivot', groupBy: cols.categoryCol || cols.dimensions[0] || schema.find(c => c.type === 'text')?.name, valueCol: cols.mainMetric },
        { type: 'table', label: 'Tabela Completa', source: 'raw' }
      ]
    });

    return suggestions;
  }

  /**
   * Gera uma resposta da IA para o chat
   */
  function generateChatResponse(userText, intent, schema) {
    const dimensionNames = schema.filter(c => c.type === 'text' || c.type === 'date').map(c => c.name).join(', ');
    const metricNames = schema.filter(c => c.type === 'number').map(c => c.name).join(', ');

    const responses = [
      `Entendido! Detectei que você precisa de um **${intent.businessContext}**. 
Vou mapear suas colunas numéricas (${metricNames || 'nenhuma detectada'}) como métricas principais e usar ${dimensionNames || 'as demais colunas'} como dimensões.
Gerando 3 sugestões de layout personalizadas...`,

      `Perfeito! Analisei seu pedido e identifiquei o contexto de **${intent.businessContext}**.
Detectei métricas: **${metricNames || '(sem colunas numéricas claras)'}** e dimensões: **${dimensionNames || '(sem dimensões detectadas)'}**.
Preparando as opções de visualização...`,

      `Compreendido! Com base nos seus dados, vou criar um **${intent.businessContext}** otimizado.
As principais métricas serão: ${metricNames || 'totais e contagens'}, segmentadas por ${dimensionNames || 'categorias disponíveis'}.
Aguarde as sugestões de layout...`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Getters / setters de estado
   */
  function setSelectedLayout(layout) { selectedLayout = layout; }
  function getSelectedLayout() { return selectedLayout; }
  function setSelectedTheme(theme) { selectedTheme = theme; }
  function getSelectedTheme() { return selectedTheme; }
  function getIntent() { return detectedIntent; }

  return {
    parseIntent,
    mapColumnsToIntent,
    generateLayoutSuggestions,
    generateChatResponse,
    setSelectedLayout,
    getSelectedLayout,
    setSelectedTheme,
    getSelectedTheme,
    getIntent
  };

})();
