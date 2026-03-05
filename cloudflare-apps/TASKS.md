# Manual Setup Tasks — Cloudflare Apps

## 1Password Secrets

- [ ] Create `cloudflare-api-token` item in `Infrastructure` vault with:
  - `credential` field: Cloudflare API token with permissions: Workers Scripts Edit, R2 Edit, DNS Edit, Zone Read
  - `account-id` field: Cloudflare account ID (Dashboard → any zone → Overview → right sidebar)
- [ ] Ensure `pulumi-backend` item exists in `Infrastructure` vault with `passphrase` field
- [ ] Ensure `OP_SERVICE_TOKEN` is set as a GitHub Actions secret on the `nsheaps/iac` repo

## Cloudflare Zone Import

- [ ] Get the existing nsheaps.dev zone ID from Cloudflare dashboard
- [ ] Run: `pulumi import cloudflare:index/zone:Zone nsheaps-dev <zone-id>` to adopt the existing zone
  - Use `bin/pulumi-wrapper.sh -C cloudflare-apps import cloudflare:index/zone:Zone nsheaps-dev <zone-id> --stack prod`

## Pulumi Stack Init

- [ ] Initialize the prod stack: `bin/pulumi-wrapper.sh -C cloudflare-apps stack init prod`
- [ ] First deploy (uses file:// local backend): `bin/pulumi-wrapper.sh -C cloudflare-apps up --stack prod`
- [ ] After R2 bucket is created, note the bucket name from outputs

## R2 Backend Migration (after first deploy)

- [ ] Create R2 API credentials in Cloudflare dashboard (R2 → Manage R2 API Tokens)
- [ ] Store R2 credentials in 1Password `Infrastructure` vault as `pulumi-r2-backend`:
  - `access-key-id` field
  - `secret-access-key` field
- [ ] Set `PULUMI_R2_ENDPOINT` to `https://<account-id>.r2.cloudflarestorage.com`
- [ ] Migrate state: `pulumi login s3://nsheaps-pulumi-state?endpoint=<endpoint>&disableSSL=false&s3ForcePathStyle=true`
- [ ] Uncomment R2 credentials in existing `.env.op` files and workflow yamls

## GitHub Pages Custom Domains

- [ ] In `nsheaps/private-pages` repo Settings → Pages → Custom domain, add `private-pages.nsheaps.dev`
- [ ] In `nsheaps/cept` repo Settings → Pages → Custom domain, add `cept.nsheaps.dev`
- [ ] Verify DNS propagation for both domains

## CORS Proxy Worker

- [ ] After first deploy, verify the worker is live at `auth.nsheaps.dev`
- [ ] Update GitHub OAuth App redirect URLs to include `https://private-pages.nsheaps.dev` and `https://cept.nsheaps.dev`
- [ ] To deploy updated worker code from `nsheaps/cors-proxy`:
  1. Build the worker: `cd cors-proxy && npm run build`
  2. Set `CORS_PROXY_SCRIPT` env var to the built script content
  3. Run `pulumi up` in this stack
