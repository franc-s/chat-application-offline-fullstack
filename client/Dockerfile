FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY vitest.config.ts ./
COPY postcss.config.js ./
COPY eslint.config.js ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src/
COPY public ./public/
COPY index.html ./

# Expose port
EXPOSE 3000

# Default command for development
CMD ["npm", "run", "dev"]