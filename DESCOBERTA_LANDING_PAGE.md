# Descoberta para a futura landing page

## 1. Resumo executivo

Este documento apresenta a investigação completa e detalhada do produto existente na base de código, realizada sob as óticas de Product Design, UX Strategy e Engenharia Front-end.

O produto analisado é um **Studio de Desenvolvimento de Código com Preview Interativo, Inspeção Visual em Tempo Real, Auditoria DX via Inteligência Artificial (Gemini 2.5 Flash), Conversor Multi-Framework, Navegação Simulada em Preview e Exportação/Compartilhamento de Snippets em Nuvem**.

- **Estado atual do produto**: Altamente funcional (MVP robusto e operacional), rodando em stack Node.js (Express) com React, TypeScript, Vite, Monaco Editor, Tailwind CSS e integração com a API do Google GenAI.
- **Descoberta fundamental**: O produto une as capacidades de um editor de código web em tempo real (como CodePen/StackBlitz) com um inspecionador visual no-code/low-code em tempo real (como o Chrome DevTools) e assistentes de IA especializados em refatoração, acessibilidade (WCAG), SEO e conversão automática entre frameworks (React, Vue, Svelte, Angular, Solid, Web Components).
- **Inexistência de Landing Page**: O projeto atual contém unicamente o ambiente da aplicação (`/` e `/snippet/:id`). Nenhuma landing page comercial pública existe na estrutura de arquivos.
- **Uso deste relatório**: Servir de guia completo de descoberta para o planejamento estrutural, técnico, de copy e visual de uma futura landing page.

---

## 2. Fontes analisadas

| Caminho | Tipo | Informação extraída | Relevância |
| :--- | :--- | :--- | :--- |
| `/package.json` | Configuração / Dependências | Stack principal (React, Express, Vite, `@google/genai`, `@monaco-editor/react`, `lucide-react`, `motion`, `prettier`, `jspdf`, `html2canvas`, `sonner`, `tailwind-merge`). | Essencial (Base técnica do produto) |
| `/metadata.json` | Configuração da Plataforma | Configuração base do app no container AI Studio (`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`). | Alta (Confirma suporte a servidor) |
| `/server.ts` | Backend Express | Endpoints de IA (`/api/generate-snippet`, `/api/explain-code`, `/api/audit-code`, `/api/convert-framework`, `/api/generate-alt-text`, `/api/refactor-code`) e CRUD em memória de snippets (`/api/snippets`). | Crítica (Lógica de negócios e APIs) |
| `/src/App.tsx` | Roteamento Front-end | Estrutura de rotas React Router (`/` para IDE Home, `/snippet/:id` para visualizador e editor de snippet compartilhado). | Essencial (Arquitetura de navegação) |
| `/src/pages/Home.tsx` | Página / Layout Principal | Interface principal IDE: Monaco Editor, barra de ferramentas, iframe preview com modos responsivos, gerenciador de estado e integrações de modais. | Crítica (Core Loop do produto) |
| `/src/pages/ViewSnippet.tsx` | Página / Layout de Snippet | Interface para visualização, forking, edição e execução de snippets armazenados em nuvem. | Crítica (Compartilhamento e Nuvem) |
| `/src/components/ElementInspector.tsx` | Componente Complexo | Inspecionador DOM interativo dentro do iFrame, edição visual de estilos, manipulação da árvore DOM e sincronização em tempo real com o Monaco Editor. | Crítica (Diferencial Visual No-Code) |
| `/src/components/PreviewAddressBar.tsx` | Componente | Barra de endereços simulada (`preview.localhost`), histórico de navegação (voltar/avançar), recarregamento e pills de salto de seções. | Alta (Navegação Interativa no Preview) |
| `/src/lib/previewRouter.ts` | Script Injetado | Interceptador de eventos de cliques em links (`<a>`), navegação por hash/anchors, manipulação do histórico e escuta de mensagens parent-iframe. | Alta (Experiência de Navegação) |
| `/src/components/DevToolsSuite.tsx` | Componente | Painel de DevTools em tempo real integrado: Console de logs, Inspecionador DOM, Monitor de Network e Leitor de Storage (Cookies/LocalStorage). | Alta (Ferramentas de Depuração) |
| `/src/components/CodeDXSuite.tsx` | Componente | Ferramentas de Produtividade DX: Formatador Prettier, Auditor IA de Acessibilidade/SEO/Performance/Segurança e Conversor Multi-Framework. | Alta (Qualidade de Código & IA) |
| `/src/components/GoogleFontsModal.tsx` | Componente Modal | Catálogo visual de fontes do Google Fonts para busca, pré-visualização e injeção automática de tags `<link>` no cabeçalho do código. | Média (Recurso Visual/Design) |
| `/src/components/DownloadModal.tsx` | Componente Modal | Modulagem de exportação: HTML individual, ZIP empacotado, React, Vue, Svelte, PDF e imagem PNG. | Alta (Entregáveis e Exportação) |
| `/src/components/ShortcutsModal.tsx` | Componente Modal | Guia de atalhos de teclado para produtividade acelerada de desenvolvedores. | Média (Experiência do Utilizador) |
| `/src/lib/history.ts` | Utilitário de Estado | Gerenciamento de histórico Undo/Redo e persistência de rascunhos locais em `localStorage`. | Média (Persistência Local) |
| `/src/index.css` | Estilos Globais | Estilização Tailwind CSS v4 com customizações de barras de rolagem escuros e temas de componentes. | Alta (Sistema Visual) |

