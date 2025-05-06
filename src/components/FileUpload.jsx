import React from 'react';

export const FileUpload = ({ onFileChange }) => {
  return (
    <input type="file" accept=".txt,.docx,.pdf" onChange={onFileChange} />
  );
};
