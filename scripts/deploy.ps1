# Deploy Supabase + preparación Cloudflare
# Requisitos: haber hecho `npx supabase login` antes

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== 1/4 Vincular proyecto Supabase ===" -ForegroundColor Cyan
npx supabase link --project-ref zxaonaviukjfyaftorifs

Write-Host "=== 2/4 Aplicar migraciones SQL ===" -ForegroundColor Cyan
npx supabase db push

Write-Host "=== 3/4 Desplegar Edge Function sorteo-api ===" -ForegroundColor Cyan
npx supabase functions deploy sorteo-api

Write-Host "=== 4/4 Secrets recomendados (ejecutar manualmente si aun no estan) ===" -ForegroundColor Yellow
Write-Host @"
npx supabase secrets set ADMIN_USER=admin ADMIN_PASS=TU_CLAVE_SEGURA JWT_SECRET=$(New-Guid) FRONTEND_URL=https://TU-PROYECTO.pages.dev
"@

Write-Host "`nListo. Falta subir a GitHub y conectar Cloudflare Pages." -ForegroundColor Green
