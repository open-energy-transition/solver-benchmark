import { useEffect, useRef, useState } from "react";

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  formatOption: (option: string) => string;
  label?: string;
  className?: string;
  bgColor?: string;
  optionActiveBg?: string;
}

const CustomDropdown = ({
  value,
  onChange,
  options,
  formatOption,
  label = "Select an option",
  className = "",
  bgColor = "bg-white",
  optionActiveBg = "bg-[#F0F4F2]",
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`w-full lg:text-lg pl-3 font-bold ${bgColor} px-4 sm:px-6 py-3 sm:py-4
        text-navy text-base rounded-b-lg block text-left focus-visible:outline-none`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {value ? formatOption(value) : label}
        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            width="12"
            height="6"
            viewBox="0 0 12 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L6 5L11 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul
          className={`absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-auto border`}
          role="listbox"
        >
          {options.map((option, idx) => (
            <li
              key={idx}
              className={`cursor-pointer select-none py-2 px-4 ${
                value === option
                  ? `${optionActiveBg} text-navy font-bold`
                  : `text-navy hover:${optionActiveBg} hover:bg-opacity-80`
              }`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={value === option}
            >
              {formatOption(option)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
