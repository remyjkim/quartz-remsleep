# Deploy Quartz to Cloudflare Pages (remyjkim.com)

## Overview

Deploy this Quartz v4 site to `remyjkim.com`, replacing the existing Jekyll-based deployment. The domain is already managed by Cloudflare, and currently serves a Jekyll site via Cloudflare Pages from another repository.

## Current State

- **Domain**: `remyjkim.com` (registered and DNS managed by Cloudflare)
- **Existing Deployment**: Jekyll-based site via Cloudflare Pages (different repository)
- **This Repository**: Quartz v4 site on `remsleep-theme` branch
- **Quartz Version**: 4.5.2
- **Node.js Requirement**: >=22

## Known Issues & Considerations

### Cloudflare + Quartz SPA Conflict

There's a [known issue](https://blog.avas.space/cloudflare-quartz/) where Cloudflare's optimization features can interfere with Quartz's SPA navigation:
- Sidebar navigation may duplicate after navigating
- Caused by Cloudflare altering JavaScript execution timing
- Event listener cleanup mechanisms don't work correctly

**Mitigations**:
1. **Monitor after deployment** - Issue may not occur in all setups
2. **If issues occur**: Disable SPA mode in `quartz.config.ts` (`enableSPA: false`)
3. **Alternative**: Ensure all Cloudflare optimizations are disabled (Auto Minify, Rocket Loader, etc.)

### Git Shallow Clone

Cloudflare Pages performs shallow clones. Since this project uses git for file timestamps (`CreatedModifiedDate` plugin with `git` priority), we need `git fetch --unshallow` before building.

---

## Implementation Plan

### Phase 1: Prepare Quartz Configuration

#### Task 1.1: Update `quartz.config.ts` baseUrl

**File**: `quartz.config.ts`

**Current**:
```typescript
baseUrl: "quartz.jzhao.xyz",
```

**Change to**:
```typescript
baseUrl: "remyjkim.com",
```

**Why**: The baseUrl is used for:
- Generating absolute URLs in sitemap.xml
- RSS feed links
- OpenGraph/meta tags
- Canonical URLs

#### Task 1.2: Verify Build Works Locally

```bash
npx quartz build
```

Confirm:
- Build completes without errors
- `public/` directory is generated
- Sitemap and RSS links point to `remyjkim.com`

---

### Phase 2: Set Up GitHub Repository for Deployment

#### Task 2.1: Decide on Repository Strategy

**Option A: Use Existing Repository (Recommended)**
- Push `remsleep-theme` branch to GitHub
- Configure Cloudflare Pages to build from this branch
- Simpler, keeps all history

**Option B: Create New Repository**
- Create a fresh repository for production
- Requires migrating content
- Cleaner separation but more complexity

**Recommendation**: Use Option A - push current work to GitHub

#### Task 2.2: Push to GitHub

```bash
# Ensure you have a GitHub remote configured
git remote -v

# If no remote, add one:
# git remote add origin git@github.com:remyjkim/saam.kim.git

# Push the remsleep-theme branch
git push -u origin remsleep-theme
```

---

### Phase 3: Remove Existing Cloudflare Pages Deployment

#### Task 3.1: Access Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Find the existing Jekyll Pages project

#### Task 3.2: Remove Custom Domain from Existing Project

1. Click on the Jekyll Pages project
2. Go to **Custom domains** tab
3. Click the three-dot menu next to `remyjkim.com`
4. Select **Remove domain**

**Important**: This will make the domain temporarily unavailable. Plan for brief downtime.

#### Task 3.3: (Optional) Delete Old Project

If the Jekyll project is no longer needed:
1. Go to project **Settings**
2. Scroll to **Delete project**
3. Confirm deletion

---

### Phase 4: Create New Cloudflare Pages Project

#### Task 4.1: Create Pages Project

1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Click **Create** → **Pages** → **Connect to Git**
3. Select GitHub and authorize if needed
4. Select the repository (e.g., `remyjkim/saam.kim`)

#### Task 4.2: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Project name** | `remyjkim-quartz` (or similar) |
| **Production branch** | `remsleep-theme` (or `main` after merge) |
| **Framework preset** | `None` |
| **Build command** | `git fetch --unshallow && npx quartz build` |
| **Build output directory** | `public` |
| **Root directory** | `/` (leave default) |

#### Task 4.3: Set Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_VERSION` | `22` | Required for Quartz 4.5+ |

In the Cloudflare dashboard:
1. Go to project **Settings** → **Environment variables**
2. Add `NODE_VERSION` = `22` for both Production and Preview

#### Task 4.4: Trigger First Build

1. Click **Save and Deploy**
2. Wait for build to complete (~1-3 minutes)
3. Verify the preview URL works (e.g., `https://remyjkim-quartz.pages.dev`)

---

### Phase 5: Configure Custom Domain

#### Task 5.1: Add Custom Domain

1. Go to the new Pages project
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter `remyjkim.com`
5. Click **Continue**

#### Task 5.2: DNS Configuration

Since the domain is already on Cloudflare DNS:
- Cloudflare will automatically create/update the required CNAME record
- SSL certificate will be provisioned automatically
- Propagation is usually instant for Cloudflare-managed domains

#### Task 5.3: Add www Subdomain (Optional)

