# Multi-stage Dockerfile for React frontend
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
# Install dependencies with legacy peer deps flag
RUN npm install --legacy-peer-deps
# Copy rest of the files
COPY . .
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
