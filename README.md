# DashIA — Gerador de Dashboards com Inteligência Artificial

> Transforme dados brutos em dashboards executivos profissionais em segundos, direto no navegador — sem backend, sem servidor.

![DashIA Screenshot](https://via.placeholder.com/1200x600/0a0e1a/4f8ef7?text=DashIA+Dashboard+Generator)

---

## 🎯 O que é o DashIA?

O **DashIA** é um gerador de dashboards executivos 100% client-side (roda direto no navegador). Você faz upload de uma planilha, descreve o que precisa em linguagem natural para a IA, e em segundos tem um dashboard interativo com gráficos, KPIs e tabelas.

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---|---|
| 📁 **Upload de Arquivos** | Suporte a `.xlsx` e `.csv` com parser em JavaScript (SheetJS) |
| 🤖 **Chat com IA** | Descreva seu dashboard em português; a IA interpreta e mapeia os dados |
| 🎨 **3 Sugestões de Layout** | O sistema gera 3 opções visuais adaptadas aos seus dados |
| 🎨 **Temas de Cores** | Corporate Blue, Dark Executive e Minimal Light |
| 📊 **Gráficos Interativos** | Linha, Barras, Barras Horizontais, Pizza/Donut (Chart.js) |
| 🃏 **KPI Cards** | Totais, médias, máximos com indicadores de crescimento |
| 📋 **Tabela Pivot** | Modelo de dados com aggregações (soma, média, contagem) |
| 📄 **Exportar PDF/PNG** | Baixe o dashboard como imagem ou documento PDF |
| 🔄 **Detecção Automática** | Tipo de dado, papel semântico (data, região, métrica, etc.) |

---

## 🚀 Como usar

### Opção 1 — Rodar localmente (mais simples)

1. Faça o download ou clone o repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/dashia.git
   cd dashia
   ```

2. Abra o arquivo `index.html` diretamente no navegador:
   - Clique duas vezes no arquivo `index.html`, **ou**
   - Arraste-o para o Chrome/Firefox/Edge

3. Pronto! Nenhuma instalação necessária.

---

### Opção 2 — Publicar no GitHub Pages

1. **Crie um repositório** no GitHub (pode ser público ou privado com Pages habilitado)

2. **Faça upload dos arquivos** (interface do GitHub ou via Git):
   ```bash
   git init
   git add .
   git commit -m "Primeira versão do DashIA"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```

3. **Ative o GitHub Pages:**
   - Vá em **Settings** → **Pages**
   - Source: `Deploy from a branch`
   - Branch: `main` → pasta `/ (root)`
   - Clique em **Save**

4. Aguarde ~2 minutos e acesse:
   ```
   https://SEU_USUARIO.github.io/SEU_REPO/
   ```

---

## 📁 Estrutura do Projeto

```
dashia/
├── index.html              # Página principal (todas as telas)
├── css/
│   └── styles.css          # Estilos e temas
├── js/
│   ├── main.js             # Orquestrador — fluxo e eventos
│   ├── dataProcessor.js    # Leitura, parsing e agregação de dados
│   ├── aiEngine.js         # Motor de IA simulada e sugestões
│   └── chartRenderer.js    # Renderização de gráficos e tabelas
└── README.md               # Este arquivo
```

---

## 🧠 Como a IA funciona (sem API!)

O DashIA simula comportamento de IA usando **heurísticas e regras semânticas**:

1. **Detecção de Schema** — Analisa nomes e valores das colunas para classificar: `número`, `data`, `texto`, `categoria`

2. **Papel Semântico** — Detecta automaticamente:
   - `dimension_time` → colunas com "data", "mês", "ano", "período"
   - `dimension_geo` → "região", "estado", "país", "cidade"
   - `dimension_category` → "categoria", "produto", "segmento"
   - `metric_financial` → "receita", "vendas", "lucro", "custo"
   - `metric_volume` → "quantidade", "volume", "total"

3. **Interpretação de Intent** — Analisa o texto do usuário com expressões regulares para detectar contexto (financeiro, comercial, RH, marketing...)

4. **Sugestão de Layout** — Com base nos dados e intenção, gera 3 layouts otimizados com os tipos de gráfico mais adequados

5. **Pivot Table** — Agrega dados com `sum`, `avg`, `count`, `max`, `min` por dimensão

---

## 📊 Tipos de Gráficos Gerados

| Tipo | Quando é usado |
|---|---|
| **Linha** | Quando há coluna de data/tempo |
| **Barras Vertical** | Comparativo entre categorias |
| **Barras Horizontal** | Ranking (top N categorias) |
| **Pizza / Donut** | Proporção e distribuição |
| **KPI Cards** | Métricas numéricas agregadas |
| **Tabela** | Dados brutos detalhados |

---

## 🎨 Temas Disponíveis

| Tema | Fundo | Acento | Ideal para |
|---|---|---|---|
| **Corporate Blue** | Azul escuro `#0a0e1a` | Azul `#4f8ef7` | Apresentações corporativas |
| **Dark Executive** | Preto `#050507` | Roxo `#a78bfa` | Reuniões executivas / dark mode |
| **Minimal Light** | Branco `#f7f8fc` | Azul `#2563eb` | Impressão / relatórios formais |

---

## 📋 Formatos de Arquivo Suportados

- **`.xlsx`** — Excel moderno (Office 2007+)
- **`.csv`** — Comma-separated values (UTF-8 recomendado)
- **`.xls`** — Excel antigo (suporte básico)

---

## 🛠️ Tecnologias utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| HTML5 / CSS3 | — | Interface e estilos |
| JavaScript ES6+ | — | Lógica e módulos |
| [SheetJS (xlsx)](https://sheetjs.com/) | 0.20.1 | Parser de planilhas |
| [Chart.js](https://www.chartjs.org/) | 4.4.0 | Gráficos interativos |
| [html2canvas](https://html2canvas.hertzen.com/) | 1.4.1 | Exportação de imagem |
| [jsPDF](https://parall.ax/products/jspdf) | 2.5.1 | Exportação de PDF |

---

## 🔒 Privacidade

> **Seus dados nunca saem do seu navegador.**  
> Nenhuma informação é enviada para servidores externos.  
> Todo o processamento acontece localmente no seu dispositivo.

---

## 🤝 Contribuições

Sinta-se à vontade para abrir Issues e Pull Requests com melhorias:

- Novos tipos de gráficos
- Detecção de idiomas (EN, ES...)
- Suporte a mais formatos de arquivo
- Integração com APIs de IA reais (OpenAI, Anthropic...)

---

## 📄 Licença

MIT License — use, modifique e distribua à vontade.

---

*Feito com ❤️ em Português-BR · DashIA 2024*
