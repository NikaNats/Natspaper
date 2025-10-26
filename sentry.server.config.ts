import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://eb445a37ed3e2db8f83d8fd9e8f32a47@o4510255602663424.ingest.de.sentry.io/4510257115168848",
  sendDefaultPii: true,
});
