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
# Stage 2: Full-Stack Production Runtime
# ==========================================
FROM node:20-alpine AS runtime

WORKDIR /app

# Set production flags
ENV NODE_ENV=production
ENV PORT=5000

# Install backend dependencies
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source files
COPY backend/ ./backend/

# Copy compiled frontend assets from build stage
COPY --from=build /app/dist ./dist

# Expose production port
EXPOSE 5000

# Start unified Full-Stack MedXpert application
CMD ["node", "backend/server.js"]
