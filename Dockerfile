# syntax=docker/dockerfile:1

# The output of `vite build` is static files: there is no server to run, so the
# runtime stage carries nginx and the build output and nothing else. Node, the
# toolchain and node_modules all stay behind in the build stage.

# ---------------------------------------------------------------- build ----
FROM node:24-alpine AS build

WORKDIR /app

# Dependencies first, as their own layer: package.json and the lockfile change
# far less often than src/, so an edit to a component reuses the install.
COPY package.json package-lock.json ./

# puppeteer is a devDependency used only by tools/*.mjs, and its postinstall
# downloads a full Chromium. Nothing in `npm run build` touches it, so skipping
# the download saves ~150MB and a minute of build time. It also avoids the
# question of whether that binary would even run on alpine's musl.
ENV PUPPETEER_SKIP_DOWNLOAD=1

# `npm ci` rather than `npm install`: it installs exactly the lockfile and fails
# if the two have drifted, which is what a reproducible image wants. NODE_ENV is
# deliberately left unset here, since the build needs the devDependencies.
RUN npm ci

COPY . .

# tsc -b && vite build. Typecheck failures fail the image, by design.
RUN npm run build

# ---------------------------------------------------------------- serve ----
FROM nginx:1.29-alpine AS serve

# Into a /portfolio subdirectory, not the web root. The app is proxied at
# /portfolio/ with the prefix left on, so the request path and the path on disk
# line up and `root` alone resolves them. Serving from the web root and mapping
# the prefix away with `alias` would work too, but alias plus try_files is a
# well known source of surprises and buys nothing here.
COPY --from=build /app/dist /usr/share/nginx/html/portfolio

COPY <<'NGINX' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;

    # This server sits behind another nginx, so a redirect must not name this
    # container's own host or port. Relative Location headers keep the client
    # pointed at the public origin.
    absolute_redirect off;
    port_in_redirect off;

    # The three chunk is ~1.1MB raw and ~300KB gzipped, so this is the single
    # biggest thing nginx can do for first load. gltf and the model's .bin are
    # listed explicitly because they are not in nginx's default type list.
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/wasm
        image/svg+xml
        model/gltf+json
        application/octet-stream;

    # Vite fingerprints everything under assets/, so the filename changes
    # whenever the contents do and these can be cached indefinitely.
    location /portfolio/assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # The model is not fingerprinted, so it gets a long but revalidated cache
    # rather than an immutable one.
    location /portfolio/models/ {
        expires 30d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    # index.html is the one file that must never be cached: it is what points at
    # the current fingerprinted bundles, and a stale copy pins the browser to a
    # deployment that no longer exists.
    location = /portfolio/index.html {
        add_header Cache-Control "no-cache";
    }

    # /portfolio with no trailing slash would otherwise 404, since the fallback
    # below only matches the prefix with one.
    location = /portfolio {
        return 301 /portfolio/;
    }

    # Single page: anything unrecognised under the prefix falls back to the app
    # rather than 404ing.
    location /portfolio/ {
        try_files $uri $uri/ /portfolio/index.html;
    }

    # Nothing else is served. If a request arrives without the prefix, the proxy
    # in front is misconfigured, and a 404 says so plainly rather than quietly
    # serving the app from a second path.
    location / {
        return 404;
    }
}
NGINX

EXPOSE 80

# nginx:alpine ships this healthcheck-friendly foreground command already, but
# stating it keeps the image's behaviour explicit if the base image changes.
CMD ["nginx", "-g", "daemon off;"]
