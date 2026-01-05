import { ArrowUpLeftIcon } from "@/assets/icons";
import { ReactNode, useState } from "react";

interface FAQItemProps {
  question: string;
  answer: string | ReactNode;
}

const FAQItem = ({ question = "", answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        className={`${
          isOpen ? "bg-[#E6EFE3] " : "bg-white "
        } w-full py-4 lg:py-[34px] px-8 font-lato rounded-3xl shadow`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question}`}
      >
        <div className="flex justify-between items-center">
          <div
            className={`
            text-start text-xl sm:text-[32px] font-lato font-bold sm:leading-1.3
            ${isOpen ? "text-[#193D2C] font-bold" : "text-black font-medium"}
            `}
          >
            {question}
          </div>
          <span
            className={`$
              isOpen ? "bg-[#0C321A] " : "bg-white "
            } rounded-full p-3.5 transition-transform duration-150 ${
              isOpen ? "rotate-90" : "rotate-180"
            }`}
          >
            <ArrowUpLeftIcon
              className={`${isOpen ? "text-white" : "text-[#0C321A]"}`}
            />
          </span>
        </div>
      </button>
      <div
        id={`faq-answer-${question}`}
        className={`overflow-hidden transition-all duration-150 ease-in-out`}
        style={{ maxHeight: isOpen ? "100vh" : "0" }}
      >
        <div className="text-lg max-w-[1152px] mt-0 lg:mt-6 text-start border-[#6D7F70] border-l-4 pl-2">
          {answer}
        </div>
      </div>
    </div>
  );
};

export default FAQItem;
