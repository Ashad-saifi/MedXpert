# ==========================================
# Stage 1: Frontend Build Environment
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy frontend lockfiles & configurations
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source & configuration files
COPY frontend/index.html frontend/medxpert.html frontend/vite.config.js frontend/postcss.config.js frontend/tailwind.config.js ./
COPY frontend/src/ ./src/
COPY frontend/public/ ./public/

# Compile high-performance, minified static bundle (generates /app/dist)
RUN npm run build

# ==========================================
# Stage 2: Frontend Production Web Server
# ==========================================
FROM nginx:alpine AS runtime

# Copy compiled frontend assets from build stage to Nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for traffic
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
