# Multi-stage Dockerfile for React frontend
FROM node:20 AS build
WORKDIR /app

# Aumentar memória do Node.js
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Define build arguments for environment variables
ARG VITE_FLAGSMITH_ENVIRONMENT_KEY
ARG VITE_GOOGLE_MAPS_API_KEY

# Set environment variables from build arguments
ENV VITE_FLAGSMITH_ENVIRONMENT_KEY=${VITE_FLAGSMITH_ENVIRONMENT_KEY}
ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}

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
# Use nginx.azure.conf para produção (Azure Container Apps)
COPY nginx.azure.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Healthcheck para o container
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1
