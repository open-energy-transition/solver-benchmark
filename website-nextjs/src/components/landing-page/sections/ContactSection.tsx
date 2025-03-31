import { useState, useCallback } from "react";
import ReCAPTCHA from "react-google-recaptcha";

const ContactSection = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);

  const handleRecaptchaChange = useCallback((token: string | null) => {
    setRecaptchaVerified(!!token);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!recaptchaVerified) {
        alert("Please verify that you're not a robot");
        return;
      }

      // Form submission logic here
      console.log("Form submitted", { email, message });
      // Reset form
      setEmail("");
      setMessage("");
      setRecaptchaVerified(false);
    },
    [email, message, recaptchaVerified],
  );

  return (
    <div className="text-white bg-navy pt-[105px] pb-[73px]">
      <div className="mx-auto container px-4 lg:px-6">
        <div className="text-white text-xl leading-1.1 uppercase font-bold font-league mb-4">
          CONTACT
        </div>
        <div className="grid md:flex">
          <div className="w-full md:w-1/2">
            <div className="text-6.5xl leading-1.2 font-bold font-league">
              GET IN TOUCH
            </div>
            <h5 className="text-lavender font-league text-2xl my-2 w-full font-light md:w-3/4">
              If you are a developer or are familiar with GitHub, please open an
              issue for all feedback and suggestions!
              <br /> Otherwise, you can write to us using this form.
            </h5>
          </div>
          <div className="w-full md:w-1/2 grid gap-4">
            <form onSubmit={handleSubmit}>
              <input
                className="rounded-lg px-8 py-5 text-navy w-full"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <textarea
                className="rounded-lg px-8 py-5 text-navy w-full mt-4"
                rows={4}
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <div className="mt-4">
                <ReCAPTCHA
                  sitekey={
                    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
                    "YOUR_RECAPTCHA_SITE_KEY"
                  }
                  onChange={handleRecaptchaChange}
                  theme="dark"
                />
              </div>
              <div className="flex justify-start md:justify-end mt-3">
                <button
                  type="submit"
                  className={`rounded-lg px-7 py-3 text-base text-white font-bold ${
                    recaptchaVerified ? "bg-teal" : "bg-gray-500"
                  }
                    shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-max md:w-52`}
                  disabled={!recaptchaVerified}
                >
                  SEND
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
