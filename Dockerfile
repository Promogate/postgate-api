# Use a imagem oficial Node.js como imagem base
FROM node:20 AS base

# Configurações comuns
WORKDIR /postgate
RUN apt-get update
RUN apt-get install -y yarn chromium gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
COPY package.json yarn.lock ./
COPY ./prisma ./prisma

# Estágio de dependências
FROM base AS deps

# Instale as dependências do Node.js
RUN yarn install --frozen-lockfile

# Estágio de construção
FROM base AS builder

# Copie as dependências instaladas para o estágio de construção
COPY --from=deps /postgate/node_modules ./node_modules

# Copie o restante dos arquivos do projeto
COPY . .

# Gere o cliente Prisma
RUN npx prisma generate

# Compile o projeto
RUN yarn build

# Estágio final para a imagem de produção
FROM base AS production

# Defina a variável NODE_ENV para produção
ENV NODE_ENV=production

# Copie as dependências do estágio deps
COPY --from=deps /postgate/node_modules ./node_modules

# Copie os arquivos construídos do estágio de construção
COPY --from=builder /postgate/dist ./dist

# Copie os arquivos necessários para a execução
COPY src ./src

# Exponha a porta que sua aplicação usará
EXPOSE 8090

# Comando para rodar a aplicação
CMD ["yarn", "start:prod"]
