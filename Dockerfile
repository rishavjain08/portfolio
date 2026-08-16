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

# The server config lives in its own file rather than in a heredoc here.
# Heredocs require BuildKit, and Docker's legacy builder fails on them with
# "COPY failed: no source files were specified". A plain COPY builds on any
# builder, which matters when the image is built on a server rather than on a
# workstation with buildx installed.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# nginx:alpine ships this healthcheck-friendly foreground command already, but
# stating it keeps the image's behaviour explicit if the base image changes.
CMD ["nginx", "-g", "daemon off;"]
