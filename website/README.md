# Open Energy Benchmark website

The [Next.js](https://nextjs.org) website that presents the benchmark results at [openenergybenchmark.org](https://openenergybenchmark.org/). It reads `results/benchmark_results.csv` and `results/metadata.yaml`.

## Running locally

The website needs Node.js 22, the version in `engines` of `package.json`. From this folder:

```bash
npm ci
npm run move-results   # copy results/ into public/results/
npm run dev            # http://localhost:3000
```

Run `npm run move-results` again after a benchmark run to see its results, e.g. on the [results page](http://localhost:3000/dashboard/aggregated-results).

## Scripts

- `npm run dev`: start the development server, which reloads on changes.
- `npm run move-results`: copy `results/benchmark_results.csv` and `results/metadata.yaml` into `public/results/`.
- `npm run build`: copy the results and build the website for production.
- `npm start`: serve the production build.
- `npm run lint`: run ESLint.
- `npm run axe:full`: check the accessibility (WCAG 2 A and AA) of every page with [axe](https://github.com/dequelabs/axe-core), on a running website. `npm run axe:extract` lists the pages in `scripts/urls.txt`, which `npm run axe:test` checks; `npm run axe` checks the home page only.
- `npm run check:pages`: open every page in `scripts/urls.txt` and its hover pop-ups in Chrome, and fail if a page doesn't load, the Content Security Policy blocks anything, or a formula doesn't render.

CI runs the lint, the build, and the accessibility and page checks on every pull request that changes the website.

## Environment variables

Copy `.env.example` to `.env.local` to set the optional integrations:

- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `NEXT_PUBLIC_EMAILJS_*`: the reCAPTCHA and [EmailJS](https://www.emailjs.com/) integration of the contact form. The rest of the website works without them.
- `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD`: HTTP basic authentication, which protects preview deployments.

## Deployment

The website deploys to [Vercel](https://vercel.com) on every merge to `main`, with a preview deployment for each pull request.
