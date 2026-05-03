/**
 * dataProcessor.js
 * Camada de processamento de dados — leitura, parsing e agregação (Pivot Table)
 */

const DataProcessor = (() => {

  // Armazena os dados brutos e processados
  let rawData = [];
  let schema = [];

  /**
   * Lê um arquivo .xlsx ou .csv e retorna dados como array de objetos
   */
  async function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            defval: null,
            raw: false,
            dateNF: 'yyyy-mm-dd'
          });

          if (!jsonData || jsonData.length === 0) {
            reject(new Error('A planilha está vazia ou não foi possível ler os dados.'));
            return;
          }

          rawData = jsonData;
          schema = detectSchema(jsonData);
          resolve({ data: jsonData, schema, rowCount: jsonData.length });
        } catch (err) {
          reject(new Error('Erro ao processar o arquivo: ' + err.message));
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Detecta o schema (tipo e metadados de cada coluna)
   */
  function detectSchema(data) {
    if (!data || data.length === 0) return [];

    const cols = Object.keys(data[0]);
    return cols.map(col => {
      const samples = data.slice(0, 30).map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
      const type = inferType(col, samples);
      const uniqueCount = new Set(data.map(r => r[col])).size;

      return {
        name: col,
        type,                           // 'number' | 'date' | 'text' | 'category'
        samples: samples.slice(0, 3),
        uniqueCount,
        isHighCardinality: uniqueCount > data.length * 0.8,
        semanticRole: inferSemanticRole(col, type, uniqueCount, data.length)
      };
    });
  }

  /**
   * Infere o tipo de dado de uma coluna
   */
  function inferType(colName, samples) {
    const lc = colName.toLowerCase();

    // Tenta detectar datas pelo nome
    const dateKeywords = ['data', 'date', 'mes', 'mês', 'ano', 'year', 'month', 'período', 'periodo', 'trimestre', 'quarter', 'semana', 'week'];
    if (dateKeywords.some(k => lc.includes(k))) return 'date';

    if (samples.length === 0) return 'text';

    // Tenta parsear como número
    const numericSamples = samples.filter(s => {
      const cleaned = String(s).replace(/[R$%,.€£\s]/g, '');
      return !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
    });

    if (numericSamples.length / samples.length >= 0.8) return 'number';

    // Tenta detectar datas nos valores
    const dateSamples = samples.filter(s => {
      const d = new Date(s);
      return !isNaN(d.getTime()) && String(s).length >= 6;
    });
    if (dateSamples.length / samples.length >= 0.7) return 'date';

    return 'text';
  }

  /**
   * Infere o papel semântico da coluna (para o AI Engine)
   */
  function inferSemanticRole(colName, type, uniqueCount, totalRows) {
    const lc = colName.toLowerCase();

    // Receita / financeiro
    if (/receita|revenue|vendas|sales|faturamento|lucro|profit|custo|cost|margem|margin/.test(lc)) return 'metric_financial';
    // Volume / quantidade
    if (/quantidade|qtd|volume|count|total|qtde|unid/.test(lc)) return 'metric_volume';
    // Data / tempo
    if (/data|date|mes|mês|ano|year|month|período|periodo|trimestre|quarter/.test(lc)) return 'dimension_time';
    // Região / geo
    if (/região|regiao|region|estado|city|cidade|pais|país|country|uf|localidade|loja|store/.test(lc)) return 'dimension_geo';
    // Categoria
    if (/categoria|category|segmento|segment|tipo|type|produto|product|serviço|service/.test(lc)) return 'dimension_category';
    // KPI genérico
    if (type === 'number') return 'metric_generic';
    // Dimensão genérica
    if (type === 'text' && uniqueCount <= totalRows * 0.5) return 'dimension_generic';

    return 'unknown';
  }

  /**
   * Converte valor para número, limpando formatação
   */
  function toNumber(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[R$%,.€£\s]/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  /**
   * Agrupa dados por uma dimensão e agrega uma métrica
   * Simula comportamento de Pivot Table
   */
  function pivotAggregate(data, groupByCol, valueCol, aggregation = 'sum') {
    const groups = {};

    data.forEach(row => {
      const key = row[groupByCol] !== null && row[groupByCol] !== undefined ? String(row[groupByCol]) : '(vazio)';
      const val = toNumber(row[valueCol]);

      if (!groups[key]) {
        groups[key] = { key, values: [], count: 0 };
      }
      groups[key].values.push(val);
      groups[key].count++;
    });

    return Object.entries(groups).map(([k, g]) => {
      let agg;
      switch (aggregation) {
        case 'sum':   agg = g.values.reduce((a, b) => a + b, 0); break;
        case 'avg':   agg = g.values.reduce((a, b) => a + b, 0) / g.values.length; break;
        case 'count': agg = g.count; break;
        case 'max':   agg = Math.max(...g.values); break;
        case 'min':   agg = Math.min(...g.values); break;
        default:      agg = g.values.reduce((a, b) => a + b, 0);
      }
      return { label: k, value: agg, count: g.count };
    }).sort((a, b) => b.value - a.value);
  }

  /**
   * Agrupa dados por período (mês/ano) e calcula tendência
   */
  function timeSeries(data, dateCol, valueCol) {
    const groups = {};

    data.forEach(row => {
      const raw = row[dateCol];
      if (!raw) return;

      let key;
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = String(raw);
      }

      const val = toNumber(row[valueCol]);
      if (!groups[key]) groups[key] = { values: [] };
      groups[key].values.push(val);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, g]) => ({
        label: k,
        value: g.values.reduce((a, b) => a + b, 0)
      }));
  }

  /**
   * Calcula KPIs principais para um campo numérico
   */
  function calcKPIs(data, valueCol) {
    const values = data.map(r => toNumber(r[valueCol])).filter(v => v !== 0);
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Crescimento: compara primeira e última metade
    const half = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const secondHalf = values.slice(half).reduce((a, b) => a + b, 0) / (values.length - half);
    const growth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    return {
      total: sum,
      media: avg,
      maximo: max,
      minimo: min,
      crescimento: growth,
      count: values.length
    };
  }

  /**
   * Gera tabela pivot completa (para exibição no modal)
   */
  function buildPivotTable(data, schema) {
    const dimensions = schema.filter(c => ['dimension_geo', 'dimension_category', 'dimension_generic', 'dimension_time'].includes(c.semanticRole));
    const metrics = schema.filter(c => c.type === 'number');

    if (dimensions.length === 0 || metrics.length === 0) return null;

    const dim = dimensions[0];
    const met = metrics[0];

    const aggregated = pivotAggregate(data, dim.name, met.name, 'sum');
    const total = aggregated.reduce((a, b) => a + b.value, 0);

    return {
      dimensionName: dim.name,
      metricName: met.name,
      rows: aggregated.slice(0, 20).map(r => ({
        ...r,
        percent: total > 0 ? (r.value / total) * 100 : 0
      })),
      total
    };
  }

  /**
   * Formata número de forma legível
   */
  function formatNumber(val, prefix = '') {
    if (val === null || val === undefined) return '—';
    const n = parseFloat(val);
    if (isNaN(n)) return String(val);

    if (Math.abs(n) >= 1_000_000) return prefix + (n / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1_000)     return prefix + (n / 1_000).toFixed(1) + 'K';
    return prefix + n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }

  /**
   * Retorna os getters para outros módulos
   */
  function getData() { return rawData; }
  function getSchema() { return schema; }

  return {
    readFile,
    detectSchema,
    inferType,
    pivotAggregate,
    timeSeries,
    calcKPIs,
    buildPivotTable,
    formatNumber,
    toNumber,
    getData,
    getSchema
  };

})();
