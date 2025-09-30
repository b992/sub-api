# 🔑 How to Get Your Substack Credentials

## Step 1: Get Your Authentication Cookie

1. **Open your Substack publication** in your browser
2. **Login** if you're not already logged in
3. **Open Developer Tools** (F12 or right-click → Inspect)
4. **Go to Application tab** (Chrome) or Storage tab (Firefox)
5. **Click on Cookies** in the left sidebar
6. **Find your Substack domain** (e.g., `yourpub.substack.com`)
7. **Look for the `connect.sid` cookie**
8. **Copy the entire value** (it's very long, starts with `s%3A`)

### Visual Guide:
```
Application Tab → Cookies → yourpub.substack.com → connect.sid
│
└─ Value: s%3Avery-long-encrypted-string-here...
           ↑ Copy this entire value
```

## Step 2: Get Your Publication Hostname

Your hostname is your publication URL without `https://`:
- Full URL: `https://myawesome.substack.com`
- Hostname: `myawesome.substack.com`

## Step 3: Update the Test File

Edit `LIVE_TEST.ts`:

```typescript
const CONFIG = {
  apiKey: 's%3Avery-long-encrypted-string-here...', // ← Your connect.sid value
  hostname: 'myawesome.substack.com'                 // ← Your publication domain
}
```

## Step 4: Run the Test

```bash
npx ts-node LIVE_TEST.ts
```

## ⚠️ Important Notes

- **The cookie expires** - you may need to refresh it periodically
- **Keep it secure** - don't commit it to version control
- **Test posts are drafts** - they won't be published automatically
- **Delete test posts** after verification

## 🔒 Security Tips

- Use environment variables for production:
  ```typescript
  const CONFIG = {
    apiKey: process.env.SUBSTACK_API_KEY,
    hostname: process.env.SUBSTACK_HOSTNAME
  }
  ```

- Or use a config file (add to .gitignore):
  ```typescript
  import config from './config.json'
  ```

Ready to punch it? 🚀
