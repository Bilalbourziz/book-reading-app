# Deployment Guide for lumen-book.click

## Stack
- **Hosting**: AWS (S3 + CloudFront or Amplify)
- **SSL**: Cloudflare
- **Domain**: Spaceship (lumen-book.click)
- **Build**: Vite

## Prerequisites
1. AWS account with S3 and CloudFront (or Amplify) access
2. Cloudflare account
3. Spaceship domain management access

---

## Option 1: AWS S3 + CloudFront (Recommended)

### Step 1: Build the Application
```bash
npm run build
```
This creates a `dist/` folder with static files.

### Step 2: Create S3 Bucket
1. Go to AWS S3 Console
2. Create a new bucket named: `lumen-book.click` (or `lumen-book-website`)
3. Uncheck "Block all public access"
4. Enable static website hosting
5. Set index document: `index.html`
6. Set error document: `index.html` (for SPA routing)

### Step 3: Upload Files
```bash
# Using AWS CLI
aws s3 sync dist/ s3://lumen-book.click --delete
```

Or manually upload all files from `dist/` to the S3 bucket.

### Step 4: Set Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::lumen-book.click/*"
    }
  ]
}
```

### Step 5: Create CloudFront Distribution
1. Go to CloudFront Console
2. Create distribution
3. Origin domain: Select your S3 bucket
4. Viewer protocol policy: Redirect HTTP to HTTPS
5. Allowed HTTP methods: GET, HEAD
6. Restrict viewer access: No
7. Enable "Compress objects automatically"
8. Set default root object: `index.html`

### Step 6: Configure Cloudflare
1. Add site to Cloudflare: `lumen-book.click`
2. Update nameservers in Spaceship to Cloudflare nameservers
3. In Cloudflare DNS:
   - Add A record: `@` → CloudFront distribution domain
   - Add CNAME record: `www` → `lumen-book.click`
4. SSL/TLS settings:
   - SSL/TLS encryption mode: Full (strict)
   - Always Use HTTPS: On
   - Automatic HTTPS Rewrites: On

---

## Option 2: AWS Amplify (Easiest)

### Step 1: Connect Repository
1. Go to AWS Amplify Console
2. Connect your GitHub repository
3. Select the branch to deploy

### Step 2: Configure Build Settings
Amplify will auto-detect Vite. Use this `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Step 3: Deploy
1. Save and deploy
2. Amplify will provide a domain like `lumen-book.click.amplifyapp.com`
3. In Cloudflare, add CNAME pointing to the Amplify domain

---

## Option 3: Vercel/Netlify (Alternative)

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## Environment Variables

Create `.env.production` for production:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Post-Deployment Checklist

- [ ] Test all pages load correctly
- [ ] Verify HTTPS is working (check for lock icon)
- [ ] Test user authentication
- [ ] Test book reading functionality
- [ ] Test mobile responsiveness
- [ ] Check Cloudflare caching settings
- [ ] Set up Cloudflare Page Rules for SPA routing
- [ ] Configure custom error pages if needed
- [ ] Submit sitemap to Google Search Console: https://lumen-book.click/sitemap.xml
- [ ] Verify robots.txt is accessible: https://lumen-book.click/robots.txt
- [ ] Test sitemap validation at https://www.xml-sitemaps.com/validate-xml-sitemap.html

---

## Cloudflare Page Rules (Important for SPA)

Create these rules in Cloudflare:

1. **Rule 1**: `lumen-book.click/*`
   - Settings: Forwarding URL (301) → `https://lumen-book.click/$1`
   - Purpose: Force HTTPS

2. **Rule 2**: `lumen-book.click/*`
   - Settings: Cache Level → Cache Everything
   - Browser Cache TTL: 4 hours
   - Edge Cache TTL: 1 day
   - Purpose: Performance optimization

---

## Continuous Deployment

### GitHub Actions (for S3 + CloudFront)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: aws s3 sync dist/ s3://lumen-book.click --delete
      - run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

---

## Troubleshooting

### Issue: Blank page after deployment
- Check browser console for errors
- Verify `index.html` is set as root object
- Check SPA routing configuration

### Issue: Assets not loading
- Verify all files uploaded to S3
- Check CloudFront invalidation
- Clear Cloudflare cache

### Issue: SSL certificate errors
- Wait 24-48 hours for DNS propagation
- Verify Cloudflare SSL mode is set to "Full (strict)"
- Check that CloudFront/S3 uses HTTPS

---

## Support

For issues with:
- AWS: Check AWS Console → CloudWatch → Logs
- Cloudflare: Check Cloudflare Dashboard → Analytics
- Domain: Check Spaceship DNS settings