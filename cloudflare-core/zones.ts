import * as pulumi from '@pulumi/pulumi';
import * as cloudflare from '@pulumi/cloudflare';

export interface DomainConfig {
  /** The domain name (e.g., "example.com") */
  name: string;
  /** Where the domain was purchased — informational only, zone management is identical */
  registrar: 'cloudflare' | 'external';
}

export interface DnsRecordConfig {
  name: string;
  type: string;
  content: string;
  proxied?: boolean;
  ttl?: number;
}

export interface ZoneOutput {
  zone: cloudflare.Zone;
  id: pulumi.Output<string>;
}

/**
 * Creates Cloudflare DNS zones for all configured domains.
 *
 * Both Cloudflare-registered and external domains are managed the same way.
 * For existing zones, import them first:
 *   bin/pulumi-wrapper.sh -C cloudflare-core import \
 *     cloudflare:index/zone:Zone <resource-name> <zone-id> --stack prod
 */
export function createZones(
  accountId: string,
  domains: DomainConfig[],
): Record<string, ZoneOutput> {
  const results: Record<string, ZoneOutput> = {};

  for (const domain of domains) {
    const resourceName = domain.name.replace(/\./g, '-');
    const zone = new cloudflare.Zone(resourceName, {
      accountId,
      zone: domain.name,
    });
    results[domain.name] = { zone, id: zone.id };
  }

  return results;
}

/**
 * Creates DNS records within a zone.
 */
export function createDnsRecords(
  zoneId: pulumi.Output<string>,
  domainName: string,
  records: DnsRecordConfig[],
): cloudflare.Record[] {
  return records.map((record) => {
    const safeName = `${domainName}/${record.name}-${record.type}`
      .replace(/\./g, '-')
      .replace(/\//g, '-');

    return new cloudflare.Record(safeName, {
      zoneId,
      name: record.name,
      type: record.type,
      content: record.content,
      proxied: record.proxied ?? true,
      ttl: record.proxied === false ? (record.ttl ?? 300) : undefined,
    });
  });
}
