/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterIcon } from "@/assets/icons";
import InfoPopup from "@/components/common/InfoPopup";
import React, { useEffect, useRef, useState } from "react";
import Select, {
  ActionMeta,
  MultiValue,
  OptionProps,
  SelectInstance,
} from "react-select";
import Popup from "reactjs-popup";

const Option = (props: OptionProps<any>) => {
  const { data, innerRef, innerProps } = props;

  const selectOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    const selected = [
      { value: "all", label: "All", isSelected: false },
      ...props.selectProps.options.slice(1).map((o: any) => ({
        ...o,
        isSelected: o.value === data.value,
      })),
    ];
    props.selectProps.onChange(
      selected.filter((s) => s.isSelected),
      {
        action: "select-option",
        option: data,
      },
    );
  };

  return (
    <div
      ref={innerRef}
      {...innerProps}
      className="flex items-center px-2 cursor-pointer group"
    >
      <InfoPopup
        trigger={() => (
          <div className="flex w-full items-center">
            <input
              type="checkbox"
              checked={data?.isSelected ?? false}
              readOnly
              className="mr-2 size-3"
              aria-label={data.label}
              id={`filter-option-${data.value}`}
            />
            <label
              htmlFor={`filter-option-${data.value}`}
              className="truncate max-w-[100%] group-hover:max-w-[80%] flex-1"
            >
              {data.label}
            </label>
            {data.value !== "all" && (
              <button
                onClick={selectOnly}
                className="hidden group-hover:block text-xs font-bold text-navy px-2"
              >
                Only
              </button>
            )}
          </div>
        )}
        position="top right"
        closeOnDocumentClick
        disabled={data.value.length < 30}
        arrow={false}
      >
        {data.value !== "all" ? <div>{data.label}</div> : <></>}
      </InfoPopup>
    </div>
  );
};

const MultiValueContainer = () => {
  return <div />;
};

interface FilterAutoCompleteProps {
  options: { label: string; value: any }[];
  setFilterValue: (value: any[]) => void;
}

const FilterAutoComplete: React.FC<FilterAutoCompleteProps> = ({
  options,
  setFilterValue,
}) => {
  const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false);
  const [selectedValue, setSelectedValue] = useState<
    { value: string; label: string; isSelected: boolean }[]
  >([]);

  function onSelect(newValue: MultiValue<any>, action: ActionMeta<any>) {
    if (!action?.option) return;
    if (action?.option?.value === "all") {
      if (action.action === "deselect-option") {
        // de-select all
        setOptionsData([
          {
            value: "all",
            label: "All",
            isSelected: false,
          },
          ...options.map((o) => ({
            ...o,
            isSelected: false,
          })),
        ]);
        setSelectedValue([]);
        setFilterValue([]);
      } else {
        // select all
        const selected = [
          { value: "all", label: "All", isSelected: true },
          ...options.map((o) => ({
            ...o,
            isSelected: true,
          })),
        ];
        setOptionsData(selected);
        setSelectedValue(selected);
        setFilterValue(options.map((d) => d.value));
      }
    } else {
      if (action.action === "deselect-option") {
        // de-select a value
        const selected = [
          {
            value: "all",
            label: "All",
            isSelected: false,
          },
          ...options.map((o) => ({
            ...o,
            isSelected:
              o.value === action.option.value
                ? false
                : newValue.find((n) => n.value === o.value)?.isSelected,
          })),
        ];

        setOptionsData(selected);
        setFilterValue(
          selected.filter((s) => s.isSelected).map((d) => d.value),
        );

        setSelectedValue(selected.filter((s) => s.isSelected));
      } else {
        const selected = [
          {
            value: "all",
            label: "All",
            isSelected: options.length === newValue.length,
          },
          ...options.map((o) => ({
            ...o,
            isSelected:
              o.value === action.option.value
                ? true
                : newValue.find((n) => n.value === o.value)?.isSelected,
          })),
        ];
        // select a value
        setFilterValue(
          selected.filter((s) => s.isSelected).map((d) => d.value),
        );
        setOptionsData(selected);
        setSelectedValue(selected.filter((s) => s.isSelected));
      }
    }
  }

  const [optionsData, setOptionsData] = useState<
    { value: string; label: string; isSelected: boolean }[]
  >([]);
  useEffect(() => {
    setOptionsData([
      { value: "all", label: "All", isSelected: true },
      ...options.map((o) => ({
        ...o,
        isSelected: true,
      })),
    ]);
    setSelectedValue([
      { value: "all", label: "All", isSelected: true },
      ...options.map((o) => ({
        ...o,
        isSelected: true,
      })),
    ]);
  }, [options.length]);

  const ref = useRef<SelectInstance>(null);

  const toggleMenuIsOpen = (isClose: boolean = false) => {
    if (isClose) {
      setMenuIsOpen(false);
      const selectEl = ref.current;
      if (!selectEl) return;
      selectEl.focus();
    } else {
      setMenuIsOpen((value) => !value);
      const selectEl = ref.current;
      if (!selectEl) return;
      if (menuIsOpen) selectEl.blur();
      else selectEl.focus();
    }
  };
  return (
    <Popup
      onClose={() => toggleMenuIsOpen(true)}
      onOpen={() => toggleMenuIsOpen()}
      trigger={
        <div className="flex gap-2 w-max items-center z-50 relative">
          <div className="relative">
            <FilterIcon className="size-4" />
            {selectedValue.length !== options.length + 1 && (
              <div className="absolute -top-0.5 -right-0.5 size-1.5 bg-green-500 rounded-full" />
            )}
          </div>
        </div>
      }
      position="bottom center"
    >
      <div style={{ width: "300px" }}>
        <Select
          ref={ref}
          menuIsOpen={menuIsOpen}
          closeMenuOnSelect={false}
          components={{ Option, MultiValueContainer }}
          isMulti
          hideSelectedOptions={false}
          options={optionsData}
          onChange={
            onSelect as (
              newValue: unknown,
              actionMeta: ActionMeta<unknown>,
            ) => void
          }
          className="react-select-container"
          classNamePrefix="react-select"
          value={selectedValue}
        />
      </div>
    </Popup>
  );
};

export default FilterAutoComplete;
