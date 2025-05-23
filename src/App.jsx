import React, { useState, useRef } from 'react'; //React hooks
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'; // PDF.js for reading PDF content
import 'pdfjs-dist/build/pdf.worker'; // Include the PDF.js worker
import * as docx from 'docx-preview'; // rendering DOCX files in browser
import '../src/App.css'; 

// Set PDF.js worker source from CDN
GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.2.133/build/pdf.worker.mjs`;

function App() {
  // React state declarations
  const [originalText, setOriginalText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState('idle'); // Can be: idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  // rendering document content visually
  const canvasContainerRef = useRef(null); // PDF preview container
  const docxContainerRef = useRef(null);   // DOCX preview container

  const MAX_CHAR_WARNING = 19000; // for API to work

  // Call  LanguageTool API for suggestions
  const fetchSuggestionsFromAPI = async (text) => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const response = await fetch('https://api.languagetoolplus.com/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text, language: 'en-US' })
      });

      const data = await response.json();
      setStatus('success');

      // If there are no matches, return default message
      if (!data.matches.length) return ['Document appears to be fine. No suggestions.'];

      // Format response into suggestion segments
      const suggestionsArray = [];
      let lastIndex = 0;
      data.matches.forEach((match, index) => {
        suggestionsArray.push(text.slice(lastIndex, match.offset));
        suggestionsArray.push({
          id: index,
          original: text.slice(match.offset, match.offset + match.length),
          suggestion: match.replacements[0]?.value || '',
          accepted: null
        });
        lastIndex = match.offset + match.length;
      });
      suggestionsArray.push(text.slice(lastIndex));
      return suggestionsArray;

    } catch (error) {
      console.error('LanguageTool API error:', error);
      setStatus('error');
      setErrorMessage('Error checking suggestions. Please try again later.');
      return ['Error checking suggestions. Please try again later.'];
    }
  };

  // Handles .txt file upload
  const handleTextUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const text = reader.result;
      const cleanedText = text.replace(/\r\n/g, '\n'); // Normalize line endings
      setOriginalText(cleanedText);
      setSuggestions(await fetchSuggestionsFromAPI(cleanedText));

      // Display text in DOCX container as fallback preview
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = '';
        const paragraphEl = document.createElement('pre');
        paragraphEl.textContent = cleanedText;
        paragraphEl.style.whiteSpace = 'pre-wrap';
        paragraphEl.style.fontFamily = 'monospace';
        docxContainerRef.current.appendChild(paragraphEl);
      }
    };
    reader.readAsText(file);
  };

  // Handles .docx file upload using docx-preview
  const handleDocxUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result;
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = '';
        await docx.renderAsync(buffer, docxContainerRef.current); // Render DOCX visually
        const paragraphs = Array.from(docxContainerRef.current.querySelectorAll('p')).map(p => p.innerText.trim());
        const joinedText = paragraphs.join('\n');
        setOriginalText(joinedText);
        setSuggestions(await fetchSuggestionsFromAPI(joinedText));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handles .pdf file upload using PDF.js
  const handlePDFUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const typedArray = new Uint8Array(reader.result);
      const pdf = await getDocument({ data: typedArray }).promise;

      let textContent = '';
      if (canvasContainerRef.current) canvasContainerRef.current.innerHTML = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        // Render each PDF page onto a canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        canvasContainerRef.current.appendChild(canvas);

        // Extract text content from page
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str).join(' ');
        textContent += strings + '\n';
      }

      setOriginalText(textContent);
      setSuggestions(await fetchSuggestionsFromAPI(textContent));
    };
    reader.readAsArrayBuffer(file);
  };

  // Handles file selection and type detection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('loading');
    setOriginalText('');
    setSuggestions([]);
    if (canvasContainerRef.current) canvasContainerRef.current.innerHTML = '';
    if (docxContainerRef.current) docxContainerRef.current.innerHTML = '';

    const process = async () => {
      if (file.type === 'application/pdf') {
        await handlePDFUpload(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        await handleDocxUpload(file);
      } else {
        await handleTextUpload(file);
      }
      setStatus('done');
    };

    process();
  };

  // Marks a suggestion as accepted
  const handleAccept = (id) => {
    setSuggestions(prev => prev.map(item =>
      typeof item === 'string' ? item : (item.id === id ? { ...item, accepted: true } : item)
    ));
  };

  // Marks a suggestion as rejected
  const handleReject = (id) => {
    setSuggestions(prev => prev.map(item =>
      typeof item === 'string' ? item : (item.id === id ? { ...item, accepted: false } : item)
    ));
  };

  // Renders improved text with colored highlights and actions
  const renderImprovedText = () => {
    return suggestions.map((item, index) => {
      if (typeof item === 'string') return <div key={index}>{item}</div>;

      const baseStyle = {
        padding: '2px 4px',
        margin: '0 2px',
        borderRadius: '4px',
        display: 'inline-block'
      };

      if (item.accepted === true) {
        return (
          <span
            key={index}
            style={{ ...baseStyle, backgroundColor: '#c8e6c9', color: '#2e7d32' }}
            title="Accepted suggestion"
          >
            {item.suggestion}
          </span>
        );
      }

      if (item.accepted === false) {
        return (
          <span
            key={index}
            style={{ ...baseStyle, backgroundColor: '#ffcdd2', color: '#c62828' }}
            title="Rejected suggestion"
          >
            {item.original}
          </span>
        );
      }

      // Default state
      return (
        <span
          key={index}
          style={{ ...baseStyle, backgroundColor: '#fff59d', border: '1px solid #fbc02d', cursor: 'pointer' }}
          title="Click ✔ to accept or ✘ to reject"
        >
          {item.suggestion}
          <button onClick={() => handleAccept(item.id)} style={{ marginLeft: 4, border: 'none', background: 'transparent', cursor: 'pointer' }}>✔️</button>
          <button onClick={() => handleReject(item.id)} style={{ marginLeft: 2, border: 'none', background: 'transparent', cursor: 'pointer' }}>❌</button>
        </span>
      );
    });
  };

  //  output
  return (
    <div className="app-container">
      <h1 className="app-title">AI Document Assistant</h1>
      <p className="app-description">
        Upload a document to view grammar suggestions side-by-side with the improved version. Supports PDF, DOCX, and TXT files.
      </p>

      <div className="file-upload">
        <label htmlFor="fileInput" className="upload-button">Choose a Document</label>
        <input id="fileInput" type="file" accept=".txt,.docx,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />
        {status === 'loading' && (
          <div className="loading-message">⏳ Loading document and checking for suggestions...</div>
        )}
      </div>

      {/* Character limit warning */}
      {originalText.length > MAX_CHAR_WARNING && (
        <div style={{ color: 'red' }}>
          Warning: Document is too large. Please limit it to approximately 19,000 characters to ensure full analysis.
        </div>
      )}

      <div className="split-view">
        {/* Original preview panel */}
        <div className="panel">
          <div className="panel-header">Preview</div>
          <div className="panel-content">
            <div ref={canvasContainerRef} />
            <div ref={docxContainerRef} />
          </div>
        </div>

        {/* Suggestions panel */}
        <div className="panel">
          <div className="panel-header">Improved Text</div>
          <div className="legend">
            <strong>Legend:</strong>
            <span className="legend-item suggestion">Suggestion</span>
            <span className="legend-item accepted">Accepted</span>
            <span className="legend-item rejected">Rejected</span>
          </div>
          <div className="panel-content">
            {renderImprovedText()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
