import React from 'react';

export const StoryCardSkeleton = () => {
  return (
    <div className="bg-white border border-[#E8E1D9] rounded-sm overflow-hidden flex flex-col animate-pulse">
      <div className="aspect-[3/4] bg-[#E8E1D9]"></div>
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 bg-[#E8E1D9] rounded w-1/3"></div>
            <div className="h-3 bg-[#E8E1D9] rounded w-1/4"></div>
          </div>
          <div className="h-5 bg-[#E8E1D9] rounded w-4/5"></div>
          <div className="h-3 bg-[#E8E1D9] rounded w-full"></div>
          <div className="h-3 bg-[#E8E1D9] rounded w-2/3"></div>
        </div>
        <div className="pt-3 border-t border-[#F3EFEA] space-y-2">
          <div className="flex justify-between">
            <div className="h-3 bg-[#E8E1D9] rounded w-1/4"></div>
            <div className="h-4 bg-[#E8E1D9] rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="h-8 bg-[#E8E1D9] rounded"></div>
            <div className="h-8 bg-[#E8E1D9] rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TableRowSkeleton = ({ cols = 5 }) => {
  return (
    <tr className="animate-pulse border-b border-[#F3EFEA]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-4 bg-[#E8E1D9] rounded w-full"></div>
        </td>
      ))}
    </tr>
  );
};
