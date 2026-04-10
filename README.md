# 🚀 ViewSnippet

Imagine um caderno mágico onde você pode escrever uma receita secreta (código), trancar com um cadeado (senha) e enviar um link para um amigo. Quando ele abre, vê tudo perfeitamente organizado, colorido e pronto para usar! 

O **ViewSnippet** é exatamente isso. É uma plataforma profissional e super fácil de usar para desenvolvedores criarem, testarem e compartilharem trechos de código (snippets) com o mundo.

---

## ✨ O que ele faz de tão legal? (Funcionalidades)

* 🎨 **Editor Inteligente:** Escreva código em mais de 15 linguagens diferentes (como Python, JavaScript, HTML, etc.). O texto fica colorido automaticamente para facilitar a leitura, igual nos programas dos profissionais.
* 📱 **Testador de Telas (Live Preview):** Se você estiver escrevendo um site (HTML), o ViewSnippet tem um "simulador" embutido. Você pode ver na mesma hora como o seu site vai ficar na tela de um computador, de um **iPhone** ou de um **iPad** (podendo até virar a tela deitada!).
* 🔒 **Cofre de Segurança:** Quer mandar um código secreto? Você pode colocar uma senha nele. Só quem tiver a "chave" vai conseguir ler.
* ⚡ **Compartilhamento a Jato:** Com apenas um clique, você gera um link único para o seu código e pode mandar para qualquer pessoa no WhatsApp, Discord ou e-mail.
* 💾 **Ferramentas Práticas:** Quem recebe o seu código pode copiá-lo com um clique, baixar o arquivo direto para o computador ou fazer um "Fork" (que é como tirar uma fotocópia para poder rabiscar e alterar sem estragar o original).
* 🌙 **Design Moderno:** Uma interface escura (Dark Mode), bonita e que não cansa os olhos.

---

## 🛠️ Como foi construído? (Para os Engenheiros)

Apesar de ser simples de usar, o ViewSnippet é construído com tecnologia de ponta, pronta para produção:

* **Frontend:** React 19, TypeScript, Vite
* **Estilização:** Tailwind CSS v4, shadcn/ui (componentes acessíveis)
* **Editor de Código:** Monaco Editor (o mesmo motor que roda o VS Code)
* **Ícones & UI:** Lucide React, Framer Motion (animações)
* **Backend:** Node.js com Express
* **Banco de Dados:** SQLite (via `better-sqlite3`)

---

## 💻 Como rodar no seu computador?

Se você é um desenvolvedor e quer rodar o ViewSnippet na sua própria máquina, é muito fácil. Siga os passos:

### 1. Instale as dependências
Abra o terminal na pasta do projeto e digite:
```bash
npm install
```

### 2. Rode o servidor de desenvolvimento
Para iniciar o projeto e ver as alterações em tempo real:
```bash
npm run dev
```
O aplicativo estará rodando em `http://localhost:3000`.

### 3. Como compilar para produção
Para gerar a versão final e otimizada do projeto:
```bash
npm run build
```
E para rodar a versão de produção:
```bash
npm start
```

---

Feito com ❤️ para tornar o compartilhamento de código mais simples, bonito e seguro!
