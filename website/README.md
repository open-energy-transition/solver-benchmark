# Open Energy Benchmark Website

The [Next.js](https://nextjs.org) website that presents the benchmark results, at https://openenergybenchmark.org/.

For how to build and run the website locally to view results from your own benchmark runs, see the root [README's Running the Website section](../README.md#running-the-website).

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values to enable the optional integrations it configures:

- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `NEXT_PUBLIC_EMAILJS_*`: the contact form's reCAPTCHA and [EmailJS](https://www.emailjs.com/) integration. Not needed to run the rest of the site.
- `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD`: HTTP basic auth, used to password-protect preview deployments.

## Available scripts

- `npm run dev` -- start the development server (auto-reloads on changes).
- `npm run build` -- copy the latest `results/` files into `public/results/`, then build for production.
- `npm start` -- serve the production build (run `npm run build` first).
- `npm run lint` -- run ESLint.
- `npm run axe` / `npm run axe:full` -- accessibility checks (WCAG 2 A/AA) via [axe](https://github.com/dequelabs/axe-core), used by CI's accessibility-check job.

## Deployment

The website deploys to [Vercel](https://vercel.com) on merge to `main`, with preview deployments for pull requests.
