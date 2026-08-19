# KA0MED Amateur Radio Hub

An Astro-powered website for radio reviews, technical articles, a beginner-friendly amateur radio encyclopedia, and Field Programmer.

## Publishing content

After GitHub Pages and the CMS authenticator are configured, open `/admin/` on the published site. Reviews and technical articles share an editor but appear in separate site sections. Encyclopedia entries have their own structured editor.

## Local development

```sh
npm install
npm run dev
```

## Deployment

The included GitHub Actions workflow builds and publishes the site to GitHub Pages after every update to `main`.
