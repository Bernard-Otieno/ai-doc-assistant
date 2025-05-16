import React from 'react';

// Receives two refs:  PDF pages (canvas) and DOCX content
export const DocumentViewer = ({ canvasContainerRef, docxContainerRef }) => {
  return (
    // Container div styled to occupy one-third of the width and enable vertical scrolling
    <div style={{ width: '33%', border: '1px solid #ccc', overflowY: 'auto' }}>
      
      {/* for  PDF pages using canvas elements */}
      <div ref={canvasContainerRef} style={{ width: '100%' }} />
      
      {/* for  DOCX content, injected as HTML by docx-preview */}
      <div ref={docxContainerRef} style={{ width: '100%' }} />
    </div>
  );
};
