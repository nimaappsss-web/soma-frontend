import React from 'react';

export const useModal = () => {
  const [showDialog, setShowDialog] = React.useState(false);
  const openModal = () => setShowDialog(true);
  const closeModal = () => setShowDialog(false);
  return {
    showDialog,
    openModal,
    closeModal,
  };
};
