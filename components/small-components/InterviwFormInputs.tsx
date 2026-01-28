"use client";
import React from "react";

interface InputProps {
  label: string;
  type: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  accept?: string;
  inputClassName?: string;
}

const InterviwFormInputs = ({
  label,
  type,
  placeholder,
  value,
  onChange,
  min,
  max,
  accept,
  inputClassName,
}: InputProps) => {
  return (
    <div className="flex flex-col w-[100%]">
      <label className="mb-2 text-sm text-gray-900 dark:text-white">{label}</label>
      <input
        className={`border py-2 rounded-lg px-4 border-gray-300 dark:border-zinc-700 bg-white dark:bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-[100%] ${inputClassName ? inputClassName : ""}`}
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        accept={accept}
      />
    </div>
  );
};

export default InterviwFormInputs;
