FROM quay.io/eypzgod/izumi:latest
RUN git clone https://github.com/Axl-Sparky/WP-HTTP/tree/main /root/req/
WORKDIR /root/req/
RUN yarn install --network-concurrency 1
RUN yarn global add pm2@6.0.5
CMD ["npm", "start"]
