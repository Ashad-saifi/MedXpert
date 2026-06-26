# ==========================================
# Stage 1: Frontend Build Environment
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy root lockfiles & configurations
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source & configuration files
COPY index.html vite.config.js postcss.config.js tailwind.config.js ./
COPY src/ ./src/

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
