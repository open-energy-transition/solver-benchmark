import { useState, useCallback, useEffect } from "react";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import emailjs from "@emailjs/browser";
import { env } from "@/config/environment";
import { SendIcon } from "@/assets/icons";

const ContactForm = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { executeRecaptcha } = useGoogleReCaptcha();

  const isFormValid = email.trim() !== "" && message.trim() !== "";

  useEffect(() => {
    // Hide success message after 5 seconds
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage("");

      if (!isFormValid) {
        return;
      }

      if (!executeRecaptcha) {
        setErrorMessage("reCAPTCHA not available. Please try again later.");
        return;
      }

      setIsSubmitting(true);

      try {
        const token = await executeRecaptcha("contactFormSubmit");

        // Send email using EmailJS
        const templateParams = {
          email: email,
          message: message,
          "g-recaptcha-response": token,
        };

        const response = await emailjs.send(
          env.emailJs.serviceId,
          env.emailJs.templateId,
          templateParams,
          env.emailJs.publicKey,
        );

        if (response.status === 200) {
          // Reset form after successful submission
          setEmail("");
          setMessage("");
          setShowSuccess(true);
        } else {
          throw new Error("Failed to send email");
        }
      } catch (error) {
        console.error("Contact form submission failed", error);
        setErrorMessage("Failed to send your message. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, message, executeRecaptcha, isFormValid],
  );

  return (
    <form onSubmit={handleSubmit}>
      {showSuccess && (
        <div className="mb-4 p-3 bg-teal text-white rounded-lg">
          Thank you! Your message has been sent successfully.
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500 text-white rounded-lg">
          {errorMessage}
        </div>
      )}
      <div className="relative font-league font-medium text-lg text-dark-grey">
        <span className="absolute top-1/2 -translate-y-1/2 left-8">Email:</span>
        <input
          className="rounded-lg px-8 pl-20 py-5  w-full"
          // placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <textarea
        className="rounded-lg px-8 py-5 text-navy w-full mt-4"
        rows={4}
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      <div className="flex justify-start mt-6">
        <button
          type="submit"
          className={`rounded-2xl px-12 py-4 text-base text-white font-bold bg-[#1E7A8C]
            ${isSubmitting || !isFormValid ? "bg-opacity-50" : "bg-opacity-100"}
            shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-max md:w-52
            transition-colors duration-200 flex items-center justify-center gap-2`}
          disabled={isSubmitting || !isFormValid}
        >
          {isSubmitting ? "SENDING..." : "SEND"}
          <SendIcon />
        </button>
      </div>
    </form>
  );
};

const ContactSection = () => {
  return (
    <div className="text-white bg-navy pt-[105px] pb-[73px]">
      <div className="mx-auto container px-4 lg:px-6">
        <div className="grid md:flex">
          <div className="w-full md:w-1/2">
            <div
              className="
                text-lg/1.1
                uppercase
                font-medium
                tracking-normal
                font-league
                mb-4
              "
            >
              contact
            </div>
            <div
              className="
                text-[2.5rem]/1.4
                tracking-normal
                font-extrabold
                font-lato
              "
            >
              GET IN TOUCH
            </div>
            <h5 className="text-lavender font-lato text-base/1.5 w-full font-light md:w-3/4">
              If you are a developer or are familiar with GitHub, please open an
              issue for all feedback and suggestions!
              <br /> Otherwise, you can write to us using this form.
            </h5>
          </div>
          <div className="w-full md:w-1/2 grid gap-4 pt-12">
            <GoogleReCaptchaProvider
              reCaptchaKey={env.recaptcha.siteKey}
              scriptProps={{
                async: true,
                defer: true,
                appendTo: "head",
              }}
            >
              <ContactForm />
            </GoogleReCaptchaProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
