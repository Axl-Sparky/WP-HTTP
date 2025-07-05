# Use the izumi-based Node environment
FROM quay.io/eypzgod/izumi:latest

# Set the working directory inside the container
WORKDIR /app

# Copy all files from your repo into the container
COPY . .

# Install dependencies
RUN yarn install --network-concurrency 1

# Optional: Install PM2 globally
RUN yarn global add pm2@6.0.5

# Expose the port your app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
