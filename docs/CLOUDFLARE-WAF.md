# Cloudflare WAF recomendado

O projeto já envia headers de segurança via `middleware.ts`. Para ativar a camada Cloudflare WAF no domínio em produção:

1. Adicione o domínio na Cloudflare.
2. Aponte o DNS para a Vercel.
3. Ative proxy laranja no registo do domínio.
4. Em **Security > WAF**, crie regras:

## Bloquear admin fora de países permitidos

Expression:

```txt
(http.request.uri.path contains "/admin" and not ip.geoip.country in {"PT" "BR"})
```

Action: Managed Challenge ou Block.

## Proteger API administrativa

Expression:

```txt
(http.request.uri.path contains "/api/admin" and cf.threat_score gt 10)
```

Action: Managed Challenge.

## Rate limiting adicional

- Path: `/api/admin/login`
- Threshold: 5 requests por minuto por IP
- Action: Block por 10 minutos

## Regras geridas

Ative:

- Cloudflare Managed Ruleset
- OWASP Core Ruleset
- Bot Fight Mode ou Super Bot Fight Mode, se disponível

Essa camada complementa MFA, RBAC, CSRF, cookies HttpOnly, rate limiting e logs já implementados no código.
