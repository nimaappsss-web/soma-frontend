import { Input } from "../../../components/ui/input";
import { formatMoneyInput, parseMoneyInput } from "../utils/currency";

interface MoneyInputProps {
  value: number | null | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const MoneyInput = ({ value, onChange, placeholder = "₦0", className, autoFocus }: MoneyInputProps) => (
  <Input
    type="text"
    inputMode="numeric"
    placeholder={placeholder}
    value={value && value > 0 ? formatMoneyInput(value) : ""}
    onChange={(e) => onChange(parseMoneyInput(e.target.value))}
    className={className}
    autoFocus={autoFocus}
  />
);