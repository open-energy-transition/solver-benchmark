const ContactSection = () => {
  return (
    <div className="text-white bg-navy px-2 md:px-20 py-10">
      <div className="mx-auto container px-6">
        <div className="white text-xl uppercase font-bold font-league">
          CONTACT
        </div>
        <div className="grid md:flex">
          <div className="w-full md:w-1/2">
            <div className="text-5xl md:text-6xl font-bold font-league my-5">
              GET IN TOUCH
            </div>
            <h5 className="text-lavender font-league text-2xl my-2 w-full md:w-3/4">
              If you are a developer or are familiar with GitHub, please open an
              issue for all feedback and suggestions! Otherwise, you can write
              to us using this form.
            </h5>
          </div>
          <div className="w-full md:w-1/2 grid gap-4">
            <input
              className="rounded-lg px-8 py-5 text-navy"
              placeholder="Email"
            />
            <textarea
              className="rounded-lg px-8 py-5 text-navy"
              rows={6}
              placeholder="Message"
            />
            <div className="flex justify-start md:justify-end mt-3">
              <button
                className="rounded-lg px-7 py-3 text-base text-white font-bold bg-teal
                  shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-max md:w-52"
              >
                SEND
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ContactSection
