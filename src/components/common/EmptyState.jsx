import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyState = ({
  icon: Icon = BookOpen,
  title = 'No records found',
  message = 'We could not find any matches for your query.',
  actionText,
  actionLink,
  onActionClick,
  secondaryActionText,
  secondaryActionLink
}) => {
  return (
    <div className="text-center py-14 px-6 bg-white border border-[#E8E1D9] rounded-sm max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#E8E1D9] flex items-center justify-center mx-auto mb-4 text-[#581C24]">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-sm text-stone-600 mb-6 leading-relaxed">{message}</p>
      {actionText && (actionLink || onActionClick) && (
        <div>
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#581C24] hover:bg-[#4A121A] rounded transition-all shadow-xs"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#581C24] hover:bg-[#4A121A] rounded transition-all shadow-xs"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
      {secondaryActionText && secondaryActionLink && (
        <Link to={secondaryActionLink} className="inline-block mt-4 text-sm font-semibold text-[#581C24] underline underline-offset-4 hover:text-[#856417]">
          {secondaryActionText}
        </Link>
      )}
    </div>
  );
};
