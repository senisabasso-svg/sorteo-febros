# Secrets de Supabase (Edge Functions)

Configurar en: Dashboard → Edge Functions → Secrets
https://supabase.com/dashboard/project/zxonaviukjfyaftorifs/functions/secrets

| Name | Value |
|---|---|
| ADMIN_USER | senisabasso@gmail.com |
| ADMIN_PASS | password123 |
| JWT_SECRET | febros-sorteo-jwt-2026-secreto-largo |
| FRONTEND_URL | https://sorteo-febros.pages.dev |

Después de guardar secrets, redeploy obligatorio:

```powershell
cd "c:\Users\senis\OneDrive\Documentos\SORTEO_FEBROS"
npx supabase login
npx supabase link --project-ref zxonaviukjfyaftorifs
npx supabase functions deploy sorteo-api --project-ref zxonaviukjfyaftorifs
```

Login en https://sorteo-febros.pages.dev/admin.html
- Usuario: senisabasso@gmail.com
- Clave: password123
