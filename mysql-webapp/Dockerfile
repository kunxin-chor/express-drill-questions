# Use Node 20 as the base image
FROM node:20-slim

# Install native dependencies required by MySQL
# We include libaio1 (for older Ubuntu/Debian) and libnuma1
RUN apt-get update && apt-get install -y \
    libaio1 \
    libnuma1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json .
COPY client/package.json ./client/

# Install dependencies (including devDeps for build)
RUN npm install --include=dev
RUN npm --prefix client install

# Copy the rest of the application
COPY . .

# Build questions and the React client
RUN npm run build

# mysqld refuses to run as root, so run the prefetch (and the app) as the
# unprivileged "node" user that ships with the base image.
# Pin TMPDIR inside the image so the downloaded MySQL binary is baked into
# an image layer and survives cold starts (os.tmpdir() honors TMPDIR).
ENV TMPDIR=/app/.mysql-tmp
RUN mkdir -p /app/.mysql-tmp && chown -R node:node /app
USER node

# Prefetch the MySQL binary so it is baked into the image layers.
# This avoids the large download on every cold start.
RUN npm run prefetch:mysql

# Render uses the PORT environment variable
ENV PORT=5174
EXPOSE 5174

CMD ["node", "server.js"]
