FROM node:lts-alpine

COPY . /app
WORKDIR /app

RUN corepack enable && \
    pnpm install && \
    pnpm run build && \
    pnpm prune --prod

EXPOSE 3000

CMD ["pnpm", "start"]