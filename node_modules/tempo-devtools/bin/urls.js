// ==================== URL BUILDERS =========================================

function buildLoginUrl() {
  const tempoEnv = process.env.TEMPO_ENV || 'PROD';
  const LOGIN_URLS = {
    DEV: 'http://localhost:3050/localLogin',
    STAGING: 'https://staging.tempolabs.ai/localLogin',
    PROD: 'https://app.tempolabs.ai/localLogin',
  };
  return LOGIN_URLS[tempoEnv.toUpperCase()] || LOGIN_URLS['PROD'];
}

function buildBackendUrl() {
  const tempoEnv = process.env.TEMPO_ENV || 'PROD';
  const BACKEND_URLS = {
    DEV: 'http://localhost:3001',
    STAGING: 'https://staging-api.tempolabs.ai',
    PROD: 'https://api.tempolabs.ai',
  };
  return BACKEND_URLS[tempoEnv.toUpperCase()] || BACKEND_URLS['PROD'];
}

function buildSshHost(dockerContainerName, tempoEnv) {
  if (tempoEnv === 'DEV') {
    return 'localhost';
  } else if (tempoEnv === 'STAGING') {
    return `ssh-${dockerContainerName}.staging-dev.tempolabs.ai`;
  } else {
    return `ssh-${dockerContainerName}.dev.tempolabs.ai`;
  }
}

module.exports = {
  buildLoginUrl,
  buildBackendUrl,
  buildSshHost,
};
