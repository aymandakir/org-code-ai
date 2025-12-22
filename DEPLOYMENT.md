# Deployment Guide

## Vercel Deployment

The dashboard is deployed directly from the `apps/dashboard` directory.

### Deploy from Dashboard Directory

```bash
cd apps/dashboard
vercel --prod
```

### Why Deploy from Dashboard?

- Vercel auto-detects Next.js framework
- No need for complex vercel.json configuration
- Avoids monorepo workspace resolution issues
- Simpler and more reliable

### First Time Setup

1. Navigate to dashboard directory:
   ```bash
   cd apps/dashboard
   ```

2. Link to Vercel project:
   ```bash
   vercel link
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

### Environment Variables

Set these in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` - API server URL
- `OPENAI_API_KEY` - For AI features (optional)

### Build Command

Vercel automatically uses:
- Install: `npm install`
- Build: `npm run build`
- Output: `.next`

No custom configuration needed!
