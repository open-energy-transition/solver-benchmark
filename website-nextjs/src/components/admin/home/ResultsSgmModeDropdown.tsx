import {
  ArrowUpTriangleFillIcon,
  FilterBarIcon,
  QuestionLine,
} from "@/assets/icons";
import { SgmMode } from "@/constants/filter";
import React, { useState, useRef, useEffect } from "react";
import filterActions from "@/redux/filters/actions";
import { useDispatch, useSelector } from "react-redux";
import Popup from "reactjs-popup";
import { IFilterState } from "@/types/state";
import DebouncedInput from "../raw-result/DebouncedInput";

const sgmCalculationModes = [
  {
    optionTitle: "Compute SGM using TO values",
    value: SgmMode.COMPUTE_SGM_USING_TO_VALUES,
    optionTooltip:
      "Uses the time-out value or the maximum value of memory for benchmark instances that time-out or error.",
  },
  {
    optionTitle: "Penalizing TO by a factor of",
    value: SgmMode.PENALIZING_TO_BY_FACTOR,
    optionTooltip:
      "Uses the TO/max value of memory multiplied by a factor of X for TO/ER benchmark instances.",
  },
  {
    optionTitle: "Only on intersection of solved benchmarks",
    value: SgmMode.ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS,
    optionTooltip:
      "Filters the benchmark instances to those that are solved by all solvers before computing SGM, so that there are no error or time-out instances to consider.",
  },
];

const ResultsSgmModeDropdown = () => {
  const dispatch = useDispatch();
  const sgmMode = useSelector((state: { filters: IFilterState }) => {
    return state.filters.sgmMode;
  });
  const xFactor = useSelector((state: { filters: IFilterState }) => {
    return state.filters.xFactor;
  });

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedMode, setSelectedMode] = useState(
    sgmCalculationModes.find((mode) => mode.value === sgmMode),
  );

  const handleChangeMode = (mode: SgmMode) => {
    setOpen(false);
    dispatch(filterActions.setSgmMode(mode));
  };

  useEffect(() => {
    setSelectedMode(sgmCalculationModes.find((mode) => mode.value === sgmMode));
  }, [sgmMode]);

  const onXFactorChange = (newValue: string | number) => {
    dispatch(filterActions.setXFactor(Number(newValue)));
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selectedMode) return <div>Sgm Mode Not found</div>;

  return (
    <div className="lg:absolute right-0 text-left flex gap-1" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        type="button"
        className="
          bg-white
          border
          border-[#CAD9EF80]
          border-opacity-50
          font-normal
          font-inter
          gap-x-2
          inline-flex
          items-center
          justify-center
          p-1
          pr-3
          rounded-2xl
          shadow-xs
          text-navy
          text-xs
          w-max
        "
        id="menu-button"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="flex gap-1 items-center 4xl:text-lg">
          <span className="rounded-full p-1 bg-[#F7F7F7]">
            {" "}
            <FilterBarIcon className="size-4 fill-navy stroke-navy" />
          </span>

          {selectedMode.optionTitle}
          <span className="right-2 top-2.5">
            <Popup
              on={["hover"]}
              trigger={() => <QuestionLine className="size-4 4xl:size-5" />}
              position="top right"
              closeOnDocumentClick
              arrowStyle={{ color: "#ebeff2" }}
            >
              <div className="bg-stroke p-2 rounded">
                {selectedMode.optionTooltip}
              </div>
            </Popup>
          </span>
        </div>
        <ArrowUpTriangleFillIcon />
      </button>
      {selectedMode.optionTitle === "Penalizing TO by a factor of" && (
        <DebouncedInput
          autoWidth
          type="number"
          value={xFactor}
          onChange={(newValue) => onXFactorChange(newValue)}
          className="text-start p-1 rounded-2xl text-base/1.5 font-semibold font-lato"
          wrapperClassName="bg-white rounded-2xl px-3 border border-[#CAD9EF80]"
        />
      )}
      {open && (
        <div
          className="absolute w-full right-0 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {sgmCalculationModes.map((mode) => (
              <button
                key={mode.optionTitle}
                onClick={() => {
                  handleChangeMode(mode.value);
                }}
                className="flex relative w-full flex-wrap text-left px-4 py-2 pr-4 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                {mode.optionTitle}
                <span className="absolute right-2 top-2.5">
                  <Popup
                    on={["hover"]}
                    trigger={() => <QuestionLine className="w-4 h-4" />}
                    position="top right"
                    closeOnDocumentClick
                    arrowStyle={{ color: "#ebeff2" }}
                  >
                    <div className="bg-stroke p-2 rounded">
                      {mode.optionTooltip}
                    </div>
                  </Popup>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsSgmModeDropdown;
