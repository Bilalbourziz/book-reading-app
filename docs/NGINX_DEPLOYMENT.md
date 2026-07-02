# Nginx Deployment Guide for lumen-book.click

## Problem
When refreshing on routes like `/auth`, `/book/xxxxx`, `/profile`, or `/admin`, you get a 404 error because Nginx is proxying all requests to the backend, which doesn't have these client-side routes.

## Solution
Configure Nginx to serve static files directly and use `try_files` to handle SPA routing by falling back to `index.html`.

## Updated nginx.conf

The configuration has been updated in `nginx.conf` with the following key changes:

1. **Direct static file serving**: Files are served from `/usr/share/nginx/html`
2. **SPA routing**: `try_files $uri $uri/ /index.html;` ensures all routes load the SPA
3. **Removed proxy_pass for main location**: Static files are served directly instead of proxying to backend

## Docker Deployment

### Option 1: Using Docker Compose (Recommended)

Update your `docker-compose.yml` to copy the built files:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl  # If using SSL
    depends_on:
      - book-reader-app
    restart: unless-stopped

  book-reader-app:
    # Your existing app configuration
    # This can be removed if you're only serving static files
    image: your-app-image
    # ... rest of your config

  grafana:
    image: grafana/grafana
    # ... your existing config

  prometheus:
    image: prom/prometheus
    # ... your existing config
```

### Option 2: Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Copy files to Nginx container or server**:
   ```bash
   # If using Docker
   docker cp dist/ nginx-container:/usr/share/nginx/html/
   
   # If using a VM/server directly
   scp -r dist/* user@server:/usr/share/nginx/html/
   ```

3. **Copy Nginx configuration**:
   ```bash
   # If using Docker
   docker cp nginx.conf nginx-container:/etc/nginx/nginx.conf
   
   # If using a VM/server directly
   scp nginx.conf user@server:/etc/nginx/nginx.conf
   ```

4. **Test and reload Nginx**:
   ```bash
   # If using Docker
   docker exec nginx-container nginx -t
   docker exec nginx-container nginx -s reload
   
   # If using a VM/server directly
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## SSL/HTTPS Configuration (Optional but Recommended)

To add HTTPS support, update the nginx.conf server block:

```nginx
server {
    listen 443 ssl http2;
    server_name lumen-book.click www.lumen-book.click;

    ssl_certificate /etc/nginx/ssl/lumen-book.click.crt;
    ssl_certificate_key /etc/nginx/ssl/lumen-book.click.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ... rest of your config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name lumen-book.click www.lumen-book.click;
    return 301 https://$server_name$request_uri;
}
```

## Verification Steps

After deployment, test these scenarios:

1. ✅ Visit `https://lumen-book.click` - should load homepage
2. ✅ Visit `https://lumen-book.click/auth` - should load auth page
3. ✅ Refresh on `/auth` - should NOT show 404
4. ✅ Visit `https://lumen-book.click/book/any-id` - should load book page
5. ✅ Refresh on `/book/any-id` - should NOT show 404
6. ✅ Visit `https://lumen-book.click/profile` - should load profile (if logged in)
7. ✅ Visit `https://lumen-book.click/admin` - should load admin (if admin)

## Troubleshooting

### Issue: Still getting 404
- Check Nginx error logs: `docker logs nginx-container` or `sudo tail -f /var/log/nginx/error.log`
- Verify files exist: `ls -la /usr/share/nginx/html/`
- Test Nginx config: `nginx -t`

### Issue: CSS/JS not loading
- Check that the `dist` folder contents were copied correctly
- Verify file permissions: `chmod -R 755 /usr/share/nginx/html/`

### Issue: API calls failing
- If you have a backend API, add a location block for it:
  ```nginx
  location /api/ {
      proxy_pass http://app_server;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  ```

## Key Configuration Explained

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

This line is the magic for SPA routing:
- `$uri` - Try to serve the exact file requested (e.g., `/favicon.ico`)
- `$uri/` - Try to serve as directory (e.g., `/assets/`)
- `/index.html` - If neither exists, serve the SPA entry point

This ensures that `/auth`, `/book/123`, etc. all load `index.html`, and the React router handles the rest.