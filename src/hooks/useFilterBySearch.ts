import React from 'react';

export const useFilterBySearch = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchClear = () => {
    setSearchTerm('');
  };

  return {
    searchTerm,
    handleSearchChange,
    handleSearchClear,
  };
};
