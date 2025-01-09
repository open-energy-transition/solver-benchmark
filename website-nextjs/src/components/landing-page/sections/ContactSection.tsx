const ContactSection = () => {
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
              issue for all feedback and suggestions!<br/> Otherwise, you can write
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
              rows={4}
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
