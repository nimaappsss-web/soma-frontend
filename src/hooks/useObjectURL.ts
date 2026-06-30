import * as React from 'react';

export const useObjectURL = (selectedFile: File | undefined | null) => {
  const [preview, setPreview] = React.useState<string>();

  // create a preview as a side effect, whenever selected file is changed
  React.useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    // free memory when ever this component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);
  return preview;
};
