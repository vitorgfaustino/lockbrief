/**
 * LockBrief — Internacionalização (PT-BR).
 * Strings extraídas para facilitar forks.
 */

export type Lang = "pt-BR";

interface Strings {
  title: string;
  tagline: string;
  createTitle: string;
  createCta: string;
  createSectionMessage: string;
  createSectionProtection: string;
  createSectionExpiry: string;
  createSectionRead: string;
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
  protectionKeyLabel: string;
  protectionPasswordLabel: string;
  protectionKeyHint: string;
  protectionPasswordHint: string;
  generatePasswordBtn: string;
  oneTimeLabel: string;
  multiReadNotice: string;
  createdTitle: string;
  createdSubtitle: string;
  createdSubtitlePwd: string;
  resultSummaryTitle: string;
  summaryExpiresLabel: string;
  summaryReadLabel: string;
  summaryProtectionLabel: string;
  summaryOneTime: string;
  summaryMultiRead: string;
  summaryProtectionKey: string;
  summaryProtectionPassword: string;
  copyBtn: string;
  copiedBtn: string;
  createNewBtn: string;
  backHomeBtn: string;
  revealTitle: string;
  revealMultiTitle: string;
  revealSubtitle: string;
  revealMultiSubtitle: string;
  revealWarning: string;
  revealRequirementKey: string;
  revealRequirementPassword: string;
  revealRequirementReady: string;
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
  recommendedBadge: string;
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
  revealKeyBtn: string;
  revealKeyRetryBtn: string;
  passwordGenerated: string;
  oneTimeOn: string;
  oneTimeOff: string;
  secretRequired: string;
  secretTooLong: string;
  passwordRequired: string;
  createdWarning: string;
  createdLeaveConfirm: string;
  revealKeyPlaceholder: string;
  revealPwdPlaceholder: string;
  revealPostFetchTitle: string;
  revealPostFetchSubtitle: string;
  revealPostFetchMultiSubtitle: string;
  revealPostFetchWarning: string;
  revealPostFetchMultiWarning: string;
  revealPostFetchPassword: string;
  revealPostFetchKey: string;
  leaveLostAccess: string;
  leaveLostAccessConfirm: string;
  revealedMultiSubtitle: string;
  copySecretLabel: string;
  copyFailed: string;
  copyFailedBtn: string;
  expired: string;
  expiresIn: string;
  errorCreateTitle: string;
  errorCreateText: string;
  errorCreateRetry: string;
  errorRateLimitTitle: string;
  errorRateLimitText: string;
  errorNetworkTitle: string;
  errorNetworkText: string;
  errorInfoTitle: string;
  errorInfoText: string;
  errorFetchTitle: string;
  errorFetchText: string;
  errorRetry: string;
}

