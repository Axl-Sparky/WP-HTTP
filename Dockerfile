# Use the official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the code into the container
COPY . .

# Expose the port
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
