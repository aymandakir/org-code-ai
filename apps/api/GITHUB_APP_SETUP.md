# GitHub App Setup Guide

This guide will help you set up a GitHub App for production OAuth authentication with org-code-ai.

## Step 1: Create a GitHub App

1. Go to [GitHub Settings → Developer settings → GitHub Apps](https://github.com/settings/apps)
2. Click **"New GitHub App"**

## Step 2: Configure App Settings

Fill in the following details:

- **GitHub App name**: `org-code-ai-dev` (or your preferred name)
- **Homepage URL**: `http://localhost:3000` (or your production URL)
- **User authorization callback URL**: `http://localhost:3001/api/auth/github/callback`
- **Webhook URL**: (Leave empty for now, or set up webhook endpoint)
- **Webhook secret**: (Leave empty for now)

## Step 3: Set Permissions

Configure the following permissions:

### Repository Permissions:
- **Contents**: Read-only (to scan repository files)
- **Metadata**: Read-only (required)
- **Pull requests**: Read & Write (for auto-fixing with PRs)

### Organization Permissions:
- **Members**: Read-only (optional, for org member info)

## Step 4: Generate Credentials

1. Scroll down and click **"Generate a private key"**
   - This downloads a `.pem` file - **keep this secure!**
   - You'll need the contents of this file for `GITHUB_PRIVATE_KEY`

2. Copy the **App ID** (shown on the app page)
   - This goes in `GITHUB_APP_ID`

3. Click **"Generate a new client secret"**
   - Copy the client secret immediately (you won't see it again!)
   - This goes in `GITHUB_CLIENT_SECRET`

4. Copy the **Client ID** (shown on the app page)
   - This goes in `GITHUB_CLIENT_ID`

## Step 5: Update Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
GITHUB_APP_ID=your_app_id_here
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
SESSION_SECRET=generate-a-random-secret-here
```

**Important Notes:**
- For `GITHUB_PRIVATE_KEY`, paste the entire contents of the `.pem` file
- Replace newlines with `\n` or keep it as a multi-line string
- Generate a random `SESSION_SECRET` (e.g., use `openssl rand -base64 32`)

## Step 6: Install the App

1. Go to your GitHub App settings page
2. Click **"Install App"**
3. Choose which organizations/accounts to install it on
4. Click **"Install"**

## Step 7: Test OAuth Flow

1. Start the API server: `pnpm turbo dev`
2. Visit `http://localhost:3000/scan`
3. Click "Connect GitHub" (if implemented)
4. You should be redirected to GitHub for authorization
5. After authorizing, you'll be redirected back with access

## Troubleshooting

### "GitHub OAuth not configured"
- Check that all GitHub environment variables are set in `.env.local`
- Restart the API server after changing environment variables

### "OAuth authentication failed"
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
- Ensure callback URL matches exactly (including protocol and port)
- Check that the app is installed on the organization/account you're trying to access

### "Organization not found"
- Ensure the GitHub App is installed on the organization
- Verify the organization name is spelled correctly
- Check that the token has access to the organization

## Demo Mode

If GitHub OAuth is not configured, the app will automatically use **demo mode** with mock data. This allows you to test the UI without setting up OAuth.

To enable demo mode:
- Simply don't set the GitHub environment variables
- The app will show a banner indicating demo mode
- Mock data will be returned for the `stephdl` organization

## Production Deployment

For production:

1. Update callback URLs to your production domain
2. Use environment variables from your hosting platform (Vercel, Railway, etc.)
3. Set `SESSION_SECRET` to a strong random value
4. Enable HTTPS (set `secure: true` in session config)
5. Consider using GitHub App installation tokens for better security

