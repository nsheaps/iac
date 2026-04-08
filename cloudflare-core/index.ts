import * as pulumi from '@pulumi/pulumi';
import {
  createZones,
  createDnsRecords,
  type DomainConfig,
  type DnsRecordConfig,
} from './zones.js';
import { createZeroTrust, createAccessApplication } from './zero-trust.js';
import { createRedirectRules, type RedirectRule } from './routing.js';

const config = new pulumi.Config();
const cfConfig = new pulumi.Config('cloudflare');

const accountId = cfConfig.require('accountId');

// ---------------------------------------------------------------------------
// Zones — DNS zones for all managed domains
// ---------------------------------------------------------------------------
// Supports both Cloudflare-registered domains and external domains
// with Cloudflare DNS. Import existing zones before first `pulumi up`:
//   bin/pulumi-wrapper.sh -C cloudflare-core import \
//     cloudflare:index/zone:Zone <name> <zone-id> --stack prod
const domainConfigs = config.requireObject<DomainConfig[]>('domains');
const zones = createZones(accountId, domainConfigs);

// ---------------------------------------------------------------------------
// DNS Records — per-zone records from stack config
// ---------------------------------------------------------------------------
const dnsRecords =
  config.getObject<Record<string, DnsRecordConfig[]>>('dnsRecords') ?? {};

for (const [domainName, records] of Object.entries(dnsRecords)) {
  const zone = zones[domainName];
  if (zone) {
    createDnsRecords(zone.id, domainName, records);
  }
}

// ---------------------------------------------------------------------------
// Zero Trust — account-level access control
// ---------------------------------------------------------------------------
const allowedEmails =
  config.getObject<string[]>('zeroTrustAllowedEmails') ?? [];
const zeroTrust = createZeroTrust(accountId, allowedEmails);

// Zero Trust protected applications
const accessApps =
  config.getObject<Array<{ name: string; domain: string }>>('accessApps') ?? [];

for (const app of accessApps) {
  createAccessApplication(
    accountId,
    app.name,
    app.domain,
    zeroTrust.allowedUsersGroup.id,
  );
}

// ---------------------------------------------------------------------------
// Routing Rules — per-zone redirect rulesets
// ---------------------------------------------------------------------------
const routingRules =
  config.getObject<Record<string, RedirectRule[]>>('routingRules') ?? {};

for (const [domainName, rules] of Object.entries(routingRules)) {
  const zone = zones[domainName];
  if (zone) {
    createRedirectRules(zone.id, domainName, rules);
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
export const zoneIds = Object.fromEntries(
  Object.entries(zones).map(([name, z]) => [name, z.id]),
);
export const accessGroupId = zeroTrust.allowedUsersGroup.id;
