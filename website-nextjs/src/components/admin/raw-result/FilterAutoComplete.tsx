/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterIcon } from "@/assets/icons"
import React from "react"
import Select, {
  components,
  IndicatorsContainerProps,
  MultiValue,
  OptionProps,
} from "react-select"
import Popup from "reactjs-popup"

const IndicatorsContainer = (props: IndicatorsContainerProps<any, true>) => {
  return (
    <div>
      <components.IndicatorsContainer {...props} />
    </div>
  )
}

const Option = (props: OptionProps<any>) => {
  const { data, isSelected, innerRef, innerProps } = props
  return (
    <div
      ref={innerRef} // Pass the ref for react-select to handle accessibility
      {...innerProps} // Spread react-select props to make selection work
      className="flex items-center px-4 cursor-pointer"
    >
      <input
        type="checkbox"
        checked={isSelected} // Reflect selection state
        readOnly
        className="mr-2"
      />
      <label>{data.label}</label>
    </div>
  )
}

interface FilterAutoCompleteProps {
  options: { label: string; value: any }[]
  setFilterValue: (value: any[]) => void
  columnFilterValue: any[]
}

const FilterAutoComplete: React.FC<FilterAutoCompleteProps> = ({
  options,
  setFilterValue,
  columnFilterValue,
}) => {
  function onSelect(newValue: MultiValue<any>) {
    setFilterValue(newValue.map((d) => d.value))
  }

  return (
    <Popup
      trigger={
        <div className="flex gap-2">
          <input className="rounded-lg bg-gray-100" disabled />
          <FilterIcon className="size-5" />
        </div>
      }
      position="right center"
    >
      <div style={{ width: "300px" }}>
        <Select
          closeMenuOnSelect={false}
          components={{ IndicatorsContainer, Option }}
          isMulti
          hideSelectedOptions={false}
          options={options}
          onChange={(e) => onSelect(e)}
        />
      </div>
    </Popup>
  )
}

export default FilterAutoComplete
