import { defineMiddleware } from "astro:middleware";
import * as Sentry from "@sentry/astro";

// Sentry middleware for error tracking
export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const response = await next();
    return response;
  } catch (error) {
    // Capture errors with Sentry
    Sentry.captureException(error, {
      contexts: {
        request: {
          url: context.request.url,
          method: context.request.method,
          headers: Object.fromEntries(context.request.headers),
        },
      },
    });

    // Re-throw the error
    throw error;
  }
});
