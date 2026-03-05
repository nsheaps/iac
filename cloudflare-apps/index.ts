import * as pulumi from '@pulumi/pulumi';
import * as cloudflare from '@pulumi/cloudflare';

const config = new pulumi.Config();
const cfConfig = new pulumi.Config('cloudflare');

const accountId = cfConfig.require('accountId');
const workerName = config.require('workerName');
const allowedOrigins = config.require('allowedOrigins');
const r2BucketName = config.require('r2BucketName');
const domainName = config.require('domainName');

// ---------------------------------------------------------------------------
// R2 Bucket — Pulumi state backend
// ---------------------------------------------------------------------------
const stateBucket = new cloudflare.R2Bucket('pulumi-state', {
  accountId,
  name: r2BucketName,
});

// ---------------------------------------------------------------------------
// DNS Zone — adopt existing nsheaps.dev zone
// ---------------------------------------------------------------------------
// The zone already exists in Cloudflare. Import it with:
//   pulumi import cloudflare:index/zone:Zone nsheaps-dev <zone-id>
const zone = new cloudflare.Zone('nsheaps-dev', {
  accountId,
  zone: domainName,
});

// ---------------------------------------------------------------------------
// DNS Records — app subdomains pointing to GitHub Pages
// ---------------------------------------------------------------------------
const privatePagesDns = new cloudflare.Record('private-pages-cname', {
  zoneId: zone.id,
  name: 'private-pages',
  type: 'CNAME',
  content: 'nsheaps.github.io',
  proxied: true,
});

const ceptDns = new cloudflare.Record('cept-cname', {
  zoneId: zone.id,
  name: 'cept',
  type: 'CNAME',
  content: 'nsheaps.github.io',
  proxied: true,
});

// ---------------------------------------------------------------------------
// CORS Proxy Worker
// ---------------------------------------------------------------------------
// The worker source is built in nsheaps/cors-proxy and published to ghcr.io.
// For initial bootstrap, inline a minimal script. In production, CI pulls from
// the cors-proxy repo's dist/ artifact.
//
// The worker script content is passed via the CORS_PROXY_SCRIPT env var or
// read from the local build output.
const workerScriptContent = process.env['CORS_PROXY_SCRIPT'] ??
  'export default { async fetch() { return new Response("cors-proxy not deployed yet", { status: 503 }); } };';

const workerScript = new cloudflare.WorkersScript(workerName, {
  accountId,
  name: workerName,
  content: workerScriptContent,
  module: true,
  plainTextBindings: [
    {
      name: 'ALLOWED_ORIGINS',
      text: allowedOrigins,
    },
  ],
});

// Route the worker on a subdomain (optional: auth.nsheaps.dev)
const authDns = new cloudflare.Record('auth-cname', {
  zoneId: zone.id,
  name: 'auth',
  type: 'CNAME',
  content: `${workerName}.workers.dev`,
  proxied: true,
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
export const stateBucketName = stateBucket.name;
export const zoneId = zone.id;
export const privatePagesDomain = pulumi.interpolate`https://private-pages.${domainName}`;
export const ceptDomain = pulumi.interpolate`https://cept.${domainName}`;
export const authDomain = pulumi.interpolate`https://auth.${domainName}`;
export const workerScriptName = workerScript.name;

// Suppress unused variable warnings — these resources have side effects
void privatePagesDns;
void ceptDns;
void authDns;