---

## 3. Arquitetura técnica

- **Runtime & Servidor**: Node.js rodando servidor Express (`server.ts`) em porta unificada `3000` (host `0.0.0.0`).
- **Arquitetura Full-Stack**: 
  - Front-end SPA desenvolvido em React 18 com Vite e TypeScript.
  - Proxy Server-Side (Express) que isola a chave da API do Gemini (`process.env.GEMINI_API_KEY`) para chamadas seguras à API da Google GenAI (`@google/genai`).
- **Editor de Código**: Mapeamento do `@monaco-editor/react` com integração ao Prettier standalone para formatação automática.
- **Motor de Renderização & Sandbox**: iFrame isolado com injeção dinâmica de scripts em tempo real (`INSPECTOR_INJECT_SCRIPT`, `DEVTOOLS_INJECT_SCRIPT`, `PREVIEW_ROUTER_INJECT_SCRIPT`).
- **Comunicação Inter-frame**: API `window.postMessage` bidirecional sincronizando eventos do iFrame com o estado do React.
- **Estilização**: Tailwind CSS v4 com `@import "tailwindcss";` em `index.css` e ícones da biblioteca `lucide-react`.
- **Persistência de Dados**: 
  - Armazenamento temporário/em nuvem via API REST em memória (`/api/snippets`).
  - Armazenamento local de rascunhos de código via `localStorage` do navegador.

---

## 4. Definição do produto

