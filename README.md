# Voom website

The public website of Voom (car rental in Morocco): pages built for Google, in French, Arabic (right to left) and English.
It reads the same Supabase project as the Voom app and only shows what the database lets the public see
(available cars of approved agencies; the agency's name is never shown).

## Pages

| Address | What it is |
| --- | --- |
| `/fr`, `/ar`, `/en` | Home: search by city, cities, latest cars, how it works, FAQ |
| `/{lang}/cars` | All cars, filtered by dates, city (`?city=`), type and price |
| `/{lang}/cars/{id}` | One car, with price, specs, booking and structured data for Google |
| `/{lang}/agencies` | Page for agencies that want to join |
| `/{lang}/terms` | Terms of use |
| `/{lang}/login`, `/signup`, `/forgot` | Sign in, create an account (renter or agency), password reset |
| `/{lang}/dashboard` | The signed-in space: agency fleet and bookings, renter bookings, admin reviews |
| `/sitemap.xml`, `/robots.txt` | For search engines; every page lists its translations |

An address without a language (`/`) is redirected to the visitor's language (`proxy.ts`).

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev                  # http://localhost:3000
npm run build && npm start   # production check
```

## Where things are

- `dictionaries/` all the text, one file per language (`fr.ts` is the reference, the others must match its shape)
- `lib/cities.ts` the cities, with their names in each language
- `lib/cars.ts` reads cars from Supabase, refreshed every 30 seconds
- `lib/site.ts` support email and phone, store links (leave empty until the app is published)
- `components/` header, footer, car card, FAQ, etc.

## Publishing (Vercel)

1. Push this folder to a GitHub repository.
2. On vercel.com: New Project, import the repository.
3. Add the variables from `.env.example` under Settings, Environment Variables (the two Turnstile ones come from the next section).
4. Deploy. Then Settings, Domains: add `voomrental.com` and follow the DNS instructions at your domain provider.
5. On search.google.com/search-console add the site, then submit `https://voomrental.com/sitemap.xml`.

## Bot check (Cloudflare Turnstile)

Agency sign-up and password reset ask for a Turnstile check before an email is sent.

1. dash.cloudflare.com, Turnstile, Add widget. Hostnames: `voomrental.com` (add `localhost` to test). Mode: Managed.
2. Put the site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the secret key in `TURNSTILE_SECRET_KEY`.
3. Redeploy. With both empty, the check is off and the forms work without it.

This protects the website forms only. Someone calling Supabase directly with the public key is not stopped by it (the app has the same exposure). Supabase's own CAPTCHA setting would block that too, but it would also require the app to send a token, so it stays off for now.

After new cars or cities appear in the database the pages refresh by themselves within about an hour.

## Not built yet

- Customers booking from the website: bookings are still made in the app.
- Store links: fill `APP_STORE_URL` and `PLAY_STORE_URL` in `lib/site.ts` when the app is published.
