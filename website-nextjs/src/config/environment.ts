/**
 * Environment configuration with type safety
 */
export const env = {
  // Email.js configuration
  emailJs: {
    serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
    templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
    publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "",
  },

  // reCAPTCHA configuration
  recaptcha: {
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
  },
};
