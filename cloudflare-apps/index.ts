import * as pulumi from '@pulumi/pulumi';
import * as cloudflare from '@pulumi/cloudflare';

const config = new pulumi.Config();
const cfConfig = new pulumi.Config('cloudflare');

const accountId = cfConfig.require('accountId');
const workerName = config.require('workerName');
const allowedOrigins = config.require('allowedOrigins');
const r2BucketName = config.require('r2BucketName');
const domainName = config.require('domainName');
const aiGatewayName = config.get('aiGatewayName') ?? 'claude-code';
const aiGatewayRateLimit = config.getNumber('aiGatewayRateLimit') ?? 200;
const aiGatewayCacheTtl = config.getNumber('aiGatewayCacheTtl') ?? 0;

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
// AI Gateway — proxy AI provider requests for logging, caching, cost tracking
// ---------------------------------------------------------------------------
// Once deployed, set ANTHROPIC_BASE_URL to route Claude Code through the gateway:
//   export ANTHROPIC_BASE_URL="https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic"
//
// Supported provider paths:
//   /anthropic   — Anthropic (Claude)
//   /openai      — OpenAI (GPT)
//   /openrouter  — OpenRouter (multi-model)
//   /workers-ai  — Cloudflare Workers AI
//
// For z.ai/Zhipu AI, use the universal endpoint (POST to gateway root with
// provider config in the body). See the cloudflare plugin's ai-gateway skill.
//
// Dashboard: https://dash.cloudflare.com/?to=/:account/ai/ai-gateway
// Docs: https://developers.cloudflare.com/ai-gateway/
const aiGateway = new cloudflare.AiGateway('ai-gateway', {
  accountId,
  name: aiGatewayName,

  // Caching — disabled by default for Claude Code (responses are non-deterministic).
  // Set cloudflare-apps:aiGatewayCacheTtl to a positive value (seconds) to enable.
  cacheInvalidateOnUpdate: true,
  cacheTtl: aiGatewayCacheTtl,

  // Rate limiting — protects against runaway spend.
  // Adjust via cloudflare-apps:aiGatewayRateLimit config.
  rateLimitingInterval: 60,
  rateLimitingLimit: aiGatewayRateLimit,
  rateLimitingTechnique: 'fixed',
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
export const aiGatewayId = aiGateway.name;
export const aiGatewayAnthropicUrl = pulumi.interpolate`https://gateway.ai.cloudflare.com/v1/${accountId}/${aiGateway.name}/anthropic`;
export const aiGatewayOpenrouterUrl = pulumi.interpolate`https://gateway.ai.cloudflare.com/v1/${accountId}/${aiGateway.name}/openrouter`;

// Suppress unused variable warnings — these resources have side effects
void privatePagesDns;
void ceptDns;
void authDns;
