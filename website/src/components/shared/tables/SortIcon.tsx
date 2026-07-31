import { SortVerticalIcon, SortVerticalAscIcon } from "@/assets/icons";

interface SortIconProps {
  sortDirection: false | "asc" | "desc";
  canSort: boolean;
}

const SortIcon = ({ sortDirection, canSort }: SortIconProps) => {
  if (!canSort) return null;

  if (!sortDirection) {
    return <SortVerticalIcon fill="none" className="stroke-dark-green" />;
  }

  if (sortDirection === "asc") {
    return <SortVerticalAscIcon fill="none" className="stroke-dark-green" />;
  }

  return (
    <SortVerticalAscIcon fill="none" className="stroke-dark-green rotate-180" />
  );
};

export default SortIcon;
