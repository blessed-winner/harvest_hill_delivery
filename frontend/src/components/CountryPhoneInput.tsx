"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CountryOption {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  placeholder: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'RW', dialCode: '+250', name: 'Rwanda', flag: '🇷🇼', placeholder: '788 123 456' },
  { code: 'KE', dialCode: '+254', name: 'Kenya', flag: '🇰🇪', placeholder: '712 345 678' },
  { code: 'UG', dialCode: '+256', name: 'Uganda', flag: '🇺🇬', placeholder: '772 123 456' },
  { code: 'TZ', dialCode: '+255', name: 'Tanzania', flag: '🇹🇿', placeholder: '712 345 678' },
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸', placeholder: '(555) 000-0000' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧', placeholder: '7911 123456' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦', placeholder: '(555) 000-0000' },
  { code: 'ZA', dialCode: '+27', name: 'South Africa', flag: '🇿🇦', placeholder: '82 123 4567' },
];

interface CountryPhoneInputProps {
  value: string;
  onChange: (fullPhoneNumber: string) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export default function CountryPhoneInput({
  value,
  onChange,
  className = "",
  label,
  disabled = false
}: CountryPhoneInputProps) {
  // Parse incoming value to find country dial code match
  const findMatchingCountry = (val: string): CountryOption => {
    if (!val) return COUNTRIES[0]; // Default Rwanda +250
    const matched = COUNTRIES.find(c => val.startsWith(c.dialCode));
    return matched || COUNTRIES[0];
  };

  const initialCountry = findMatchingCountry(value);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(initialCountry);

  // Extract local phone digits without dial code
  const extractLocalNumber = (fullVal: string, dialCode: string) => {
    if (!fullVal) return '';
    if (fullVal.startsWith(dialCode)) {
      return fullVal.slice(dialCode.length).trim();
    }
    return fullVal.replace(/^\+\d+\s*/, '').trim();
  };

  const [localNumber, setLocalNumber] = useState<string>(
    extractLocalNumber(value, initialCountry.dialCode)
  );

  useEffect(() => {
    const countryMatch = findMatchingCountry(value);
    setSelectedCountry(countryMatch);
    setLocalNumber(extractLocalNumber(value, countryMatch.dialCode));
  }, [value]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const country = COUNTRIES.find(c => c.code === code) || COUNTRIES[0];
    setSelectedCountry(country);
    const updatedFull = localNumber ? `${country.dialCode} ${localNumber}` : `${country.dialCode} `;
    onChange(updatedFull.trim());
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^\d\s-]/g, '');
    setLocalNumber(rawVal);
    const updatedFull = rawVal ? `${selectedCountry.dialCode} ${rawVal}` : '';
    onChange(updatedFull.trim());
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">
          {label}
        </label>
      )}
      <div className="flex rounded-xl border border-[#c1c9c0] bg-white overflow-hidden focus-within:border-[#144227] transition-all shadow-sm">
        {/* Country Selector Dropdown */}
        <div className="relative border-r border-[#e5e2db] bg-[#fcf9f2] flex items-center px-2.5 shrink-0 cursor-pointer">
          <span className="text-base mr-1.5">{selectedCountry.flag}</span>
          <span className="text-xs font-bold text-[#1c1c18] font-mono mr-1">{selectedCountry.dialCode}</span>
          <ChevronDown size={12} className="text-[#717971]" />
          <select
            value={selectedCountry.code}
            onChange={handleCountryChange}
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dialCode})
              </option>
            ))}
          </select>
        </div>

        {/* Local Number Input */}
        <input
          type="tel"
          disabled={disabled}
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={selectedCountry.placeholder}
          className="w-full px-3 py-2.5 text-xs sm:text-sm font-semibold text-[#1c1c18] bg-transparent outline-none placeholder-[#a0a5a0]"
        />
      </div>
    </div>
  );
}