| Descoberta | Evidência | Arquivo | Classificação | Confiança |
| :--- | :--- | :--- | :--- | :--- |
| **Ambiente de Desenvolvimento Interativo Web** | Módulos do Monaco Editor com suporte a HTML, CSS, JS, TS, React, Vue, Tailwind | `/src/pages/Home.tsx` | Confirmado | 100% |
| **Inspecionador Visual de Elementos em Tempo Real** | Modalidade de apontar e clicar no iFrame para editar estilos, margens, cores, fontes e hierarquia | `/src/components/ElementInspector.tsx` | Confirmado | 100% |
| **Navegação Interativa e Router de Preview** | Script indevidamente injetado interceptando links `<a>` e atualizando barra de navegação simulada | `/src/lib/previewRouter.ts`, `/src/components/PreviewAddressBar.tsx` | Confirmado | 100% |
| **Assistente e Gerador de Código por IA** | Endpoints Express chamando o modelo Gemini 2.5 Flash (`gemini-2.5-flash`) | `/server.ts` | Confirmado | 100% |
| **Auditor de Código por IA (WCAG/SEO/Performance)** | Análise automatizada gerando relatório estruturado de problemas e correções | `/src/components/CodeDXSuite.tsx` | Confirmado | 100% |
| **Conversor Automático Multi-Framework** | Conversão de código HTML/Tailwind para React, Vue, Svelte, Angular, Solid e Web Component | `/server.ts`, `/src/components/CodeDXSuite.tsx` | Confirmado | 100% |
| **DevTools Integrado (Console, Network, Storage, DOM)** | Painel de desenvolvedor escutando mensagens do iFrame para capturar logs e recursos | `/src/components/DevToolsSuite.tsx` | Confirmado | 100% |
| **Biblioteca e Injetor de Google Fonts** | Pesquisa visual e injeção automática de fontes externas no cabeçalho HTML | `/src/components/GoogleFontsModal.tsx` | Confirmado | 100% |
| **Exportação Multiformato (HTML, ZIP, React, Vue, PDF, PNG)** | Modal utilizando `jspdf`, `html2canvas` e montagem manual de estruturas ZIP | `/src/components/DownloadModal.tsx` | Confirmado | 100% |
| **Compartilhamento de Snippets via Nuvem** | Sistema de geração de links únicos (`/snippet/:id`) com contador de visualizações | `/server.ts`, `/src/pages/ViewSnippet.tsx` | Confirmado | 100% |
| **Sistema Comercial ou Cobrança** | Inexistência de pacotes de cobrança, Stripe, limites de uso ou tabela de preços no código | N/A | Não confirmado | 0% |

---

## 5. Funcionalidades

| Funcionalidade | Utilizador | Problema resolvido | Estado | Arquivos | Importância comercial |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Edição de Código Monaco IDE** | Desenvolvedores / Designers | Falta de um ambiente de código rápido com autocompletar e destaque sintático no navegador | Funcional | `/src/pages/Home.tsx` | Principal |
| **Inspecionador Visual de Elementos** | Designers / Front-ends / No-code | Dificuldade em ajustar CSS e código na mão sem ver alterações visuais instantâneas | Funcional | `/src/components/ElementInspector.tsx` | Principal (Diferencial) |
| **Navegação Interativa no Preview** | Criadores de protótipos / UX | Links e navegações internas em iFrames costumam quebrar ou recarregar a página inteira | Funcional | `/src/lib/previewRouter.ts`, `/src/components/PreviewAddressBar.tsx` | Principal (Diferencial) |
| **Geração de Componentes por IA** | Desenvolvedores / Criadores | Bloqueio criativo e lentidão na criação de layouts e componentes iniciais | Funcional | `/server.ts` | Principal |
| **Auditoria IA de Código (WCAG, SEO, Sec)** | Front-ends / QA / Devs | Falta de tempo ou conhecimento para validar regras de acessibilidade e boas práticas | Funcional | `/src/components/CodeDXSuite.tsx` | Principal |
| **Conversão entre Frameworks** | Desenvolvedores Full-stack | Necessidade de reescrever manualmente componentes de HTML/Tailwind para React/Vue/Svelte | Funcional | `/src/components/CodeDXSuite.tsx`, `/server.ts` | Principal |
| **Injetor de Google Fonts** | Designers / Front-ends | Processo manual repetitivo de buscar, copiar e colar tags de fontes no código | Funcional | `/src/components/GoogleFontsModal.tsx` | Secundária |
| **DevTools Integrado no Browser** | Desenvolvedores | Dificuldade em depurar logs de `console.log` e erros ocorridos dentro de um iFrame | Funcional | `/src/components/DevToolsSuite.tsx` | Secundária |
| **Exportação Multiformato (ZIP/PDF/Code)** | Desenvolvedores / Freelancers | Perda de tempo ao montar arquivos de projeto para entrega a clientes ou repositórios | Funcional | `/src/components/DownloadModal.tsx` | Secundária |
| **Snippets em Nuvem com Link Único** | Equipes / Educadores | Dificuldade em compartilhar trechos de código interativos de forma rápida sem setup | Funcional | `/server.ts`, `/src/pages/ViewSnippet.tsx` | Secundária |

