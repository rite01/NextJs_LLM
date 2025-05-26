# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Fix potential network issues with npm
RUN npm config set registry https://registry.npmjs.org/

# Copy only package files and install dependencies first (for cache efficiency)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the code
COPY . .

# Optional: build (if Next.js / React / TypeScript app)
# RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev"]
