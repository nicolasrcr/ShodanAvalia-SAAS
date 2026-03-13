const ERROR_TRANSLATIONS: Record<string, string> = {
  // Auth errors
  'Invalid login credentials': 'Email ou senha incorretos',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
  'User already registered': 'Este email já está cadastrado.',
  'Signup requires a valid password': 'A senha informada não é válida.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Email rate limit exceeded': 'Limite de envio de emails excedido. Tente novamente mais tarde.',
  'For security purposes, you can only request this after': 'Por segurança, você só pode solicitar isso após',
  
  // Database/RLS errors
  'new row violates row-level security policy': 'Permissão negada. Você não tem autorização para esta ação.',
  'Row level security policy violation': 'Permissão negada. Política de segurança violada.',
  'permission denied': 'Permissão negada.',
  'duplicate key value violates unique constraint': 'Este registro já existe no sistema.',
  'violates foreign key constraint': 'Este registro está vinculado a outros dados e não pode ser alterado.',
  'null value in column': 'Campo obrigatório não preenchido.',
  'value too long for type': 'O valor informado é muito longo.',
  
  // Enum errors
  'invalid input value for enum': 'Valor inválido selecionado.',
  'invalid input value for enum app_role': 'Papel de usuário inválido. Selecione um papel válido (admin, moderador ou usuário).',
  
  // Network/General
  'Failed to fetch': 'Falha na conexão. Verifique sua internet.',
  'NetworkError': 'Erro de rede. Verifique sua conexão.',
  'Load failed': 'Falha ao carregar. Verifique sua conexão.',
  'JWT expired': 'Sua sessão expirou. Faça login novamente.',
  'not found': 'Registro não encontrado.',
  'Not found': 'Registro não encontrado.',
  
  // Storage
  'Payload too large': 'Arquivo muito grande.',
  'The resource already exists': 'Este arquivo já existe.',
  'Bucket not found': 'Armazenamento não encontrado.',
};

export function translateError(message: string): string {
  if (!message) return 'Erro desconhecido.';

  // Direct match
  if (ERROR_TRANSLATIONS[message]) {
    return ERROR_TRANSLATIONS[message];
  }

  // Partial match
  for (const [key, translation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }

  // Return original if no translation found
  return message;
}
