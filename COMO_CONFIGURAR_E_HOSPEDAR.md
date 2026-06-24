# Guia de Configuração, Hospedagem e Publicação - Nunes Grife

Este guia explica, passo a passo, como configurar o banco de dados e autenticação do **Firebase**, hospedar seu site gratuitamente e publicá-lo no **GitHub**.

---

## 📂 Nova Organização do Projeto

Organizamos a estrutura dos arquivos para torná-la profissional e limpa:
-   `index.html`: Página principal da loja (agora com Firebase).
-   `admin.html`: Painel administrativo de produtos, pedidos e banners.
-   `css/style.css`: Folha de estilos globais.
-   `js/firebase-config.js`: Configurações de conexão com o Firebase.
-   `js/main.js`: Lógica de tema, logo e notificações.
-   `js/loja.js`: Lógica do carrinho de compras e listagem.
-   `js/admin.js`: Lógica do painel de administração (salvando direto na nuvem).

---

## 🛠️ Passo 1: Configurar o Firebase (Banco de Dados e Imagens)

Para que o cadastro de produtos, pedidos e login do administrador funcionem em qualquer celular/computador, precisamos ativar os serviços gratuitos do Firebase:

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/) e faça login com sua conta do Google.
2.  Clique em **"Adicionar projeto"** e dê o nome de `nunes-grife`.
3.  Desative o Google Analytics para este projeto (opcional, para ser mais rápido) e clique em **"Criar projeto"**.
4.  No painel do projeto, clique no ícone da **Web (</>)** para registrar um aplicativo:
    *   Apelido do app: `nunes-grife-web`
    *   Marque a opção *"Configurar também o Firebase Hosting para este app"* (facilita depois).
    *   Clique em **Registrar app**.
5.  O Firebase exibirá um código contendo um objeto `firebaseConfig`. **Copie apenas os valores de dentro deste objeto**:
    ```javascript
    const firebaseConfig = {
      apiKey: "SUA_API_KEY",
      authDomain: "seu-projeto.firebaseapp.com",
      projectId: "seu-projeto",
      storageBucket: "seu-projeto.appspot.com",
      messagingSenderId: "SEU_SENDER_ID",
      appId: "SEU_APP_ID",
      measurementId: "SEU_MEASUREMENT_ID"
    };
    ```
6.  Abra o arquivo `js/firebase-config.js` no seu editor e substitua esses valores fictícios pelas chaves reais que você acabou de copiar.

### Ativando os serviços do Firebase no Console:

*   **Autenticação (Login do Admin)**:
    1. No menu esquerdo, vá em **Build (Construção) > Authentication**.
    2. Clique em **"Começar"**.
    3. Na aba *Método de login*, selecione **E-mail/senha**, ative e salve.
    4. Vá na aba *Users (Usuários)*, clique em **"Adicionar usuário"** e insira:
        *   E-mail: `hiago@nunesgrife.com` (ou outro de sua preferência)
        *   Senha: `nunes123` (ou outra de sua escolha)
*   **Banco de Dados (Firestore)**:
    1. No menu esquerdo, vá em **Build > Firestore Database**.
    2. Clique em **"Criar banco de dados"**.
    3. Selecione o local do servidor (ex: `southamerica-east1` para o Brasil/São Paulo) e avance.
    4. Escolha **"Iniciar no modo de teste"** (para liberar o acesso de leitura/escrita inicial) e clique em **Criar**.
*   **Imagens (Storage)**:
    1. No menu esquerdo, vá em **Build > Storage**.
    2. Clique em **"Começar"**.
    3. Escolha **"Iniciar no modo de teste"** e clique em **Próximo** e **Concluído**.

---

## 🚀 Passo 2: Hospedar o Site Grátis no Firebase Hosting

Com os arquivos organizados, você pode colocar o site no ar usando o Firebase Hosting:

1.  Abra o terminal (PowerShell ou Prompt de Comando) e instale as ferramentas do Firebase globalmente executando:
    ```bash
    npm install -g firebase-tools
    ```
2.  Faça login no Firebase pelo terminal executando:
    ```bash
    firebase login
    ```
    *(Uma janela de navegador se abrirá para você autorizar o login com sua conta do Google)*.
3.  Vá até a pasta do projeto Nunes Grife no terminal:
    ```bash
    cd "C:\Users\ACER\Nova pasta\Desktop\nunes-grife"
    ```
4.  Inicie a configuração do Hosting executando:
    ```bash
    firebase init hosting
    ```
    *   Selecione **"Use an existing project"** (Usar projeto existente).
    *   Selecione o projeto `nunes-grife` da lista.
    *   Para a pergunta *"What do you want to use as your public directory?"*, digite `.` (ponto) e aperte Enter. *(Isso fará com que o diretório atual seja a raiz pública)*.
    *   Para a pergunta *"Configure as a single-page app?"*, responda `No` (`N`).
    *   Para a pergunta *"Set up automatic builds and deploys with GitHub?"*, responda `No` (`N`).
    *   Se perguntar se deseja sobrescrever o `index.html`, responda **`No` (`N`)** para não apagar nossa loja!
5.  Coloque o site no ar executando:
    ```bash
    firebase deploy
    ```
6.  Ao finalizar, o terminal exibirá a **Hosting URL** (ex: `https://nunes-grife.web.app`). **Seu site já estará online e funcional!**

---

## 💻 Passo 3: Adicionar o Projeto no GitHub

O projeto já está inicializado localmente com o Git e o primeiro commit foi realizado. Para colocá-lo no ar no seu GitHub:

1.  Acesse o [GitHub](https://github.com/) e faça login.
2.  Clique no botão **"New"** (Novo repositório) no canto superior esquerdo.
3.  Dê o nome ao repositório de `nunes-grife`. Você pode deixá-lo público ou privado.
4.  **Não** marque nenhuma opção como "Add a README", "Add .gitignore" ou "Choose a license" (pois já configuramos isso localmente). Clique em **"Create repository"**.
5.  O GitHub exibirá uma página com as instruções para subir um repositório existente. Abra o terminal na pasta do projeto e execute os seguintes comandos:
    ```bash
    git branch -M main
    git remote add origin https://github.com/SEU-USUARIO/nunes-grife.git
    git push -u origin main
    ```
    *(Substitua `SEU-USUARIO` pelo seu nome de usuário real do GitHub)*.

Pronto! Seu código estará seguro na nuvem do GitHub e o site estará online hospedado no Firebase!
