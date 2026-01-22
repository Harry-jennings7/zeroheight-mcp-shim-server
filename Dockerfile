
# Dockerfile
FROM node:20-alpine

# Ensure system root CAs are installed
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy package files and install prod deps first
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Copy your corporate CA bundle into the image (prefer a build secret in CI)
# e.g., put corp-bundle.pem next to Dockerfile (or adjust path)
COPY corp-bundle.pem /etc/ssl/certs/corp-bundle.pem

# Tell Node to use your CA bundle (applies to the whole process)
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/corp-bundle.pem

# Build TS
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/server.js"]
