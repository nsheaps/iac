# Manual Setup Tasks — Cloudflare Core

## Prerequisites

These tasks assume the `cloudflare-apps` stack has already been deployed
(R2 bucket, 1Password items exist).

## 1. API Token Permissions

- [ ] Ensure the Cloudflare API token in 1Password (`Infrastructure/cloudflare-api-token`)
      has these permissions:
  - Zone: Read
  - DNS: Edit
  - Access: Apps and Policies: Edit
  - Zone Rulesets: Edit

## 2. Initialize Stack

```bash
bin/pulumi-wrapper.sh -C cloudflare-core stack init prod
```

## 3. Import Existing Zones

For each domain that already exists in Cloudflare, import the zone
before running `pulumi up` to avoid conflicts:

```bash
# Get zone ID from Cloudflare dashboard -> zone -> Overview -> right sidebar
bin/pulumi-wrapper.sh -C cloudflare-core import \
  cloudflare:index/zone:Zone nsheaps-dev <zone-id> --stack prod
```

## 4. Migrate DNS Records from cloudflare-apps

The `nsheaps.dev` DNS records currently live in the `cloudflare-apps` stack.
To avoid conflicts, either:

- **Option A**: Remove DNS records from `cloudflare-apps` and manage them
  here exclusively (recommended for long term).
- **Option B**: Keep DNS records in `cloudflare-apps` and remove them from
  `Pulumi.prod.yaml` in this project.

If migrating, import each record:

```bash
bin/pulumi-wrapper.sh -C cloudflare-core import \
  cloudflare:index/record:Record <resource-name> <zone-id>/<record-id> --stack prod
```

## 5. Configure Zero Trust

- [ ] Add allowed email addresses to `cloudflare-core:zeroTrustAllowedEmails` in `Pulumi.prod.yaml`
- [ ] Add Access applications to `cloudflare-core:accessApps` as needed

## 6. First Deploy

```bash
bin/pulumi-wrapper.sh -C cloudflare-core preview --stack prod
bin/pulumi-wrapper.sh -C cloudflare-core up --stack prod
```

## Adding a New Domain

1. Add to `cloudflare-core:domains` in `Pulumi.prod.yaml`:
   ```yaml
   - name: newdomain.com
     registrar: external # or 'cloudflare'
   ```
2. If the zone already exists in Cloudflare, import it (see step 3).
3. Add DNS records to `cloudflare-core:dnsRecords` under the domain key.
4. If external registrar, update nameservers to Cloudflare's after deploy.
5. Run `pulumi up`.
