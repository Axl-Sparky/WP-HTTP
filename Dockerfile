FROM quay.io/eypzgod/izumi:latest

# Clone the public repository
RUN git clone https://github.com/Axl-Sparky/WP-HTTP /root/req/

# Set working directory
WORKDIR /root/req/

# Install dependencies
RUN yarn install --network-concurrency 1

# Install PM2 globally
RUN yarn global add pm2@6.0.5

# Start the app
CMD ["npm", "start"]
