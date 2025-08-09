# Deployment Documentation

## Overview
This document describes the deployment process for the Likorea project, including both manual and automated deployment options.

## Deployment Scripts

### 1. Interactive Deployment (deploy.sh)
The original deployment script with interactive prompts and confirmations.

```bash
# Basic usage
./deploy.sh production

# With options
./deploy.sh production --force              # Skip test failures
./deploy.sh production --init-db            # Initialize database
./deploy.sh production --force --init-db    # Both options
```

### 2. Automated Deployment (deploy-auto.sh) 🆕
Non-interactive deployment script suitable for CI/CD pipelines.

```bash
# Basic usage
./deploy-auto.sh production

# With options
./deploy-auto.sh production --skip-tests     # Skip all tests
./deploy-auto.sh production --skip-lint      # Skip linting
./deploy-auto.sh production --skip-git-check # Skip git status check

# Development deployment
./deploy-auto.sh development --skip-tests
```

## Environment Configuration

### Required Environment Files

#### Production
- `/backend/.env` - Backend production configuration
- `/frontend/.env` - Frontend production configuration

#### Development
- `/backend/.env.development` or `/backend/.env`
- `/frontend/.env.development` or `/frontend/.env`

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=https://likorea.com,https://www.likorea.com
SESSION_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d
```

#### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://api.likorea.com
REACT_APP_ENV=production
```

## Database Protection 🛡️

### Production Database Safety
The system includes multiple layers of protection:

1. **Environment Detection**
   - Checks NODE_ENV and ENVIRONMENT variables
   - Identifies production MongoDB URIs

2. **Protected Patterns**
   - MongoDB Atlas URLs
   - Production database names
   - Specific connection strings

3. **Operation Blocking**
   - Dangerous operations are blocked in production
   - Requires explicit FORCE_DB_OPERATION=true for overrides

### Safe Database Operations
```javascript
// This will be blocked in production
await safeDbOperation('dropDatabase', async () => {
  await mongoose.connection.dropDatabase();
});

// Override protection (use with extreme caution!)
FORCE_DB_OPERATION=true node utils/initDB.js
```

## Deployment Process

### Pre-deployment Checklist
- [ ] All code changes committed
- [ ] Tests passing locally
- [ ] Environment files configured
- [ ] Database backups completed (production)
- [ ] Deployment window scheduled (production)

### Development Deployment
```bash
# Automated deployment
./deploy-auto.sh development --skip-tests

# Manual process
cd backend && npm install && npm run dev
cd frontend && npm install && npm start
```

### Production Deployment
```bash
# 1. Backup database (manual process)
# 2. Run automated deployment
./deploy-auto.sh production

# 3. Verify deployment
pm2 status
pm2 logs likorea-backend

# 4. Check website
curl https://likorea.com/health
```

## Server Configuration

### PM2 Process Management
```bash
# View status
pm2 status

# View logs
pm2 logs likorea-backend

# Restart
pm2 restart likorea-backend

# Save configuration
pm2 save
pm2 startup
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name likorea.com www.likorea.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name likorea.com www.likorea.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/likorea.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/likorea.com/privkey.pem;
    
    # Frontend
    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## CI/CD Pipeline

### GitHub Actions Workflow
The project includes automated CI/CD:

1. **Testing** - Runs on every push and PR
2. **Security Scanning** - Checks for vulnerabilities
3. **Deployment** - Automatic deployment on main/develop branches

### Pipeline Stages
```yaml
test-backend -> test-frontend -> security-scan -> deploy
```

## Rollback Procedures

### Quick Rollback
```bash
# 1. Revert to previous git commit
git revert HEAD
git push

# 2. Redeploy
./deploy-auto.sh production

# 3. Or use PM2 to revert
pm2 reload likorea-backend --update-env
```

### Database Rollback
```bash
# Restore from backup (manual process)
mongorestore --uri="$MONGO_URI" backup_folder/
```

## Monitoring

### Health Checks
- Backend: `GET /api/health`
- Frontend: Static file serving check

### Logs
```bash
# PM2 logs
pm2 logs likorea-backend --lines 100

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### Performance Monitoring
- PM2 Monitoring: `pm2 monit`
- System Resources: `htop` or `top`
- Network: `netstat -tulpn`

## Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Find process using port
lsof -i :5001
# Kill process
kill -9 <PID>
```

2. **PM2 Not Starting**
```bash
# Reset PM2
pm2 kill
pm2 start server.js --name likorea-backend
```

3. **Nginx 502 Bad Gateway**
- Check if backend is running: `pm2 status`
- Check backend logs: `pm2 logs`
- Verify proxy configuration

4. **Database Connection Failed**
- Check MongoDB URI in .env
- Verify network connectivity
- Check MongoDB Atlas IP whitelist

## Security Considerations

1. **Environment Files**
   - Never commit .env files
   - Use strong secrets and passwords
   - Rotate credentials regularly

2. **SSL/TLS**
   - Auto-renew certificates with Certbot
   - Use strong cipher suites
   - Enable HSTS

3. **Access Control**
   - Limit SSH access
   - Use firewall rules
   - Regular security updates

## Backup Strategy

### Automated Backups
```bash
# MongoDB backup script (cron job)
0 2 * * * mongodump --uri="$MONGO_URI" --out=/backup/$(date +%Y%m%d)
```

### Manual Backup
```bash
# Before major deployments
mongodump --uri="$MONGO_URI" --out=backup_$(date +%Y%m%d_%H%M%S)
```

## Maintenance Windows

### Recommended Schedule
- **Minor Updates**: Weekdays 2-4 AM KST
- **Major Updates**: Weekends 3-5 AM KST
- **Emergency Fixes**: As needed with notification

### Maintenance Mode
```bash
# Enable maintenance mode (Nginx)
touch /var/www/maintenance.enable

# Disable maintenance mode
rm /var/www/maintenance.enable
```