const ptBR: Strings = {
  title: "LockBrief",
  tagline: "Segredos efêmeros. Controle local.",
  createTitle: "Crie um segredo seguro.",
  createCta: "Criar link seguro",
  createSectionMessage: "Mensagem",
  createSectionProtection: "Proteção",
  createSectionExpiry: "Expiração",
  createSectionRead: "Leitura",
  secretLabel: "Segredo",
  secretPlaceholder: "Digite o segredo que deseja compartilhar...",
  secretHint: "Criptografia local.",
  expiresLabel: "Expira em",
  expires1h: "1 hora",
  expires1d: "1 dia",
  expires1w: "1 semana",
  passwordLabel: "Senha manual",
  passwordPlaceholder: "Digite sua senha manual ou gere uma sugestão",
  passwordHint: "Você pode definir sua própria senha manual ou usar uma sugestão gerada localmente. Envie por outro canal. O servidor nunca recebe essa senha.",
  protectionKeyLabel: "Senha automática",
  protectionPasswordLabel: "Senha manual",
  protectionKeyHint: "Modo mais forte. A senha automática de 256 bits fica no link completo ou pode ser enviada separadamente.",
  protectionPasswordHint: "Use quando a pessoa precisa digitar ou ouvir uma senha manual.",
  generatePasswordBtn: "Gerar senha",
  oneTimeLabel: "Destruir após leitura",
  multiReadNotice: "Com esta opção desativada, o segredo deixará de ficar disponível no banco ativo apenas ao fim do prazo de expiração e poderá ser visualizado de forma ilimitada nesse intervalo.",
  createdTitle: "Link criado com sucesso.",
  createdSubtitle: "Escolha o formato mais adequado ao canal onde você vai compartilhar.",
  createdSubtitlePwd: "Envie o link e a senha por canais diferentes sempre que possível.",
  resultSummaryTitle: "Resumo da configuração",
  summaryExpiresLabel: "Expiração",
  summaryReadLabel: "Leitura",
  summaryProtectionLabel: "Proteção",
  summaryOneTime: "Remove no primeiro acesso",
  summaryMultiRead: "Permite acessos até expirar",
  summaryProtectionKey: "Senha automática",
  summaryProtectionPassword: "Senha manual",
  copyBtn: "Copiar",
  copiedBtn: "Copiado",
  createNewBtn: "Criar novo segredo",
  backHomeBtn: "Voltar ao início",
  revealTitle: "Este segredo só pode ser revelado uma vez.",
  revealMultiTitle: "Revele o segredo.",
  revealSubtitle: "Confira se você está pronto antes de buscar a mensagem do servidor.",
  revealMultiSubtitle: "Este segredo pode ser acessado novamente até a expiração.",
  revealWarning: "Ao clicar em Revelar mensagem, o segredo será removido do banco ativo. Se fechar esta aba antes de concluir, talvez não seja possível abrir novamente.",
  revealRequirementKey: "Tenha a senha automática do segredo em mãos. Ela será solicitada depois da confirmação.",
  revealRequirementPassword: "Tenha a senha manual em mãos. Ela será solicitada depois da confirmação.",
  revealRequirementReady: "Nenhuma informação adicional será solicitada para este link.",
  revealKeyLabel: "Senha automática",
  revealKeyHint: "Cole a senha automática recebida por outro canal. Ela tem 43 caracteres.",
  revealPasswordLabel: "Senha manual",
  revealBtn: "Revelar mensagem",
  cancelBtn: "Cancelar",
  revealedTitle: "Segredo revelado.",
  revealedSubtitle: "Este segredo foi removido do banco ativo. Guarde-o com segurança.",
  revealedDanger: "Depois de sair desta tela, este conteúdo não poderá ser recuperado.",
  secretContentLabel: "Conteúdo",
  unavailableTitle: "Segredo indisponível",
  unavailableText: "Não foi possível abrir este segredo. Para proteger a privacidade, o LockBrief não informa a causa exata.",
  unavailableReasonsTitle: "O que pode ter acontecido",
  unavailableReasonConsumed: "O segredo já pode ter sido revelado em uma leitura anterior.",
  unavailableReasonExpired: "O prazo de expiração pode ter terminado.",
  unavailableReasonLink: "O link ou a senha podem estar incompletos ou alterados.",
  unavailableReasonClosedAfterError: "Em leitura única, uma tentativa anterior com senha automática ou manual incorreta pode ter consumido o acesso se a aba foi fechada antes da correção.",
  unavailablePrivacyNote: "Nenhum conteúdo em texto claro foi enviado ao servidor durante esta tentativa.",
  loadingText: "Processando...",
  noticeKeyFragment: "A senha automática fica apenas no seu navegador e no fragmento do link. O servidor nunca a recebe.",
  charsCounter: "bytes",
  fullLinkLabel: "Link completo",
  recommendedBadge: "Recomendado",
  fullLinkDesc: "Inclui a senha automática no fragmento da URL. É prático, mas deve ser usado em canais confiáveis.",
  fullLinkDescPwd: "Link da mensagem protegida por senha manual. A senha manual precisa seguir por outro canal.",
  shortLinkLabel: "Link sem senha",
  shortLinkDesc: "Use para canais menos confiáveis. Envie a senha automática separadamente.",
  keyLabel: "Senha automática",
  keyDesc: "Necessária para descriptografar. Envie por um canal diferente do link sem senha.",
  passwordResultLabel: "Senha manual",
  passwordResultDesc: "O destinatário precisa desta senha manual além do link. Envie por outro canal. Ela não foi enviada ao servidor.",
  // Validation warnings
  revealKeyWarning: "O segredo já foi buscado do servidor. Em leitura única, não feche esta tela até concluir.",
  revealPwdWarning: "A senha manual é validada somente no navegador. Em leitura única, não feche esta tela até concluir.",
  revealPwdLabel: "Senha manual",
  revealPwdHint: "Este segredo foi protegido com senha manual.",
  revealPwdBtn: "Descriptografar",
  revealPwdRetryBtn: "Tentar novamente",
  revealPwdError: "Senha manual incorreta. Tente novamente.",
  revealKeyError: "Senha automática incorreta. Verifique e tente novamente.",
  revealKeyBtn: "Descriptografar",
  revealKeyRetryBtn: "Tentar novamente",
  passwordGenerated: "Sugestão de senha manual gerada. Substitua ou use esta senha.",
  oneTimeOn: "Leitura única ativada.",
  oneTimeOff: "Leitura múltipla ativada.",
  secretRequired: "Digite um segredo para continuar.",
  secretTooLong: "A mensagem excede 64 KB em UTF-8. Reduza o conteúdo antes de continuar.",
  passwordRequired: "Defina uma senha manual ou clique em Gerar senha.",
  createdWarning: "A senha automática ou a senha manual só existe nesta tela. Copie antes de sair; não será possível recuperá-la depois.",
  createdLeaveConfirm: "A senha automática ou a senha manual só existe nesta tela. Se sair agora, não será possível recuperá-la. Deseja sair mesmo assim?",
  revealKeyPlaceholder: "Cole a senha automática recebida por outro canal",
  revealPwdPlaceholder: "Digite a senha manual",
  revealPostFetchTitle: "Mensagem localizada. Falta descriptografar.",
  revealPostFetchSubtitle: "O segredo já saiu do servidor. Não feche esta tela até concluir.",
  revealPostFetchMultiSubtitle: "O segredo foi buscado. Você pode tentar novamente até a expiração.",
  revealPostFetchWarning: "Em leitura única, o segredo já foi removido do banco ativo. Não feche esta tela até concluir.",
  revealPostFetchMultiWarning: "O segredo continua disponível até a expiração.",
  revealPostFetchPassword: "Digite a senha manual para concluir. O segredo já foi buscado.",
  revealPostFetchKey: "Cole a senha automática correta para concluir. O segredo já foi buscado.",
  leaveLostAccess: "Sair e perder o acesso",
  leaveLostAccessConfirm: "O segredo já foi buscado e só existe nesta aba. Se sair agora, não será possível recuperá-lo. Deseja sair mesmo assim?",
  revealedMultiSubtitle: "Este segredo pode ser acessado novamente até a expiração.",
  copySecretLabel: "Copiar segredo",
  copyFailed: "Não foi possível copiar. Selecione o campo e copie manualmente.",
  copyFailedBtn: "Não foi possível copiar",
  expired: "Expirado",
  expiresIn: "Expira em",
  errorCreateTitle: "Não foi possível criar o link.",
  errorCreateText: "Não foi possível confirmar o envio. Seu rascunho foi preservado nesta aba; você pode tentar novamente.",
  errorCreateRetry: "Voltar e tentar novamente",
  errorRateLimitTitle: "Muitas tentativas.",
  errorRateLimitText: "Aguarde 60 segundos e tente novamente.",
  errorNetworkTitle: "Sem conexão.",
  errorNetworkText: "A conexão falhou. Verifique sua conexão e tente novamente.",
  errorInfoTitle: "Não foi possível consultar o link.",
  errorInfoText: "A consulta não foi concluída. O link já foi removido da barra de endereço; use \"Tentar novamente\" sem recarregar a página.",
  errorFetchTitle: "Não foi possível buscar o segredo.",
  errorFetchText: "A resposta pode ter sido perdida. Em leitura única, o segredo pode já ter sido consumido. Por segurança, não repetimos a busca automaticamente.",
  errorRetry: "Tentar novamente",
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
