import React from 'react';

// Stateless functional component for displaying uploaded document content
// Receives two refs: one for rendering PDF pages (canvas), and another for DOCX content
export const DocumentViewer = ({ canvasContainerRef, docxContainerRef }) => {
  return (
    // Container div styled to occupy one-third of the width and enable vertical scrolling
    <div style={{ width: '33%', border: '1px solid #ccc', overflowY: 'auto' }}>
      
      {/* Placeholder for rendered PDF pages using canvas elements */}
      <div ref={canvasContainerRef} style={{ width: '100%' }} />
      
      {/* Placeholder for rendered DOCX content, injected as HTML by docx-preview */}
      <div ref={docxContainerRef} style={{ width: '100%' }} />
    </div>
  );
};
