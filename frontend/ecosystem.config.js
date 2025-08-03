module.exports = {
  apps: [{
    name: 'likorea-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/Users/houkjang/likorea/frontend',
    env: {
      NODE_ENV: 'development',
      NODE_OPTIONS: '--max-old-space-size=4096',
      PORT: 3000
    },
    max_memory_restart: '4G',
    watch: false,
    autorestart: true,
    restart_delay: 5000
  }]
};