---

## 6. Fluxo principal do utilizador

1. **Entrada na Aplicação (`/`)**: O utilizador depara-se imediatamente com o editor de código Monaco à esquerda e a visualização prévia em tempo real à direita.
2. **Criação ou Ajuste Inicial por IA**: O utilizador clica em "Gerar com IA", insere um comando (prompt) e a API do Gemini constrói o código base HTML/Tailwind instantaneamente.
3. **Refinamento Visual no Inspecionador**: O utilizador ativa o modo "Inspecionar Elemento", clica diretamente em qualquer título, botão ou container no preview e ajusta fontes, cores, espaçamentos e hierarquias sem digitar CSS manualmente.
4. **Adição de Tipografia Profissional**: Abre o modal de Google Fonts, escolhe uma fonte estilizada (ex: *Playfair Display*, *Plus Jakarta Sans*) e injeta a fonte com um clique.
5. **Navegação e Validação no Preview**: Utiliza a barra de navegação integrada (`preview.localhost`) para testar o comportamento de links, âncoras internas e rolagens suaves como em um navegador real.
6. **Auditoria e Diagnóstico Automatizado**: Abre a suíte CodeDX, executa a auditoria por IA e recebe correções imediatas de SEO, Acessibilidade WCAG e Performance.
7. **Conversão de Framework**: Escolhe o framework do seu projeto final (ex: React TSX) e converte todo o código com um clique.
8. **Exportação ou Compartilhamento**: Salva o projeto na nuvem para gerar um link único compartilhável (`/snippet/:id`) ou faz o download compactado em formato ZIP/HTML/PDF.

---

## 7. Públicos e casos de uso

### Perfil 1: Desenvolvedores Front-End & Freelancers
- **Nível Técnico**: Médio a Avançado.
- **Necessidades**: Agilidade para criar protótipos rápidos, converter protótipos Tailwind em código React/Vue/Svelte e exportar arquivos limpos.
- **Funcionalidades Relevantes**: Conversor Multi-Framework, Exportação ZIP/React, Auditoria por IA e Monaco Editor.
- **Grau de Confiança**: Confirmado pelas funcionalidades no código.

### Perfil 2: UI/UX Designers & Web Designers
- **Nível Técnico**: Básico a Intermediário (foco em CSS/Visual).
- **Necessidades**: Ajustar elementos visualmente, testar fontes e cores diretamente no preview e validar layouts em diferentes tamanhos de ecrã (Desktop, Tablet, Mobile).
- **Funcionalidades Relevantes**: Inspecionador Visual de Elementos, Modos Responsivos, Google Fonts Modal.
- **Grau de Confiança**: Confirmado pelas funcionalidades no código.

### Perfil 3: Educadores, Estudantes e Criadores de Conteúdo Tech
- **Nível Técnico**: Iniciante a Intermediário.
- **Necessidades**: Explicar trechos de código com IA, gerar links públicos e limpos para compartilhar exemplos e visualizar o console de erros sem abrir o DevTools do navegador.
- **Funcionalidades Relevantes**: Explicador de Código por IA, Compartilhamento de Snippets em Nuvem, DevTools Suite Integrado.
- **Grau de Confiança**: Confirmado pelas funcionalidades no código.

---

## 8. Proposta de valor e hipóteses de posicionamento

### Capacidade Central
Um ambiente integrado de desenvolvimento web que combina um editor IDE no navegador, inspeção visual no-code de elementos, simulação completa de navegação e assistentes de Inteligência Artificial para auditoria e conversão de código.

### Hipótese de Posicionamento 1 (Foco em Agilidade & Dev-Designers)
> *Para desenvolvedores e designers web, o produto permite construir, inspecionar visualmente e otimizar componentes web em minutos por meio de uma IDE com inspeção interativa de elementos e IA generativa integrada, diferentemente do processo tradicional de alternar entre o Chrome DevTools e editores locais.*

