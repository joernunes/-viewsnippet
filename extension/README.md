# 🚀 Edge Web Inspector & Element Studio

> **Extensão Profissional de Inspeção Web, Design System & DevTools para Microsoft Edge e Google Chrome (Side Panel Nativo - Manifest V3)**

O **Edge Web Inspector & Element Studio** é uma extensão de desenvolvimento web de alta precisão projetada para rodar nativamente no **Painel Lateral (Side Panel)** do Microsoft Edge e navegadores baseados em Chromium. 

Permite inspecionar elementos em qualquer página da web em tempo real sem obstruir a área de visualização, extrair estilos calculados, gerar código pronto para **Tailwind CSS**, **React/JSX** e **CSS**, testar mudanças visuais ao vivo, auditar acessibilidade e contraste, extrair e baixar todos os assets (imagens e paletas de cores) e realizar capturas de ecrã avançadas.

---

## 📋 Índice

- [Destaques da Extensão](#-destaques-da-extensão)
- [Como Instalar (Passo a Passo)](#-como-instalar-passo-a-passo)
  - [Instalação no Microsoft Edge](#-instalação-no-microsoft-edge)
  - [Instalação no Google Chrome / Brave / Opera](#-instalação-no-google-chrome--brave--opera)
- [Como Usar](#-como-usar)
- [Funcionalidades Detalhadas por Módulo](#-funcionalidades-detalhadas-por-módulo)
  - [1. Modo de Inspeção & Cabeçalho](#1-modo-de-inspeção--cabeçalho)
  - [2. Aba "Elemento" (Element Studio, Edição de Conteúdo & Mockups)](#2-aba-elemento-element-studio-edição-de-conteúdo--mockups)
  - [3. Aba "CSS Ao Vivo" (Injeção de CSS em Tempo Real por Domínio)](#3-aba-css-ao-vivo-injeção-de-css-em-tempo-real-por-domínio)
  - [4. Aba "Assets" (Recursos & Download de Imagens)](#4-aba-assets-recursos--download-de-imagens)
  - [5. Aba "Capturas" (Screen Capture Suite)](#5-aba-capturas-screen-capture-suite)
  - [6. Aba "Ferramentas" (Diagnósticos & Auxiliares Visuais)](#6-aba-ferramentas-diagnósticos--auxiliares-visuais)
  - [7. Aba "Sandbox" (Playground HTML/CSS Isolado)](#7-aba-sandbox-playground-htmlcss-isolado)
- [Atalhos de Teclado & Menu de Contexto](#-atalhos-de-teclado--menu-de-contexto)
- [Estrutura de Ficheiros da Extensão](#-estrutura-de-ficheiros-da-extensão)
- [Segurança & Privacidade](#-segurança--privacidade)

---

## ✨ Destaques da Extensão

- 🛡️ **Painel Lateral Não-Obstrutivo**: Roda no Side Panel do Edge sem cobrir a interface do site em que você está trabalhando.
- ⚡ **Injeção de CSS em Tempo Real com Persistência por Domínio**: Digite regras CSS com preview instantâneo via tag `<style>` e salvamento automático no `chrome.storage.local`.
- ✏️ **Edição Direta de Conteúdo (contentEditable & Mockups)**: Edite qualquer texto de um elemento com 1 clique, duplique seções, reordene nós no DOM e troque imagens (URL ou arquivo local).
- 🎯 **Inspeção Precisa & Não-Destrutiva**: Não altera cores ou fontes originais dos elementos inspecionados.
- 🎨 **Edição de Estilos em Tempo Real**: Altere cores com Color Pickers, tipografia, bordas, display e opacidade e veja o resultado no site instantaneamente.
- ⚡ **Exportação de Código em 1 Clique**: Converta qualquer componente da web em classes utilitárias de **Tailwind CSS**, código **React / JSX** estruturado ou **CSS**.
- 📥 **Download Individual e em Lote de Imagens**: Baixe qualquer imagem ou todas as imagens da página de uma só vez.
- 📐 **Box Model Visual**: Gráfico de margem, borda, padding e dimensões com valores em pixels reais.
- ♿ **Auditoria de Acessibilidade**: Cálculo automático de taxa de contraste (Contrast Ratio) e validação de conformidade com normas WCAG AA / AAA.
- 📸 **Captura de Ecrã Inteligente**: Captura de janela visível, seleção de área com arrastar e soltar na página e captura de seções inteiras (`<section>`, `<div>`, `<article>`).

---

## 📦 Como Instalar (Passo a Passo)

### 🔹 Instalação no Microsoft Edge

1. **Baixe ou descompacte** a pasta da extensão (`/extension`) ou o ficheiro `.zip` no seu computador.
2. Abra o **Microsoft Edge** e digite na barra de endereço:
   ```text
   edge://extensions
   ```
3. No canto inferior esquerdo da tela, ative a chave **"Modo de desenvolvedor"** (*Developer mode*).
4. Clique no botão **"Carregar sem compactação"** (*Load unpacked*) que aparecerá no topo da página.
5. Selecione a pasta onde se encontram os ficheiros da extensão (a pasta que contém o `manifest.json`).
6. Pronto! O ícone do **Edge Inspector** aparecerá na barra de ferramentas do navegador.

### 🔹 Instalação no Google Chrome / Brave / Opera

1. Abra o navegador e aceda a:
   ```text
   chrome://extensions
   ```
2. No canto superior direito, ative o interruptor **"Modo do desenvolvedor"**.
3. Clique em **"Carregar sem compactação"**.
4. Selecione a pasta da extensão.

---

## 💡 Como Usar

1. **Abra qualquer site** que você deseje inspecionar (ex: `https://github.com`, `https://tailwindcss.com` ou sua própria aplicação local).
2. **Abra o Painel Lateral**:
   - Clique no ícone da extensão na barra do navegador ou use o atalho `Ctrl + Shift + E` (Mac: `Cmd + Shift + E`).
3. **Inicie a Inspeção**:
   - Clique no botão **"🎯 Inspecionar"** no cabeçalho ou pressione `Ctrl + Shift + X`.
   - Passe o cursor sobre os elementos da página para ver o badge flutuante com a tag, classes, ID e dimensões exatas.
   - Clique com o botão esquerdo para fixar a seleção e carregar todos os dados no painel lateral.
4. **Desmarcar ou Reiniciar Seleção**:
   - Pressione a tecla `Esc` a qualquer momento ou clique no ícone de desmarcar no cabeçalho.

---

## 🛠️ Funcionalidades Detalhadas por Módulo

### 1. Modo de Inspeção & Cabeçalho
- **Status do Site Ativo**: Reconhece automaticamente o domínio da aba ativa, exibindo título e URL atualizados dinamicamente na troca de abas.
- **Botão Inspecionar (`Ctrl + Shift + X`)**: Alterna o cursor de mira para seleção de nós DOM.
- **Botão Desmarcar (`Esc`)**: Remove instantaneamente outlines e seleções ativas sem afetar o DOM do site.
- **Botão Sincronizar**: Atualiza a conexão entre o painel lateral e a página web ativa.

---

### 2. Aba "Elemento" (Element Studio, Edição de Conteúdo & Mockups)
Quando um elemento é selecionado, esta aba fornece controle total para análise e modificação visual imediata:

- **Trilha Hierárquica DOM (Breadcrumbs)**: Exibe toda a cadeia de nós pais (ex: `html > body > main > div > button`). Clicar em qualquer nó pai navega imediatamente para ele.
- **Resumo do Elemento**: Tag HTML (`<div>`, `<button>`, etc.), ID único, lista de classes e badge com largura × altura calculadas em pixels.
- **🛠️ Suíte de Edição de Conteúdo & Mockup (Ao Vivo)**:
  - `✏️ Editar Texto`: Ativa `contentEditable="true"` exclusivamente no elemento selecionado com contorno animado e cursor de digitação, permitindo reescrever qualquer título, botão ou parágrafo diretamente na tela sem quebrar a estrutura do site.
  - `📋 Duplicar`: Cria um clone idêntico do elemento selecionado e insere-o imediatamente a seguir no DOM.
  - `⬆️ Mover Cima` & `⬇️ Mover Baixo`: Reordena o elemento em relação aos seus irmãos no DOM, atualizando o layout visual instantaneamente.
  - `🖼️ Trocar Imagem`: Permite alterar a imagem de qualquer tag `<img>` ou fundo de elemento, seja colando uma nova URL ou carregando uma imagem diretamente do seu computador (via FileReader local).
  - `📸 Capturar Mockup`: Tira um screenshot do elemento ou container recém-editado com resolução nativa, pronto para apresentar a clientes.
- **Barra de Ações Rápidas**:
  - `Seletor`: Copia o seletor CSS mais específico para a área de transferência.
  - `XPath`: Copia o caminho XPath absoluto do nó.
  - `HTML`: Copia o código `outerHTML` do elemento.
  - `Ocultar`: Alterna a visibilidade (`display: none` / restaurar) do elemento na página para testes de layout.
  - `Focar`: Rola a página suavemente até centralizar o elemento na visualização (*scrollIntoView*).
  - `Desmarcar`: Limpa a seleção ativa (`Esc`).
  - `Remover`: Exclui o nó selecionado diretamente da árvore DOM.
- **Edição Rápida de Estilos (Ao Vivo)**:
  - *Cor do Texto* & *Cor de Fundo*: Color Pickers visuais com sincronização de códigos HEX.
  - *Tamanho da Fonte (`font-size`)* e *Raio da Borda (`border-radius`)*.
  - *Modo de Exibição (`display`)*: `flex`, `grid`, `block`, `inline-block`, `none`.
  - *Controle Deslizante de Opacidade*: De 0 a 100%.
- **Box Model Interativo**: Representação gráfica detalhada com valores reais em pixels de **Margin**, **Border**, **Padding** e **Content Area**.
- **Diagnóstico de Contraste & Acessibilidade**: Medição em tempo real da razão de contraste com validação de conformidade **WCAG AA** e **WCAG AAA**.
- **Exportador Multi-Formato**: Conversão em 1 clique para **Tailwind CSS**, **CSS Puro** e **React / JSX**.
- **Tabela de Computed CSS**: Listagem completa de propriedades computadas com filtro em tempo real.
- **Visualizador Outer HTML**: Código fonte com botão direto para "Abrir no Sandbox".

---

### 3. Aba "CSS Ao Vivo" (Injeção de CSS em Tempo Real por Domínio)
Transforma a extensão em um ambiente ativo de prototipagem e customização web:

- **⚡ Injeção Dinâmica via Tag `<style>`**: Aplica as regras diretamente no `<head>` da página web sem recarregar a página, permitindo updates ao vivo enquanto você digita.
- **💾 Persistência Isolada por Domínio (`chrome.storage.local`)**: As regras CSS escritas para `github.com` ficam salvas para `github.com` e nunca interferem com outros sites. Ao retornar ao site, seus estilos são restaurados e reaplicados automaticamente.
- **⏱️ Debounce Inteligente (~120ms)**: Garante máxima fluidez durante a digitação, evitando gargalos no navegador.
- **🎛️ Chave On/Off Instantânea**: Ative ou pause a injeção do CSS customizado com um clique no slider.
- **🛡️ Forçar `!important`**: Checkbox auxiliar que adiciona ou remove automaticamente `!important` de todas as declarações CSS para sobrepor especificidades teimosas.
- **📦 Snippets Prontos em 1 Clique**:
  - `🌙 Dark Mode Universal`: Transforma páginas claras em temas escuros balanceados.
  - `🚫 Ocultar Banners`: Remove anúncios, popups e avisos de cookies comuns.
  - `🔤 Fonte Inter`: Aplica tipografia moderna de alta legibilidade em todo o documento.
  - `🎨 Cor Destaque`: Paleta de destaque vibrante (Cyan/Emerald) em botões e links.
  - `✨ Efeito Glass`: Adiciona efeito translúcido e `backdrop-filter: blur(12px)` em barras de navegação e cabeçalhos.
  - `🌊 Scroll Suave`: Habilita rolagem suave global (`scroll-behavior: smooth`).
- **📝 Editor de Código Profissional**:
  - Numeração de linhas com sincronização de scroll.
  - Suporte à indentação com a tecla `Tab` (2 espaços).
  - Contador de caracteres e linhas em tempo real.
  - Botão **Formatar** para identação limpa automática.
- **📤 Exportação**:
  - Botão **Copiar CSS** para a área de transferência.
  - Botão **Exportar .css** para descarregar o ficheiro `custom-[dominio].css` pronto para produção.

---

### 4. Aba "Assets" (Recursos & Download de Imagens)
- **Paleta de Cores Global**: Escaneia todo o documento e gera uma biblioteca de cores utilizadas no site (fundo, textos e bordas), com cópia de valor HEX em 1 clique.
- **Tipografia Utilizada**: Lista todas as famílias tipográficas (`font-family`) carregadas e detectadas no site.
- **Estrutura de Títulos (SEO)**: Mapeamento hierárquico de títulos (`<h1>` até `<h6>`) com contagem e texto para auditoria de estrutura.
- **Galeria de Imagens & Download**:
  - Exibe miniaturas de todas as imagens encontradas (`<img>`, `srcset`, fundos CSS).
  - Mostra as dimensões nativas (`largura × altura px`).
  - **Botão Baixar**: Faz o download direto do arquivo de imagem para sua pasta local.
  - **Botão Baixar Todas**: Inicia o download sequencial automatizado de todos os assets visuais da página.
  - **Botão Copiar**: Copia o link direto do recurso.

---

### 4. Aba "Capturas" (Screen Capture Suite)
- **Janela Visível**: Captura instantânea em alta definição da visualização atual da aba.
- **Recortar Área**: Ativa uma máscara na página onde você desenha um retângulo com o mouse para recortar exatamente a região desejada.
- **Section / Div**: Captura automaticamente os limites exatos do bloco container do elemento inspecionado.
- **Ações de Captura**:
  - Pré-visualização integrada no painel lateral.
  - Botão **Descarregar** (salva em `.png`).
  - Botão **Copiar** (transfere a imagem para a área de transferência do sistema operacional).
  - Botão **Remover** para limpar a pré-visualização.

---

### 5. Aba "Ferramentas" (Diagnósticos & Auxiliares Visuais)
- **Linhas de Contorno (Outlines)**: Aplica bordas de depuração coloridas em todos os nós DOM da página para diagnosticar problemas de alinhamento e quebra de layout.
- **Grade Base (8px Baseline Grid)**: Projeta uma grade vertical milimétrica semi-transparente sobre o site para validação de ritmo vertical.
- **Diagnósticos da Página**: Métricas em tempo real sobre contagem de nós DOM, total de scripts carregados, folhas de estilo CSS, imagens, links internos e externos.
- **Armazenamento do Site**: Leitura e exibição das chaves e valores armazenados no `localStorage` do domínio atual.

---

### 6. Aba "Sandbox" (Playground HTML/CSS Isolado)
- Editor de código integrado para prototipagem rápida.
- Permite colar ou modificar trechos de código HTML/CSS extraídos da página e visualizá-los em tempo real dentro de um iframe com isolamento de segurança (`sandbox="allow-scripts allow-same-origin"`).

---

## ⌨️ Atalhos de Teclado & Menu de Contexto

| Atalho | Ação |
|---|---|
| `Ctrl + Shift + E` (Mac: `Cmd + Shift + E`) | Abre / foca o Side Panel da extensão |
| `Ctrl + Shift + X` (Mac: `Cmd + Shift + X`) | Ativa ou desativa o modo de inspeção de elemento |
| `Esc` | Cancela a inspeção / remove a seleção do elemento |

### 🖱️ Menu de Contexto (Botão Direito)
Clique com o botão direito em qualquer página para acessar:
- **Inspecionar elemento no Edge Inspector**: Abre o painel lateral e ativa o modo de seleção.
- **Capturar ecrã da página no Edge Inspector**: Inicia a captura de ecrã instantânea.

---

## 📁 Estrutura de Ficheiros da Extensão

```text
extension/
├── manifest.json       # Configurações do Manifest V3 (Side Panel, permissões, atalhos)
├── background.js       # Service Worker de ciclo de vida, rotas de abas e capturas
├── content.js          # Script injetado na página (inspeção DOM, medição, overlays)
├── content.css         # Folha de estilo isolada para overlays e tooltips de inspeção
├── sidepanel.html      # Estrutura completa da interface do Painel Lateral
├── sidepanel.css       # Estilos visuais profissionais e responsivos (Dark Theme)
├── sidepanel.js        # Lógica de controle, exportadores de código e manipuladores de eventos
├── icons/              # Ícones oficiais em resoluções de 16, 32, 48 e 128px
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # Documentação completa da extensão
```

---

## 🔒 Segurança & Privacidade

- 🛡️ **100% Local**: Todo o processamento, medições, edição e diagnósticos ocorrem estritamente dentro do seu navegador.
- 🚫 **Zero Telemetria**: Não há envio de dados, histórico de navegação ou código inspecionado para servidores externos.
- ⚡ **Manifest V3**: Total conformidade com os mais rigorosos padrões de segurança, isolamento e performance dos navegadores modernos.

