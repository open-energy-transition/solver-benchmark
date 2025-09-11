import { ArrowRightIcon, QuestionLineIcon } from "@/assets/icons";
import React, { useState, useRef, useEffect } from "react";
import filterActions from "@/redux/filters/actions";
import { useDispatch, useSelector } from "react-redux";
import { IFilterState } from "@/types/state";
import DebouncedInput from "../raw-result/DebouncedInput";
import {
  DEFAULT_SGM_CALCULATION_MODES,
  DEFAULT_X_FACTOR,
  SgmMode,
} from "@/constants/sgm";
import InfoPopup from "@/components/common/InfoPopup";

interface SgmCalculationMode {
  optionTitle: string;
  value: SgmMode;
  optionTooltip: string;
}

interface ResultsSgmModeDropdownProps {
  sgmCalculationModes?: SgmCalculationMode[];
}

const ResultsSgmModeDropdown = ({
  sgmCalculationModes = DEFAULT_SGM_CALCULATION_MODES,
}: ResultsSgmModeDropdownProps) => {
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      dispatch(filterActions.setSgmMode(SgmMode.COMPUTE_SGM_USING_TO_VALUES));
      dispatch(filterActions.setXFactor(DEFAULT_X_FACTOR));
    };
  }, []);

  if (!selectedMode) return <div>Sgm Mode Not found</div>;

  return (
    <div className="relative w-full h-[35px]">
      <div className=" absolute right-0 text-left flex gap-1" ref={dropdownRef}>
        <div className="text-navy tag-line-xxs my-auto">SGM Mode:</div>
        <span className="inline-flex gap-2">
          <InfoPopup
            trigger={() => (
              <span className="flex items-baseline my-auto cursor-pointer">
                <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />
              </span>
            )}
            position="right center"
            closeOnDocumentClick
            arrow={false}
          >
            <div>
              Note that data points where the solver does not successfully solve
              the benchmark instance (i.e. errors, times out, or runs out of
              memory) are given the time out value for runtime and maximum
              memory limit value for memory usage when calculating SGM. This may
              produce skewed results when one solver solves a lot more
              benchmarks than another one. In this case, you can also choose to
              penalize TO/OOM/ER instances by a factor, or to filter to the
              subset of instances that are solved by all solvers, by using the
              dropdown menu to the right.
            </div>
          </InfoPopup>
        </span>

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
          pr-2
          rounded-lg
          shadow-xs
          text-navy
          text-xs
          w-max
        "
          id="menu-button"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <div className="flex gap-1 items-center pl-1">
            <div className="tag-line-xxs">{selectedMode.optionTitle}</div>
            <span className="right-2 top-2.5">
              <InfoPopup
                trigger={() => (
                  <div>
                    <QuestionLineIcon className="h-3.5 w-3.5" />
                  </div>
                )}
                position="top right"
                closeOnDocumentClick
                arrow={false}
                arrowStyle={{ color: "#ffffff" }}
              >
                <div>{selectedMode.optionTooltip}</div>
              </InfoPopup>
            </span>
          </div>
          <ArrowRightIcon className="stroke-navy fill-none size-2 block rotate-90" />
        </button>
        {selectedMode.value === SgmMode.PENALIZING_TO_BY_FACTOR && (
          <DebouncedInput
            autoWidth
            type="number"
            value={xFactor}
            min={1}
            onChange={(newValue) =>
              onXFactorChange(Number(newValue) >= 1 ? newValue : 1)
            }
            className="text-start p-1 rounded-2xl tag-line-xs mb-0.5"
            wrapperClassName="bg-white rounded-2xl px-3 border border-[#CAD9EF80]"
          />
        )}
        {open && (
          <div
            className="absolute w-max right-0 top-6 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5"
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
                  className="flex relative w-full flex-wrap text-left px-4 py-2 pr-6 text-sm navy hover:bg-gray-100"
                  role="menuitem"
                >
                  {mode.optionTitle}
                  <span className="absolute right-1 top-2.5">
                    <InfoPopup
                      trigger={() => <QuestionLineIcon className="w-4 h-4" />}
                      position="top right"
                      closeOnDocumentClick
                      arrowStyle={{ color: "#ebeff2" }}
                    >
                      <div>{mode.optionTooltip}</div>
                    </InfoPopup>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsSgmModeDropdown;