### Hipótese de Posicionamento 2 (Foco em Conversão Multi-Framework & IA)
> *Para criadores de produtos e front-ends, o produto permite transformar ideias em componentes prontos para produção em React, Vue, Svelte e Angular por meio de conversão automática por IA e auditorias automatizadas de acessibilidade e SEO, diferentemente de sandboxers estáticos tradicionais.*

*(Nota: Estas formulações são hipóteses analíticas baseadas no código existente e necessitam de validação estratégica humana).*

---

## 9. Modelo comercial encontrado

- **Estado Atual**: Não há nenhum modelo comercial, cobrança ou gateway de pagamento implementado no código-fonte.
- **Lógica de Planos**: Não encontrada.
- **Integração de Pagamento**: Nenhuma referência a Stripe, PayPal, LemonSqueezy ou equivalente nas dependências do `package.json`.
- **Classificação**: Produto em fase funcional/demonstrativa com todos os recursos abertos e sem restrições ativas.

---

## 10. Sistema visual extraído

| Categoria | Token/valor | Origem | Uso | Confiança |
| :--- | :--- | :--- | :--- | :--- |
| **Fundo Principal (Canvas)** | `#09090b` (`zinc-950`) | `/src/index.css`, `/src/pages/Home.tsx` | Fundo geral da aplicação e barras superiores | Confirmado |
| **Superfície Secundária** | `#18181b` (`zinc-900`) | `/src/components/ElementInspector.tsx` | Modais, painéis laterais e cabeçalhos de seções | Confirmado |
| **Bordas & Divisores** | `#27272a` (`zinc-800`), `#3f3f46` (`zinc-700`) | `/src/pages/Home.tsx` | Delimitação de painéis e inputs | Confirmado |
| **Acento Primário (Cyan)** | `#06b6d4` (`cyan-500`), `#22d3ee` (`cyan-400`) | `/src/components/PreviewAddressBar.tsx`, `/src/pages/Home.tsx` | Botões de ação principal, seleções ativas e destaques | Confirmado |
| **Acento Sucesso (Emerald)**| `#10b981` (`emerald-500`), `#34d399` (`emerald-400`)| `/src/lib/previewRouter.ts` | Indicadores de segurança, badges e highlights | Confirmado |
| **Acento IA (Purple/Indigo)**| `#a855f7` (`purple-500`), `#6366f1` (`indigo-500`)| `/src/components/CodeDXSuite.tsx` | Ações de Inteligência Artificial e auditoria | Confirmado |
| **Tipografia Principal** | `Inter`, `sans-serif` | `/src/index.css` | Textos de interface, labels e botões | Confirmado |
| **Tipografia de Código** | `JetBrains Mono`, `Fira Code`, `monospace` | Monaco Editor, `/src/components/PreviewAddressBar.tsx` | Editor de código, URLs simuladas e tags | Confirmado |
| **Arredondamento (Radius)** | `rounded-lg` (8px), `rounded-xl` (12px) | Múltiplos componentes | Cards, modais e botões | Confirmado |

---

## 11. Gramática visual para a landing page

- **Manter**:
  - Tema dark profissional com fundo neutro escuro (`zinc-950` / `zinc-900`).
  - Destaques tecnológicos em tons de Cyan/Teal e acentos em Emerald/Purple.
  - Tipografia limpa sem serifa para interface combinada com fonte monoespaçada em snippets de código.
  - Ícones consistentes da biblioteca `lucide-react`.

- **Adaptar**:
  - A interface densa de edição (Monaco + painéis) deve ser adaptada para mockups visuais simplificados na landing page para facilitar o entendimento do visitante.
  - Mostrar o iFrame de preview de forma limpa com a barra `preview.localhost`.

- **Usar com moderação**:
  - Efeitos de brilho e luzes de acento (glows) em roxo e ciano para destacar recursos de Inteligência Artificial.

- **Não transportar para a landing page**:
  - Menus internos de inspeção de código excessivamente complexos e com muitos inputs pequenos que possam poluir a visualização inicial de um novo visitante.

