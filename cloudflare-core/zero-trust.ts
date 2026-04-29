import * as pulumi from '@pulumi/pulumi';
import * as cloudflare from '@pulumi/cloudflare';

/**
 * Creates account-level Zero Trust Access resources.
 *
 * Sets up an access group of allowed email addresses that can be
 * attached to any number of Access Applications.
 */
export function createZeroTrust(accountId: string, allowedEmails: string[]) {
  const allowedUsersGroup = new cloudflare.ZeroTrustAccessGroup(
    'allowed-users',
    {
      accountId,
      name: 'Allowed Users',
      includes: [
        {
          emails: allowedEmails,
        },
      ],
    },
  );

  return { allowedUsersGroup };
}

/**
 * Creates a Zero Trust Access application protecting a domain/subdomain.
 *
 * This creates:
 * - A self-hosted Access Application on the given domain
 * - An Allow policy linking the application to the access group
 */
export function createAccessApplication(
  accountId: string,
  name: string,
  domain: string,
  accessGroupId: pulumi.Output<string>,
) {
  const safeName = name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

  const app = new cloudflare.ZeroTrustAccessApplication(
    `access-app-${safeName}`,
    {
      accountId,
      name,
      domain,
      type: 'self_hosted',
      sessionDuration: '24h',
    },
  );

  const policy = new cloudflare.ZeroTrustAccessPolicy(
    `access-policy-${safeName}`,
    {
      accountId,
      applicationId: app.id,
      name: `Allow ${name}`,
      decision: 'allow',
      precedence: 1,
      includes: [
        {
          groups: [accessGroupId],
        },
      ],
    },
  );

  return { app, policy };
}
