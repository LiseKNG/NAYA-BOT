// ecosystem.config.cjs
// Configuration PM2 : garde Naya en vie, la redémarre automatiquement
// si elle plante, sans avoir à intervenir manuellement.

module.exports = {
  apps: [
    {
      name: "naya-bot",
      script: "index.js",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 3000,
      watch: false,
    },
  ],
};