---

## 12. Conteúdo e terminologia existentes

- **Termos e Rótulos Utilizados na Interface**:
  - *"Inspecionar Elemento"*, *"Auditoria IA"*, *"Converter Framework"*, *"Gerar com IA"*, *"Formatador Prettier"*, *"DevTools"*, *"Google Fonts"*, *"Exportar Projeto"*, *"preview.localhost"*.
- **Idioma Atual**: Português com termos técnicos mantidos em inglês (*DevTools*, *Snippet*, *Framework*, *Console*, *Network*).
- **Tom de Voz**: Direto, produtivo, técnico e focado no fluxo de trabalho de desenvolvimento web contemporâneo.

---

## 13. Assets reutilizáveis

| Asset | Caminho | Formato | Uso atual | Potencial de reutilização |
| :--- | :--- | :--- | :--- | :--- |
| **Ícones de Interface** | `lucide-react` (pacote) | SVG / React Components | Ícones do editor, botões, modais e abas | Reutilização Total na Landing Page |
| **Barra de Endereço Simulada** | `/src/components/PreviewAddressBar.tsx` | Componente React | Header do preview no ecrã principal | Excelente para demonstração em hero section |
| **Catálogo de Fontes de Exemplo** | `/src/lib/fonts.ts` | Arquivo TypeScript | Dados para o modal de fontes | Útil para demonstrações de recursos visuais |
| **Mockups Dinâmicos de Código** | In-code / State | Código React/HTML | Código de teste renderizado no editor | Útil para ilustrar funcionalidades |

---

## 14. Evidências de confiança

- **Confirmações Reais Identificadas**:
  - Integração real e ativa com a API do Google GenAI para geração e análise de código.
  - Formatação com biblioteca Prettier original rodando em ambiente cliente.
  - Exportação funcional de pacotes ZIP verdadeiros e documentos PDF gerados via canvas real.
- **Provas Sociais (Depoimentos, Clientes, Métricas)**:
  - **Não confirmadas no projeto**. Devem ser tratadas como informações ausentes.

---

## 15. Arquitetura recomendada da landing page

| Ordem | Seção | Objetivo | Conteúdo | Evidência | Composição | Mobile | CTA | Prioridade |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Header** | Navegação rápida e marca | Links de navegação, indicação do status da ferramenta e ação primária | Estrutura de navegação do app | Barra fixa com logo e CTA | Menu hambúrguer compacto | "Experimentar Agora" | Essencial |
| **2** | **Hero Section** | Apresentar a proposta de valor central | Título impactante, subtítulo explicativo, badges de IA e mockup interativo do editor | Interface principal (`Home.tsx`) | Layout centralizado ou 2 colunas com visualização do editor | Coluna única com preview em destaque | "Criar Projeto Gratuitamente" | Essencial |
| **3** | **Demonstração Principal** | Mostrar a inspeção visual e o preview interativo | Animação/Mockup demonstrando o clique no preview e o ajuste automático de estilos | Componente `ElementInspector.tsx` | Card amplo com interação visual em destaque | Card empilhado com demonstração vertical | "Ver em Ação" | Essencial |
| **4** | **Passo a Passo de Funcionamento** | Explicar a simplicidade do fluxo (Ideia -> Inspeção -> Conversão) | 3 etapas claras: 1. Gere com IA / 2. Edite Visualmente / 3. Exporte para seu Framework | Fluxo real identificado na aplicação | Grid de 3 colunas horizontais com conectores | Lista vertical em cards numerados | N/A | Essencial |
| **5** | **Suíte de Recursos DX & IA** | Detalhar auditorias de código e conversão de frameworks | Cards mostrando a auditoria WCAG, SEO, refatoração de IA e conversão React/Vue/Svelte | Componente `CodeDXSuite.tsx` e endpoints Express | Bento Grid com cards de tamanhos variados | Empilhamento vertical responsivo | "Explorar Recursos IA" | Essencial |
| **6** | **Navegação & DevTools no Browser** | Destacar a experiência de teste realista | Apresentação da barra `preview.localhost` e do painel integrado de logs/storage | `PreviewAddressBar.tsx` e `DevToolsSuite.tsx` | Layout em 2 colunas (Navegação vs DevTools) | Guias selecionáveis por abas | N/A | Importante |
| **7** | **Exportação e Nuvem** | Demonstrar facilidade de saída dos dados | Opções de download (ZIP, PDF, React) e geração de links de snippet em nuvem | `DownloadModal.tsx` e `ViewSnippet.tsx` | Grid de opções de exportação com ícones claros | Grid 2x2 de cards simples | "Iniciar Agora" | Importante |
| **8** | **CTA Final** | Fechamento comercial e chamada para ação | Frase motivadora e botão direto para o ambiente da ferramenta | Fluxo de entrada no app | Container destacado com gradiente sutil dark | Bloco centralizado com botão amplo | "Abrir Editor no Navegador" | Essencial |
| **9** | **Footer** | Informações legais e links secundários | Links úteis, indicação das tecnologias suportadas e copyright | N/A | Rodapé minimalista e organizado em colunas | Coluna única simplificada | N/A | Essencial |

