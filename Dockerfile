# Use a imagem oficial Node.js como imagem base
FROM node:20-alpine AS base

# Configurações comuns
WORKDIR /postgate
COPY package.json yarn.lock ./
COPY ./prisma ./prisma

# Estágio de dependências
FROM base AS deps

# Instale as dependências do sistema necessárias
RUN apk add --no-cache libc6-compat yarn

# Instale as dependências do Node.js
RUN yarn install --frozen-lockfile

# Estágio de construção
FROM base AS builder

# Copie as dependências instaladas para o estágio de construção
COPY --from=deps /postgate/node_modules ./node_modules

# Copie o restante dos arquivos do projeto
COPY . .

# Gere o cliente Prisma
RUN yarn prisma generate

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
