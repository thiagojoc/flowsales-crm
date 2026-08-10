# Instruções de estilo (Thiago)

- **Nunca usar travessão (— ou –)** em nenhum texto criado para o Thiago:
  nem em código, nem em comentários, nem em textos de interface, nem em
  respostas de chat, nem em commits. Usar vírgula, ponto, dois pontos,
  parênteses ou a palavra "ou"/"e" no lugar.
- **Tipografia grande desde o início.** Em qualquer HTML/CSS criado para o
  Thiago, nunca começar com fontes pequenas (10-13px) esperando ele pedir
  pra aumentar depois. Textos de apoio/legendas: mínimo ~14px. Texto de
  corpo/inputs: ~15-16px. Títulos de modal: ~20px+. Já aconteceu duas
  vezes (app de atividades e este CRM) de precisar corrigir depois porque
  nasceu pequeno demais; a referência a seguir é essa correção.
- **Toda tela de login criada pro Thiago precisa ter**: (1) o "olhinho" no
  campo de senha, pra mostrar/ocultar o que foi digitado (botão `.pass-eye`
  dentro de um `.pass-wrap`, já existe nesse arquivo); (2) opção "Esqueci
  minha senha" que já dispara o e-mail de redefinição de verdade
  (`sendPasswordResetEmail` do Firebase Auth), não só um link decorativo.
  Vale desde a primeira versão da tela, não só depois que der problema de
  login. Nota: o "Esqueci minha senha" deste CRM ainda é o modelo antigo
  (só mostra uma mensagem pra falar com o administrador), porque o login
  daqui não usa Firebase Auth de verdade, usa autenticação anônima com
  senha guardada no Firestore. Ainda não foi migrado pro padrão novo.

# Sobre este projeto

CRM de prospecção da FlowSales (`crmflowsalessjc.html`), single file, sem
build, com login próprio (e-mail/senha de Thiago e Carlos). Sincroniza via
Firestore no mesmo projeto Firebase compartilhado com as outras
ferramentas do Thiago. Publicado via GitHub Pages.
