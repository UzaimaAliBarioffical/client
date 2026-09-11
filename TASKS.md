# QissaGhar ka kaam

## Shuruati audit
- React 19 / Vite / Tailwind frontend, Express / Mongoose / MongoDB backend, npm lockfiles maujood hain.
- Catalog, auth, admin, reader, checkout aur library ka code pehle se hai; implementation ko tests se verify karna hai.
- Client README abhi template hai. Client mein Vercel config nahi mili; Vite ka `/api` aur `/uploads` proxy sirf local development mein chalta hai.
- Pehle se deleted `public/favicon.svg` aur `public/icons.svg` ko preserve karna hai.
- Windows PowerShell `npm.ps1` rok raha hai; checks `npm.cmd` se chalenge, execution policy change nahi hogi.

## Checklist (isi order mein)
- [ ] 1. Frontend production build aur backend startup verify/fix.
- [ ] 2. SPA deep links, API origin, backend config, CORS, CSRF aur database diagnose/fix; API rewrites preserve.
- [ ] 3. Register/login aur admin story/category/PDF upload complete aur verify.
- [ ] 4. Alag maximum 2-page preview; full PDF par server authorization aur private storage verify.
- [ ] 5. Easypaisa/JazzCash proof pending rahe; admin review, per-user/per-story unlock aur library verify.
- [ ] 6. Full-flow regression, mobile layout, loading performance aur setup documentation.

## Verification / blockers
- Abhi initial audit chal raha hai; existing README ke claims ko verified nahi samjha gaya.
- Deployed URL web tool se fetch nahi hua; live deployment ka result abhi unverified hai.
- Production DB, backend host aur payment account configuration ki availability check honi baqi hai. Secret values output nahi hongi.
- Local changes only: koi commit, push ya deployment nahi.

## Agla qadam
`npm.cmd run build` aur backend startup/config audit complete karke actual failures fix karein; har stage ke check results yahan update karein.
