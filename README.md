# IG Bot

Dashboard privata per creare, programmare e pubblicare contenuti Instagram, con copy generato da Claude.

- **Next.js** su Vercel
- **Supabase** (progetto `ig-bot`): database, storage `media`, login
- **Meta Graph API** con token dell'utente di sistema `Bot_claude1`
- **Claude** per il copy

## Pagine

- `/login` — accesso riservato alle email in `ALLOWED_EMAILS` (al primo accesso si crea la password)
- `/nuovo` — upload, brief, 3 proposte di copy, anteprima, programmazione
- `/coda` — stato dei contenuti, pubblica ora, sospendi, elimina

## Pubblicazione automatica

`GET /api/publish` con header `Authorization: Bearer $CRON_SECRET` pubblica i post programmati già scaduti.
Viene chiamata ogni 5 minuti da `pg_cron` su Supabase.

## Variabili d'ambiente

Vedi `.env.example`. Si inseriscono in Vercel → Settings → Environment Variables, mai nel codice.

## Regole Instagram

Foto solo JPEG; storie 1080×1920 e video max 8 MB; caption max 2200 caratteri; carosello 2–10 elementi; 100 pubblicazioni ogni 24 ore.
