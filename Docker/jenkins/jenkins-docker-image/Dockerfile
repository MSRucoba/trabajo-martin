# ============================================
# Jenkins custom image con Node.js, Docker y sonar-scanner
# ============================================
FROM jenkins/jenkins:lts

USER root

# Instalar dependencias base
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Instalar Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Instalar Docker CLI (para poder hacer docker build dentro del pipeline)
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Instalar sonar-scanner globalmente
RUN npm install -g sonarqube-scanner

# Verificar versiones instaladas
RUN node --version && npm --version && docker --version && sonar-scanner --version || true

USER jenkins
