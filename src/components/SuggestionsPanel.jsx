import React from 'react';

export const SuggestionsPanel = ({ renderImprovedText }) => {
  return (
    <div
      style={{
        width: '33%',
        height: '100%',
        border: '1px solid #ccc',
        padding: '0.5rem',
        overflowY: 'scroll',
        backgroundColor: '#f9f9f9',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
      }}
    >
      {renderImprovedText()}
    </div>
  );
};
