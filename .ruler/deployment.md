# Deployment

## Quick Commands
- `./deploy.sh` - Full deployment script
- `pm2 status` - Check application status
- `pm2 logs lesswhelmed-me` - View logs

## Process
1. Build categorization package
2. Install production dependencies  
3. Run database migrations
4. Compile application to `./bin/`
5. Restart with PM2

---

**For complete deployment process, PM2 configuration, and troubleshooting, see [docs/deployment.md](docs/deployment.md)**

*Read when: Deploying to production, configuring PM2, or troubleshooting deployment issues*