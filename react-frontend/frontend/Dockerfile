# Multi-stage Dockerfile for React frontend
FROM node:20 AS build
WORKDIR /app
COPY package.json .
# Remove lock file to allow package.json version to be used
RUN rm -f package-lock.json
# Install dependencies (will use versions from package.json)
RUN npm install
# Copy rest of the files
COPY . .
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
