import FAQItem from "../FAQItem";

const Contribute = () => {
  return (
    <div className="text-navy bg-white pt-2.5">
      <div className="mx-auto container px-4 lg:px-6 pt-20 pb-9">
        <div>
          <div className="flex gap-3 flex-col lg:flex-row">
            <div className="w-full lg:w-8/12">
              <div className="text-3xl md:text-[3.5rem] leading-1.2 mb-3.5">
                <div className="font-bold">Frequently Asked Questions </div>
              </div>
              <p className="text-navy text-lg max-w-screen-lg">
                Everything You Need to Know, Clear Answers to Common Questions
              </p>
            </div>
            <div className="w-full lg:w-4/12">
              In this section you will find quick answers to common questions
              about our products, services, policies, and more. If you
              can&apos;t find the information you&apos;re looking for, feel free
              to contact our support team for further assistance.
            </div>
          </div>
          <div className="mt-20 flex flex-col gap-4">
            <FAQItem
              question="Question 01"
              answer="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere."
            />
            <FAQItem
              question="Question 02"
              answer="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere."
            />
            <FAQItem
              question="Question 03"
              answer="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contribute;
