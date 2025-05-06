import React from 'react';

export const DocumentViewer = ({ canvasContainerRef, docxContainerRef }) => {
  return (
    <div style={{ width: '33%', border: '1px solid #ccc', overflowY: 'auto' }}>
      <div ref={canvasContainerRef} style={{ width: '100%' }} />
      <div ref={docxContainerRef} style={{ width: '100%' }} />
    </div>
  );
};
