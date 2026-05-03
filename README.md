# DashIA — Gerador de Dashboards Executivos

> Transforme planilhas em dashboards profissionais de alta gestão, com abas de Pivot Table e Gráficos, pronto para download.

---

## Como funciona

1. **Upload** — Envie seu arquivo `.xlsx` ou `.csv`
2. **Chat** — Descreva o dashboard desejado em linguagem natural
3. **Escolha** — Selecione entre 3 layouts sugeridos pela IA + paleta de cores
4. **Download** — Receba dois arquivos:
   - **`.html`** — Dashboard interativo com gráficos, KPIs e tabela de dados
   - **`.xlsx`** — Arquivo Excel com abas de Pivot Table (Soma, Média, Métrica Secundária)

---

## Deploy no GitHub Pages (passo a passo)

### 1. Criar repositório no GitHub
1. Acesse [github.com](https://github.com) e clique em **New repository**
2. Nomeie como `dashia` (ou qualquer nome)
3. Deixe **Public**
4. Clique em **Create repository**

### 2. Fazer upload do arquivo
1. Na página do repositório, clique em **uploading an existing file**
2. Arraste o arquivo `index.html`
3. Clique em **Commit changes**

### 3. Ativar GitHub Pages
1. Vá em **Settings** → **Pages**
2. Em *Source*, selecione **Deploy from a branch**
3. Branch: `main` → Pasta: `/ (root)`
4. Clique em **Save**

### 4. Acessar
Após ~2 minutos, seu dashboard estará disponível em:
```
https://SEU_USUARIO.github.io/dashia/
```

---

## Uso via Git (alternativo)

```bash
git init
git add index.html
git commit -m "DashIA v1"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/dashia.git
git push -u origin main
```

---

## Tecnologias

| Biblioteca | Versão | Uso |
|---|---|---|
| SheetJS | 0.20.1 | Leitura de .xlsx e .csv |
| Chart.js | 4.4.0 | Gráficos interativos |

Tudo carregado via CDN — nenhuma instalação necessária.

---

## O que é gerado

### Arquivo `.html` (Dashboard)
- **Aba Gráficos & Dashboard**: KPI cards, gráfico de linha/tendência, barras, donut/pizza, tabela de dados
- **Aba Pivot Tables**: Tabelas agregadas (soma, média, percentual, contagem)

### Arquivo `.xlsx` (Excel)
- **Aba Dados Brutos**: Todos os dados originais
- **Aba Pivot Soma**: Agregação por dimensão principal
- **Aba Pivot Média**: Média por dimensão
- **Aba Pivot Métrica 2**: Segunda métrica (quando disponível)

---

## Privacidade

Todos os dados são processados **100% no navegador**. Nenhuma informação é enviada para servidores externos.

---

*DashIA — feito em Português-BR*
