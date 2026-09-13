export const normalizeLanguage = (value) => {
  const language = typeof value === 'string' ? value.trim() : '';

  switch (language.toLowerCase()) {
    case 'urdu':
    case 'ur':
    case 'اردو':
      return 'Urdu';
    case 'english':
    case 'en':
      return 'English';
    case '':
    case 'all':
      return 'all';
    default:
      return language;
  }
};

export const isUrduLanguage = (value) => normalizeLanguage(value) === 'Urdu';
