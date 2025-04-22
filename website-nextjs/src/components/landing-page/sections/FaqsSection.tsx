import FAQItem from "../FAQItem";

const Contribute = () => {
  return (
    <div className="py-5 text-navy bg-[#F5F4F4]">
      <div
        className="
          mx-auto
          max-w-8xl
          px-4
          lg:px-[70px]
          lg:pr-[44px]
          pt-[67px]
          pb-16
        "
      >
        <div className="">
          <div
            className="
                text-lg/1.1
                uppercase
                font-medium
                tracking-normal
                font-league
                text-dark-grey
                mb-4
              "
          >
            Questions
          </div>
          <div
            className="
                text-[2.5rem]/1.4
                tracking-normal
                font-extrabold
                font-lato
                mb-2
              "
          >
            FAQ
          </div>
        </div>
        <div>
          <div className="mt-4 flex flex-col gap-4">
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
