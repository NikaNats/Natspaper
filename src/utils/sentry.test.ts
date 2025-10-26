/**
 * Sentry Error Monitoring Test Suite
 *
 * ამ ფაილის გამოყენება:
 * 1. პირველი, dsvn-ი დაკონფიგურირება უნდა იყოს
 * 2. npm run build && npm run preview
 * 3. ბრაუზერში გახე http://localhost:3000
 * 4. ამ ფაილის ფუნქციებს დაძახე ზე კონსოლი
 * 5. Sentry dashboard-ში ნახე შეცდომები
 */
/* eslint-disable no-console */

import * as Sentry from "@sentry/astro";

/**
 * ❌ თუ DSN არ დაკონფიგურირებული, უბრალოდ კეთდება
 */
const isSentryEnabled = !!import.meta.env.PUBLIC_SENTRY_DSN;

export const SentryTests = {
  /**
   * ტესტი 1: უბრალო უცნობი წყობა
   * Sentry დაფიქსირებს: "This is a test error"
   */
  throwSimpleError: () => {
    if (!isSentryEnabled) {
      console.warn("⚠️ Sentry არ დაკონფიგურირებული");
      return;
    }
    try {
      throw new Error("ეს ტეს შეცდომაა!");
    } catch (error) {
      Sentry.captureException(error);
    }
  },

  /**
   * ტესტი 2: TypeError
   */
  throwTypeError: () => {
    if (!isSentryEnabled) {
      console.warn("⚠️ Sentry არ დაკონფიგურირებული");
      return;
    }
    try {
      const obj: null = null;
      // @ts-expect-error ცნობიერი TypeError გენერირებული
      obj.property.method(); // TypeError
    } catch (error) {
      Sentry.captureException(error);
    }
  },

  /**
   * ტესტი 3: კასტომი შეტყობინება
   */
  sendCustomMessage: () => {
    if (!isSentryEnabled) {
      console.warn("⚠️ Sentry არ დაკონფიგურირებული");
      return;
    }
    Sentry.captureMessage("ტეს შეტყობინება Sentry-დან", "info");
  },

  /**
   * ტესტი 4: კასტომი კონტექსტით
   */
  throwErrorWithContext: () => {
    if (!isSentryEnabled) {
      console.warn("⚠️ Sentry არ დაკონფიგურირებული");
      return;
    }
    try {
      throw new Error("ეს შეცდომა აქვს კონტექსტი!");
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "TestComponent",
          severity: "high",
        },
        contexts: {
          request: {
            url: globalThis.window?.location.href,
            method: "GET",
          },
        },
      });
    }
  },

  /**
   * ტესტი 5: Promise rejection
   */
  throwPromiseRejection: async () => {
    if (!isSentryEnabled) {
      console.warn("⚠️ Sentry არ დაკონფიგურირებული");
      return;
    }
    try {
      await Promise.reject(new Error("Promise rejection ტეს!"));
    } catch (error) {
      Sentry.captureException(error);
    }
  },

  /**
   * ტესტი 6: სხვადსხვა severity დონე
   */
  testSeverityLevels: () => {
    if (!isSentryEnabled) {
      console.warn("⚠️ Sentry არ დაკონფიგურირებული");
      return;
    }
    Sentry.captureMessage("ეს info", "info");
    Sentry.captureMessage("ეს warning", "warning");
    Sentry.captureMessage("ეს error", "error");
    Sentry.captureMessage("ეს fatal", "fatal");
  },

  /**
   * ტესტი 7: სტ্যাটাস შემოწმება
   */
  checkStatus: () => {
    console.log("🔍 Sentry Status Check:");
    console.log(`DSN დაკონფიგურირებული: ${isSentryEnabled ? "✅" : "❌"}`);
    console.log(
      `PUBLIC_SENTRY_DSN: ${import.meta.env.PUBLIC_SENTRY_DSN || "undefined"}`
    );
    console.log(`MODE: ${import.meta.env.MODE}`);

    if (isSentryEnabled) {
      console.log("✅ Sentry მზად არის რეალ დროში მონიტორინგისთვის!");
    } else {
      console.warn("⚠️ Sentry არ დაკონფიგურირებული - DSN დაამატე .env-ში");
    }
  },

  /**
   * ქვესთ: გაშვე ყველა ტესტი ზედიზედ
   */
  runAllTests: async () => {
    console.log("🧪 Sentry Test Suite გაშვება...\n");

    if (!isSentryEnabled) {
      console.error("❌ ᲨᲔᲪᲓᲝᲛᲐ: DSN არ დაკონფიგურირებული!");
      console.log("დაამატე PUBLIC_SENTRY_DSN თქვენს .env.production ფაილში");
      return;
    }

    console.log("ტესტი 1: უბრალო შეცდომა...");
    SentryTests.throwSimpleError();
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("ტესტი 2: TypeError...");
    SentryTests.throwTypeError();
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("ტესტი 3: კასტომი შეტყობინება...");
    SentryTests.sendCustomMessage();
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("ტესტი 4: შეცდომა კონტექსტით...");
    SentryTests.throwErrorWithContext();
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("ტესტი 5: Promise rejection...");
    await SentryTests.throwPromiseRejection();
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("ტესტი 6: Severity დონეები...");
    SentryTests.testSeverityLevels();
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("\n✅ ყველა ტესტი სრულდებული! ✅");
    console.log("თქვენი Sentry dashboard-ში უნდა გაჩნდეს ყველა შეცდომა.");
  },
};

/**
 * გლობალური window ობიექტში დამატება (დეველოპმენტის ნერგის)
 * ზე კონსოლი შეგიძლია დაძახო:
 * window.SentryTests.checkStatus()
 * window.SentryTests.throwSimpleError()
 * window.SentryTests.runAllTests()
 */
if (import.meta.env.MODE === "development" && globalThis.window) {
  // @ts-expect-error კასტომი გლობალური
  globalThis.window.SentryTests = SentryTests;
  console.log("🧪 Sentry Tests გაირთვა! კონსოლში შეგიძლია დაძახო:");
  console.log("  window.SentryTests.checkStatus()");
  console.log("  window.SentryTests.throwSimpleError()");
  console.log("  window.SentryTests.runAllTests()");
}
