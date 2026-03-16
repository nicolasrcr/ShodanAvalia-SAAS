// Store for untranslated errors (in-memory, could be persisted to backend)
const untranslatedErrors: Set<string> = new Set();
let logCounter = 0;

// Configure logging (could be extended to send to analytics service)
const LOGGING_CONFIG = {
  enabled: true,
  maxStored: 100,
  prefix: '[Translation]',
  sendToBackend: false, // Set to true to enable backend logging
};

/**
 * Logs an untranslated error message for later review
 * Helps identify which messages need manual translation
 */
function logUntranslatedError(message: string, result: string): void {
  if (!LOGGING_CONFIG.enabled) return;

  // Only log if it wasn't directly translated
  const wasDirectlyTranslated = ERROR_TRANSLATIONS[message] !== undefined;
  const wasPartialMatch = Object.keys(ERROR_TRANSLATIONS).some(key =>
    message.toLowerCase().includes(key.toLowerCase())
  );
  const wasGenericFallback = applyGenericFallback(message) !== null;

  // Skip if it was translated by any method other than English indicator wrapping
  if (wasDirectlyTranslated || wasPartialMatch || wasGenericFallback) return;

  // Check if it's an English message that got wrapped
  const englishIndicators = /\b(the|is|are|was|were|has|have|not|for|with|this|that|from|your|can|will|should|must|error|failed|invalid|unable|cannot)\b/i;
  const wasWrapped = englishIndicators.test(message);

  // Store for analysis
  if (!untranslatedErrors.has(message)) {
    untranslatedErrors.add(message);
    logCounter++;

    // Console warning with metadata (dev only)
    if (import.meta.env.DEV) {
      console.warn(
        `${LOGGING_CONFIG.prefix} Untranslated error #${logCounter}:`,
        {
          original: message,
          result: result,
          type: wasWrapped ? 'wrapped_english' : 'unknown_format',
          timestamp: new Date().toISOString(),
        }
      );
    }

    // Could send to analytics backend here
    if (LOGGING_CONFIG.sendToBackend) {
      // sendToAnalytics({ message, result, timestamp: Date.now() });
    }

    // Keep set size manageable
    if (untranslatedErrors.size > LOGGING_CONFIG.maxStored) {
      const firstItem = untranslatedErrors.values().next().value;
      untranslatedErrors.delete(firstItem);
    }
  }
}

/**
 * Get all untranslated errors for review
 * Useful for finding which messages need to be added to the dictionary
 */
export function getUntranslatedErrors(): string[] {
  return Array.from(untranslatedErrors);
}

/**
 * Get statistics about translations
 */
export function getTranslationStats(): {
  totalUntranslated: number;
  loggingEnabled: boolean;
  dictionarySize: number;
} {
  return {
    totalUntranslated: untranslatedErrors.size,
    loggingEnabled: LOGGING_CONFIG.enabled,
    dictionarySize: Object.keys(ERROR_TRANSLATIONS).length,
  };
}

/**
 * Clear the untranslated errors log
 */
export function clearUntranslatedErrors(): void {
  untranslatedErrors.clear();
  logCounter = 0;
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  // Auth errors
  'Invalid login credentials': 'Email ou senha incorretos',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
  'User already registered': 'Este email já está cadastrado.',
  'Signup requires a valid password': 'A senha informada não é válida.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Email rate limit exceeded': 'Limite de envio de emails excedido. Tente novamente mais tarde.',
  'For security purposes, you can only request this after': 'Por segurança, você só pode solicitar isso após',
  'Token has expired or is invalid': 'O link expirou ou é inválido. Solicite um novo.',
  'User not found': 'Usuário não encontrado.',
  'Invalid token': 'Token inválido. Solicite um novo link.',
  'Email link is invalid or has expired': 'O link de email é inválido ou expirou.',
  'Auth session missing': 'Sessão não encontrada. Faça login novamente.',
  'Invalid email or password': 'Email ou senha inválidos.',
  'Email already in use': 'Este email já está em uso.',
  'Weak password': 'A senha é muito fraca. Use letras, números e caracteres especiais.',
  'Password is too short': 'A senha é muito curta.',
  'Password is too long': 'A senha é muito longa.',
  'Unable to validate email address: invalid format': 'Formato de email inválido.',
  'A user with this email address has already been registered': 'Este email já está cadastrado.',
  'Only an admin can modify a user': 'Apenas um administrador pode alterar este usuário.',
  'otp_expired': 'Código de verificação expirado. Solicite um novo.',

  // Database/RLS errors
  'new row violates row-level security policy': 'Permissão negada. Você não tem autorização para esta ação.',
  'Row level security policy violation': 'Permissão negada. Política de segurança violada.',
  'permission denied': 'Permissão negada.',
  'duplicate key value violates unique constraint': 'Este registro já existe no sistema.',
  'violates foreign key constraint': 'Este registro está vinculado a outros dados e não pode ser alterado.',
  'null value in column': 'Campo obrigatório não preenchido.',
  'value too long for type': 'O valor informado é muito longo.',
  'Could not find the referenced': 'Referência não encontrada. O registro vinculado não existe.',
  'update or delete on table': 'Este registro está sendo usado em outro lugar e não pode ser removido.',
  'relation does not exist': 'Erro interno: tabela não encontrada.',
  'column does not exist': 'Erro interno: campo não encontrado.',
  'syntax error': 'Erro interno: consulta inválida.',
  'Could not find the': 'Registro não encontrado no sistema.',
  'JSON object requested, multiple (or no) rows returned': 'Erro ao buscar dados: resultado inesperado.',
  'Results contain 0 rows': 'Nenhum resultado encontrado.',

  // Enum errors
  'invalid input value for enum': 'Valor inválido selecionado.',
  'invalid input value for enum app_role': 'Papel de usuário inválido. Selecione um papel válido (admin, moderador ou usuário).',
  'invalid input value for enum validation_status': 'Status de validação inválido.',

  // Network/General
  'Failed to fetch': 'Falha na conexão. Verifique sua internet.',
  'NetworkError': 'Erro de rede. Verifique sua conexão.',
  'Load failed': 'Falha ao carregar. Verifique sua conexão.',
  'JWT expired': 'Sua sessão expirou. Faça login novamente.',
  'not found': 'Registro não encontrado.',
  'Not found': 'Registro não encontrado.',
  'FetchError': 'Erro ao buscar dados. Verifique sua conexão.',
  'AbortError': 'A operação foi cancelada.',
  'TypeError: Failed to fetch': 'Erro de conexão. Verifique sua internet.',
  'Request timeout': 'A requisição demorou muito. Tente novamente.',
  'Too many requests': 'Muitas requisições. Aguarde um momento e tente novamente.',
  'Internal server error': 'Erro interno do servidor. Tente novamente mais tarde.',
  'Service unavailable': 'Serviço temporariamente indisponível.',
  'Bad gateway': 'Erro de comunicação com o servidor.',
  'Gateway timeout': 'O servidor demorou para responder.',

  // Storage
  'Payload too large': 'Arquivo muito grande.',
  'The resource already exists': 'Este arquivo já existe.',
  'Bucket not found': 'Armazenamento não encontrado.',
  'Object not found': 'Arquivo não encontrado.',
  'Mime type not allowed': 'Tipo de arquivo não permitido.',
  'Storage quota exceeded': 'Limite de armazenamento excedido.',

  // Edge Functions
  'FunctionsFetchError': 'Erro ao chamar função do servidor.',
  'FunctionsRelayError': 'Erro de comunicação com o servidor.',
  'FunctionsHttpError': 'Erro na resposta do servidor.',
  'non-2xx response': 'O servidor retornou um erro.',
};

