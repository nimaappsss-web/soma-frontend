import { useState } from "react";

export const ArrayInput = ({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
}) => {
  const [input, setInput] = useState("");

  const add = () => {
    if (!input.trim()) return;
    onChange([...value, input.trim()]);
    setInput("");
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
          >
            {item}
            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(i)}
              className="text-blue-400 hover:text-blue-600 disabled:opacity-50"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          disabled={disabled}
          placeholder="Add item..."
          className="flex-1 h-10 rounded-md border border-gray-200 px-3 text-sm disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
};
