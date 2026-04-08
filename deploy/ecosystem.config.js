module.exports = {
  apps: [
    {
      name: "wellness-tracker",
      script: "server.js",
      cwd: "/var/www/wellness-tracker/Server",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      // Restart on failure
      max_restarts: 10,
      min_uptime: "10s",
      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/pm2/wellness-error.log",
      out_file: "/var/log/pm2/wellness-out.log",
      merge_logs: true,
      // Graceful restart
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
