import { ArrowUpTriangleFillIcon } from "@/assets/icons";
import React, { useRef } from "react";
import { useEffect } from "react";

export default function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  autoWidth = false,
  wrapperClassName = "",
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
  autoWidth?: boolean;
  wrapperClassName?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);
  const [width, setWidth] = React.useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    if (autoWidth && spanRef.current) {
      const newWidth = spanRef.current.offsetWidth;
      setWidth(Math.max(20, newWidth + 12)); // minimum 20px + some padding
    }
  }, [value, autoWidth]);

  return (
    <div className={`flex items-center justify-between ${wrapperClassName}`}>
      <div className={`relative ${!autoWidth && "w-full"}`}>
        <input
          {...props}
          style={autoWidth ? { width: `${width}px` } : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {autoWidth && (
          <span
            ref={spanRef}
            className="absolute invisible whitespace-pre"
            style={{ font: "inherit" }}
          >
            {value}
          </span>
        )}
      </div>
      {props.type === "number" && (
        <div className="flex flex-col cursor-pointer">
          <ArrowUpTriangleFillIcon
            className="rotate-180 size-2 hover:text-blue-500"
            onClick={() => {
              if (props.type === "number") {
                const newValue = Number(value) + (Number(props.step) || 1);
                if (!props.max || newValue <= Number(props.max)) {
                  setValue(newValue);
                }
              }
            }}
          />
          <ArrowUpTriangleFillIcon
            className="size-2 hover:text-blue-500"
            onClick={() => {
              if (props.type === "number") {
                const newValue = Number(value) - (Number(props.step) || 1);
                if (!props.min || newValue >= Number(props.min)) {
                  setValue(newValue);
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
