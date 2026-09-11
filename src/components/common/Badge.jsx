import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variants = {
    default: 'bg-stone-100 text-stone-700 border-stone-200',
    primary: 'bg-[#581C24]/10 text-[#581C24] border-[#581C24]/20',
    gold: 'bg-[#C5A059]/15 text-[#856417] border-[#C5A059]/30 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-300 font-medium',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-300 font-medium',
    Cancelled: 'bg-stone-100 text-stone-600 border-stone-300 font-medium',
    draft: 'bg-stone-100 text-stone-600 border-stone-200',
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-sans tracking-wide uppercase ${
        variants[variant] || variants.default
      } ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
