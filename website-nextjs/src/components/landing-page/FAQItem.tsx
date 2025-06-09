import { ArrowUpLeftIcon } from "@/assets/icons";
import { useState } from "react";

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question = "", answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <button
      className={`${
        isOpen ? "bg-[#E6EFE3] " : "bg-white "
      } w-full py-4 lg:py-[34px] px-8 font-lato rounded-3xl shadow`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex justify-between items-center">
        <h4
          className={`
          text-start
          ${isOpen ? "text-[#193D2C] font-bold" : "text-black font-medium"}
          `}
        >
          {question}
        </h4>
        <div
          className={`${
            isOpen ? "bg-[#0C321A] " : "bg-white "
          } rounded-full p-3.5 transition-transform duration-300 ${
            isOpen ? "rotate-90" : "rotate-180"
          }`}
        >
          <ArrowUpLeftIcon
            className={`${isOpen ? "text-white" : "text-[#0C321A]"}`}
          />
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out}`}
        style={{ maxHeight: isOpen ? "100vh" : "0" }}
      >
        <div className="text-lg max-w-[650px] mt-0 lg:mt-6 text-start border-[#6D7F70] border-l-4 pl-2">
          {answer}
        </div>
      </div>
    </button>
  );
};

export default FAQItem;
