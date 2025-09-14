"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EnvironmentDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  includeAllOption?: boolean;
}

const environments = ["dev", "sit", "uat", "nft"];

export function EnvironmentDropdown({
  value,
  onChange,
  className,
  includeAllOption = true,
}: EnvironmentDropdownProps) {
  return (
    <div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`w-full sm:w-[180px] font-medium ${className}`}>
          <SelectValue placeholder="Select environment" />
        </SelectTrigger>
        <SelectContent>
          {includeAllOption && (
            <SelectItem value="all">All Environments</SelectItem>
          )}
          {environments.map((env) => (
            <SelectItem key={env} value={env}>
              {env.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