1. Click **Set up a custom domain** again
2. Enter `www.remyjkim.com`
3. Cloudflare will add the appropriate records

#### Task 5.4: Verify Domain Activation

1. Wait for "Active" status in Custom domains
2. Visit `https://remyjkim.com` to confirm
3. Verify SSL certificate is valid

---

### Phase 6: Disable Problematic Cloudflare Optimizations

#### Task 6.1: Access Speed Settings

1. In Cloudflare Dashboard, select the `remyjkim.com` zone
2. Go to **Speed** → **Optimization**

#### Task 6.2: Disable Auto Minify

1. Find **Auto Minify** section
2. Disable JavaScript minification (uncheck JS)
3. HTML and CSS can remain enabled

#### Task 6.3: Disable Rocket Loader

1. Find **Rocket Loader** section
2. Ensure it's **Off**

#### Task 6.4: Review Other Optimizations

Check that these are appropriately configured:
- **Early Hints**: OK to keep enabled
- **HTTP/2**: OK to keep enabled
- **HTTP/3 (QUIC)**: OK to keep enabled
- **Brotli**: OK to keep enabled

---

### Phase 7: Post-Deployment Verification

#### Task 7.1: Functional Testing

- [ ] Home page loads correctly
- [ ] Navigation between pages works (SPA mode)
- [ ] No duplicate sidebar/content issues
- [ ] Search functionality works
- [ ] Dark mode toggle works
- [ ] Mobile responsive layout works
- [ ] Tag filtering works
- [ ] Internal links work correctly
- [ ] External links open in new tab

#### Task 7.2: SEO/Meta Verification

- [ ] Check `https://remyjkim.com/sitemap.xml` loads
- [ ] Check RSS feed at `https://remyjkim.com/index.xml`
- [ ] Verify Open Graph meta tags (use Facebook debugger or similar)
- [ ] Verify canonical URLs point to `remyjkim.com`

#### Task 7.3: Performance Check

- [ ] Run Lighthouse audit
- [ ] Verify assets are cached properly
- [ ] Check Core Web Vitals

---

### Phase 8: Set Up Automatic Deployments

#### Task 8.1: Verify GitHub Integration

Cloudflare Pages automatically deploys on push to the production branch. Verify:
- Push a small change to `remsleep-theme`
- Confirm Cloudflare triggers a new build
- Verify the change appears on the live site

#### Task 8.2: (Optional) Set Up Preview Deployments

Every push to non-production branches creates a preview URL:
- Format: `<commit-hash>.<project-name>.pages.dev`
- Useful for reviewing changes before merging

---

## Troubleshooting

### Build Fails with Node Version Error

**Symptom**: Error about Node.js version or missing features

**Fix**: Ensure `NODE_VERSION=22` environment variable is set

### Sitemap/RSS Shows Wrong Domain

**Symptom**: Links point to `quartz.jzhao.xyz` instead of `remyjkim.com`

**Fix**: Verify `baseUrl` is set correctly in `quartz.config.ts`, rebuild

### SPA Navigation Issues (Duplicate Content)

**Symptom**: Sidebar duplicates, content appends on navigation

**Fix Options**:
1. Disable all Cloudflare JS optimizations
2. Set `enableSPA: false` in `quartz.config.ts`
3. Check for Rocket Loader being enabled

### 404 Errors on Navigation

**Symptom**: Direct links work, but navigation triggers 404

**Fix**: Ensure the build output includes the SPA router and 404 fallback

### SSL Certificate Issues

**Symptom**: Browser shows certificate warning

**Fix**: Wait up to 15 minutes for certificate provisioning. Check **SSL/TLS** settings in Cloudflare.

---

## Rollback Plan

If deployment fails or causes issues:

1. **Remove custom domain** from new Quartz Pages project
2. **Re-add custom domain** to original Jekyll Pages project
3. Original site will be restored immediately

---

## Future Considerations

### Branch Strategy

After deployment is confirmed working:
1. Consider merging `remsleep-theme` into `main` or `v4`
2. Update Cloudflare Pages production branch accordingly
3. Use `remsleep-theme` for development, `main` for production

### Content Workflow

For Obsidian-based content management:
1. Edit in Obsidian
2. Commit and push to GitHub
3. Cloudflare Pages auto-deploys

### Analytics

Current config uses Plausible. Ensure:
1. Plausible is configured for `remyjkim.com`
2. Or switch to Cloudflare Web Analytics (free, integrated)

---

## Quick Reference

| Item | Value |
|------|-------|
| Domain | `remyjkim.com` |
| Build Command | `git fetch --unshallow && npx quartz build` |
| Output Directory | `public` |
| Node Version | `22` |
| Framework Preset | None |
| Production Branch | `remsleep-theme` (initially) |
| Expected Build Time | 1-3 minutes |

---

## Sources

- [Quartz Hosting Documentation](https://quartz.jzhao.xyz/hosting)
- [Cloudflare Pages Custom Domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare + Quartz SPA Issue](https://blog.avas.space/cloudflare-quartz/)
- [Cloudflare Pages Community Guide](https://community.cloudflare.com/t/how-to-set-page-domain-step-by-step/604052)
- [Quartz + Cloudflare Tutorial](https://dev.to/ababber/how-to-create-a-blog-with-quartz-github-and-cloudflare-82j)
