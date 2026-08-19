# KA0MED Amateur Radio Hub

An Astro-powered website for radio reviews, technical articles, a beginner-friendly amateur radio encyclopedia, and Field Programmer.

## Publishing content

Sign in at [Pages CMS](https://app.pagescms.org), select this repository, and use the structured editors for Reviews & Technical Articles or the Amateur Radio Encyclopedia. Images upload into `public/uploads`, and each saved entry triggers a new GitHub Pages deployment.

## Local development

```sh
npm install
npm run dev
```

## Deployment

The included GitHub Actions workflow builds and publishes the site to GitHub Pages after every update to `main`.
