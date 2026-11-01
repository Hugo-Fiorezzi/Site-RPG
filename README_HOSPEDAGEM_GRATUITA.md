# Grimório do Nevoeiro Cinza — Guia de Hospedagem & Banco de Dados Gratuito

Este projeto já está 100% configurado para funcionar gratuitamente em tempo real entre você (Mestre) e seus jogadores usando **Firebase (Plano Spark Gratuito)** e hospedagem gratuita via **GitHub Pages**, **Netlify** ou **Vercel**.

---

## 1. Como Criar o Banco de Dados Gratuito (Firebase Firestore)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/) com sua conta Google e clique em **Criar um projeto** (100% gratuito no plano Spark).
2. Na tela inicial do projeto, clique no ícone Web **`</>`** para registrar um novo aplicativo web (ex: `grimorio-rpg`) e copie o bloco `firebaseConfig` que aparecerá na tela.
3. No menu lateral esquerdo, vá em **Criação → Authentication → Fazer login (Sign-in method)**:
   - Ative o provedor **Anônimo (Anonymous)** e/ou **E-mail/Senha** e clique em **Salvar**.
4. No menu lateral esquerdo, vá em **Criação → Firestore Database → Criar banco de dados**:
   - Escolha o local mais próximo (ex: `southamerica-east1` - São Paulo) e inicie no modo de produção.
   - Vá na aba **Regras (Rules)** do Firestore, cole o conteúdo do arquivo `firestore.rules` incluído nesta pasta e clique em **Publicar**.

---

## 2. Como Hospedar o Site Gratuitamente para seus Jogadores

### Opção A — Netlify Drop (Mais Rápido: 30 segundos, sem instalar nada)
1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop) e crie uma conta gratuita.
2. Arraste a pasta extraída deste ZIP diretamente para a área pontilhada da página.
3. O Netlify vai gerar imediatamente um link HTTPS gratuito (ex: `https://grimorio-beyonder.netlify.app`). Você pode renomear o subdomínio gratuitamente nas configurações do site.

### Opção B — GitHub Pages (100% Gratuito)
1. Crie um repositório no [GitHub](https://github.com) e envie todos os arquivos desta pasta.
2. No repositório, clique em **Settings → Pages**.
3. Em **Branch**, selecione `main` e clique em **Save**.
4. Seu site ficará disponível em `https://seu-usuario.github.io/nome-do-repositorio/`.

---

## 3. Como Vincular o Banco de Dados ao Site

Você pode conectar o banco de duas maneiras:
- **Pela interface do próprio site:** Abra o site, clique no botão **"Banco & Site Grátis"** no topo, cole o seu JSON `firebaseConfig` e clique em **Salvar & Conectar ao Banco Cloud**.
- **Ou fixo no código (para que todos os jogadores já entrem conectados automaticamente):** Abra o arquivo `js/services/storageService.js` (ou o topo do `index.html`) e defina `window.__firebase_config = JSON.stringify({ ...seu firebaseConfig... });`.