// Generic English-to-Portuguese fallback patterns
const GENERIC_PATTERNS: [RegExp, string][] = [
  [/^cannot\s+(.+)/i, 'Não foi possível $1.'],
  [/^could not\s+(.+)/i, 'Não foi possível $1.'],
  [/^unable to\s+(.+)/i, 'Não foi possível $1.'],
  [/^failed to\s+(.+)/i, 'Falha ao $1.'],
  [/^error\s+(.+)/i, 'Erro: $1.'],
  [/^invalid\s+(.+)/i, 'Inválido: $1.'],
  [/^missing\s+(.+)/i, 'Ausente: $1.'],
  [/^unexpected\s+(.+)/i, 'Inesperado: $1.'],
  [/^access denied/i, 'Acesso negado.'],
  [/^unauthorized/i, 'Não autorizado. Faça login novamente.'],
  [/^forbidden/i, 'Acesso proibido.'],
  [/^conflict/i, 'Conflito: o registro já existe ou foi alterado.'],
  [/^timeout/i, 'Tempo esgotado. Tente novamente.'],
  [/^too many/i, 'Muitas tentativas. Aguarde e tente novamente.'],
  [/^no (.+) found/i, 'Nenhum(a) $1 encontrado(a).'],
  [/^(.+) is required/i, 'O campo $1 é obrigatório.'],
  [/^(.+) must be/i, '$1 deve ser válido.'],
  [/^(.+) already exists/i, '$1 já existe no sistema.'],
  [/^(.+) not found/i, '$1 não encontrado(a).'],
  [/^(.+) has expired/i, '$1 expirou.'],
  [/^(.+) is not allowed/i, '$1 não é permitido.'],
  [/^(.+) is too (short|long|large|small)/i, '$1 é muito $2.'],
];

const SIZE_WORDS: Record<string, string> = {
  short: 'curto',
  long: 'longo',
  large: 'grande',
  small: 'pequeno',
};

function applyGenericFallback(message: string): string | null {
  for (const [pattern, template] of GENERIC_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      let result = template;
      for (let i = 1; i < match.length; i++) {
        let replacement = match[i];
        // Translate common size words
        if (SIZE_WORDS[replacement.toLowerCase()]) {
          replacement = SIZE_WORDS[replacement.toLowerCase()];
        }
        result = result.replace(`$${i}`, replacement);
      }
      return result;
    }
  }
  return null;
}

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

  // Generic pattern fallback
  const fallback = applyGenericFallback(message);
  if (fallback) {
    logUntranslatedError(message, fallback);
    return fallback;
  }

  // If message looks like English (has common English words), wrap it
  const englishIndicators = /\b(the|is|are|was|were|has|have|not|for|with|this|that|from|your|can|will|should|must|error|failed|invalid|unable|cannot)\b/i;
  if (englishIndicators.test(message)) {
    const wrappedResult = `Erro: ${message}`;
    logUntranslatedError(message, wrappedResult);
    return wrappedResult;
  }

  // Return original (likely already in Portuguese)
  // Still log it so we can confirm it's being handled
  logUntranslatedError(message, message);
  return message;
}
