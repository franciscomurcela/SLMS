# Multi-stage Dockerfile for React frontend
FROM node:20 AS build
WORKDIR /app

# Aumentar memória do Node.js
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package.json package-lock.json* ./
# Install dependencies with legacy peer deps flag
RUN npm install --legacy-peer-deps

# Copy rest of the files
COPY . .

# Build com output verboso
RUN npm run build -- --logLevel info

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