---

## 16. Brief visual de cada seção

- **Header**: Fundo `zinc-950` com borda inferior fina em `zinc-800/80`. Ícone distintivo do editor, links sutis em `zinc-400` com hover em branco e botão CTA pequeno com acento em ciano (`bg-cyan-500`).
- **Hero**: Tipografia display forte no título, texto de apoio legível. Mockup central simulando a IDE real com abas Monaco de um lado e o preview com a barra de endereços verde/ciano do outro.
- **Demonstração de Inspeção Visual**: Apresentação de um card onde o cursor simula selecionar um botão no preview e um painel lateral exibe os controles visuais de fonte, cor e arredondamento reagindo instantaneamente.
- **Bento Grid de IA & DX**:
  - *Card 1 (Acessibilidade & SEO)*: Exibição de relatórios com selos de aprovação em verde emerald.
  - *Card 2 (Multi-Framework)*: Logotipos e badges dos frameworks suportados (React, Vue, Svelte, Angular, Solid).
  - *Card 3 (Google Fonts)*: Amostra visual de fontes elegantes sendo injetadas no código.
- **CTA Final**: Caixa escura em `zinc-900` com borda sutil em ciano/roxo, destacando que a ferramenta é rápida e utilizável diretamente no navegador sem instalações.

---

## 17. Informações ausentes

| Pergunta | Por que é necessária | Seção afetada | Bloqueia o design? |
| :--- | :--- | :--- | :--- |
| **Qual é o nome oficial do produto/marca?** | Definir a marca no header, hero, footer e títulos comerciais | Todas as seções | Sim (para a copy final e logo) |
| **Qual é o modelo comercial/preços pretendido?** | Decidir se haverá seção de planos/preços e como os CTAs serão formulados | Seção de Planos / CTA | Não bloqueia o layout, mas bloqueia a seção de preços |
| **Qual o idioma principal da landing page?** | Escrever a copy final comercial (Português ou Inglês) | Todas as seções | Não (pode ser estruturado em Português) |
| **Existem depoimentos ou métricas reais de utilizadores?** | Construir a seção de prova social e confiança | Seção de Prova Social | Não (seção pode ser omitida temporariamente) |

---

## 18. Próxima etapa recomendada

1. **Validações Pendentes com o Responsável**:
   - Definir o nome oficial do produto e da marca.
   - Confirmar se o modelo comercial inicial será 100% gratuito (Freemium/Open-Tool) ou se haverá tabela de planos.
2. **Assets para Preparação**:
   - Capturar screenshots e gravar pequenas animações (GIF/MP4) demonstrando a inspeção de elementos e a conversão de código por IA.
3. **Prontidão de Design**:
   - A arquitetura visual (tokens de cores escuras, bordas `zinc-800`, acentos ciano/emerald e tipografia) está 100% mapeada e pronta para ser aplicada assim que o planejamento da landing page for autorizado.
