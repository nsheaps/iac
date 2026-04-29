import * as pulumi from '@pulumi/pulumi';
import * as cloudflare from '@pulumi/cloudflare';

export interface RedirectRule {
  description: string;
  /** Full URL pattern to match (e.g., "https://www.example.com/*") */
  sourceUrl: string;
  /** Target URL to redirect to */
  targetUrl: string;
  /** HTTP status code (default: 301) */
  statusCode?: number;
  preserveQueryString?: boolean;
}

/**
 * Creates a redirect ruleset for a zone using the modern Rulesets API.
 * This replaces legacy Page Rules.
 */
export function createRedirectRules(
  zoneId: pulumi.Output<string>,
  domainName: string,
  rules: RedirectRule[],
): cloudflare.Ruleset | undefined {
  if (rules.length === 0) return undefined;

  const safeName = domainName.replace(/\./g, '-');

  return new cloudflare.Ruleset(`redirects-${safeName}`, {
    zoneId,
    name: `Redirects for ${domainName}`,
    kind: 'zone',
    phase: 'http_request_dynamic_redirect',
    rules: rules.map((rule) => ({
      action: 'redirect',
      expression: `(http.request.full_uri eq "${rule.sourceUrl}")`,
      description: rule.description,
      actionParameters: {
        fromValue: {
          statusCode: rule.statusCode ?? 301,
          targetUrl: {
            value: rule.targetUrl,
          },
          preserveQueryString: rule.preserveQueryString ?? false,
        },
      },
    })),
  });
}
