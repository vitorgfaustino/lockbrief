/**
 * LockBrief — Internacionalização (PT-BR).
 * Strings extraídas para facilitar forks.
 */

export type Lang = "pt-BR";

interface Strings {
  title: string;
  tagline: string;
  createTitle: string;
  createSubtitle: string;
  createCta: string;
  secretLabel: string;
  secretPlaceholder: string;
  secretHint: string;
  expiresLabel: string;
  expires1h: string;
  expires1d: string;
  expires1w: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  passwordHint: string;
  oneTimeLabel: string;
  createdTitle: string;
  createdSubtitle: string;
  createdSubtitlePwd: string;
  copyBtn: string;
  copiedBtn: string;
  createNewBtn: string;
  backHomeBtn: string;
  revealTitle: string;
  revealMultiTitle: string;
  revealSubtitle: string;
  revealMultiSubtitle: string;
  revealWarning: string;
  revealKeyLabel: string;
  revealKeyHint: string;
  revealPasswordLabel: string;
  revealBtn: string;
  cancelBtn: string;
  revealedTitle: string;
  revealedSubtitle: string;
  revealedDanger: string;
  secretContentLabel: string;
  unavailableTitle: string;
  unavailableText: string;
  unavailableReasonsTitle: string;
  unavailableReasonConsumed: string;
  unavailableReasonExpired: string;
  unavailableReasonLink: string;
  unavailableReasonClosedAfterError: string;
  unavailablePrivacyNote: string;
  loadingText: string;
  noticeKeyFragment: string;
  charsCounter: string;
  fullLinkLabel: string;
  fullLinkDesc: string;
  fullLinkDescPwd: string;
  shortLinkLabel: string;
  shortLinkDesc: string;
  keyLabel: string;
  keyDesc: string;
  passwordResultLabel: string;
  passwordResultDesc: string;
  revealKeyWarning: string;
  revealPwdWarning: string;
  revealPwdLabel: string;
  revealPwdHint: string;
  revealPwdBtn: string;
  revealPwdRetryBtn: string;
  revealPwdError: string;
  revealKeyError: string;
  revealKeyRetryBtn: string;
}

const ptBR: Strings = {
  title: "LockBrief",
  tagline: "Segredos efêmeros. Controle local.",
  createTitle: "Crie uma nota segura e temporária.",
  createSubtitle: "O conteúdo é criptografado no navegador antes de sair do seu dispositivo.",
  createCta: "Criar link seguro",
  secretLabel: "Segredo",
  secretPlaceholder: "Digite o segredo que deseja compartilhar...",
  secretHint: "Criptografado localmente antes de enviar.",
  expiresLabel: "Expira em",
  expires1h: "1 hora",
  expires1d: "1 dia",
  expires1w: "1 semana",
  passwordLabel: "Senha adicional",
  passwordPlaceholder: "Opcional",
  passwordHint: "Opcional. Envie por outro canal. O servidor nunca recebe essa senha.",
  oneTimeLabel: "Destruir após leitura",
  createdTitle: "Link criado com sucesso.",
  createdSubtitle: "Escolha o formato mais adequado ao canal onde você vai compartilhar.",
  createdSubtitlePwd: "Envie o link e a senha por canais diferentes sempre que possível.",
  copyBtn: "Copiar",
  copiedBtn: "Copiado",
  createNewBtn: "Criar novo segredo",
  backHomeBtn: "Voltar ao início",
  revealTitle: "Este segredo só pode ser revelado uma vez.",
  revealMultiTitle: "Revele o segredo.",
  revealSubtitle: "Ao continuar, o registro será consumido no servidor antes da descriptografia local.",
  revealMultiSubtitle: "Este segredo pode ser acessado novamente até a expiração.",
  revealWarning: "Continue apenas quando estiver pronto para visualizar. Em leitura única, sair desta tela depois da revelação impede recuperar o conteúdo.",
  revealKeyLabel: "Chave do segredo",
  revealKeyHint: "Cole a chave recebida por outro canal. Ela tem 43 caracteres.",
  revealPasswordLabel: "Senha adicional",
  revealBtn: "Revelar agora",
  cancelBtn: "Cancelar",
  revealedTitle: "Segredo revelado.",
  revealedSubtitle: "Este segredo foi removido do servidor. Guarde-o com segurança.",
  revealedDanger: "Depois de sair desta tela, este conteúdo não poderá ser recuperado.",
  secretContentLabel: "Conteúdo",
  unavailableTitle: "Segredo indisponível",
  unavailableText: "Não foi possível abrir este segredo. Para proteger a privacidade, o LockBrief não informa a causa exata.",
  unavailableReasonsTitle: "O que pode ter acontecido",
  unavailableReasonConsumed: "O segredo já pode ter sido revelado em uma leitura anterior.",
  unavailableReasonExpired: "O prazo de expiração pode ter terminado.",
  unavailableReasonLink: "O link ou a chave podem estar incompletos ou alterados.",
  unavailableReasonClosedAfterError: "Em leitura única, uma tentativa anterior com chave ou senha incorreta pode ter consumido o acesso se a aba foi fechada antes da correção.",
  unavailablePrivacyNote: "Nenhum conteúdo em texto claro foi enviado ao servidor durante esta tentativa.",
  loadingText: "Processando...",
  noticeKeyFragment: "A chave fica apenas no seu navegador e no fragmento do link. O servidor nunca a recebe.",
  charsCounter: "/ 65536",
  fullLinkLabel: "Link completo",
  fullLinkDesc: "Inclui a chave no fragmento da URL. É prático, mas deve ser usado em canais confiáveis.",
  fullLinkDescPwd: "Inclui a chave no fragmento da URL. A senha ainda precisa seguir por outro canal.",
  shortLinkLabel: "Link sem chave",
  shortLinkDesc: "Use para canais menos confiáveis. Envie a chave separadamente.",
  keyLabel: "Chave",
  keyDesc: "Necessária para descriptografar. Envie por um canal diferente do link sem chave.",
  passwordResultLabel: "Senha",
  passwordResultDesc: "O destinatário precisa desta senha além do link. Envie por outro canal. Ela não foi enviada ao servidor.",
  // Validation warnings
  revealKeyWarning: "Ao continuar, a nota de leitura única pode ser removida do servidor antes da validação local da chave. Não feche esta tela até concluir.",
  revealPwdWarning: "A senha é validada somente no navegador. Em leitura única, depois de buscar o envelope, não feche esta tela até concluir.",
  revealPwdLabel: "Senha necessária",
  revealPwdHint: "Este segredo foi protegido com senha adicional.",
  revealPwdBtn: "Descriptografar",
  revealPwdRetryBtn: "Tentar novamente",
  revealPwdError: "Senha incorreta. Tente novamente.",
  revealKeyError: "Chave incorreta. Verifique e tente novamente.",
  revealKeyRetryBtn: "Tentar novamente",
};

const strings: Record<Lang, Strings> = { "pt-BR": ptBR };

export function t(key: keyof Strings, lang: Lang = "pt-BR"): string {
  return strings[lang]?.[key] || strings["pt-BR"][key] || key;
}

export function getLang(): Lang {
  const navLang = navigator.language;
  if (navLang.startsWith("pt")) return "pt-BR";
  return "pt-BR";
}
