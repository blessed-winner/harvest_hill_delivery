"use client";

import React from 'react';

interface DefaultProfileAvatarProps {
  className?: string;
  iconClassName?: string;
}

export function DefaultProfileAvatar({ className = "w-8 h-8", iconClassName = "w-5 h-5" }: DefaultProfileAvatarProps) {
  return (
    <div className={`rounded-full bg-[#dbdbdb] flex items-center justify-center overflow-hidden shrink-0 border border-black/10 shadow-inner ${className}`}>
      <svg className={`text-[#8e8e8e] mt-1 ${iconClassName}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}
