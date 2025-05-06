// App.jsx
import React, { useState, useRef } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker';
import * as docx from 'docx-preview';

GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.2.133/build/pdf.worker.mjs`;

function App() {
  const [originalText, setOriginalText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const canvasContainerRef = useRef(null);
  const docxContainerRef = useRef(null);

  const MAX_CHAR_WARNING = 19000;

  const fetchSuggestionsFromAPI = async (text) => {
    try {
      const response = await fetch('https://api.languagetoolplus.com/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text, language: 'en-US' })
      });
      const data = await response.json();

      if (!data.matches.length) return ['Document appears to be fine. No suggestions.'];

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
      return ['Error checking suggestions. Please try again later.'];
    }
  };

  const handleTextUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const text = reader.result;
      const cleanedText = text.replace(/\r\n/g, '\n');
      setOriginalText(cleanedText);
      setSuggestions(await fetchSuggestionsFromAPI(cleanedText));

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

  const handleDocxUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result;
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = '';
        await docx.renderAsync(buffer, docxContainerRef.current);
        const paragraphs = Array.from(docxContainerRef.current.querySelectorAll('p')).map(p => p.innerText.trim());
        const joinedText = paragraphs.join('\n');
        setOriginalText(joinedText);
        setSuggestions(await fetchSuggestionsFromAPI(joinedText));
      }
    };
    reader.readAsArrayBuffer(file);
  };

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

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        canvasContainerRef.current.appendChild(canvas);

        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str).join(' ');
        textContent += strings + '\n';
      }

      setOriginalText(textContent);
      setSuggestions(await fetchSuggestionsFromAPI(textContent));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === 'application/pdf') {
      handlePDFUpload(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      handleDocxUpload(file);
    } else {
      handleTextUpload(file);
    }
  };

  const handleAccept = (id) => {
    setSuggestions(prev => prev.map(item =>
      typeof item === 'string' ? item : (item.id === id ? { ...item, accepted: true } : item)
    ));
  };

  const handleReject = (id) => {
    setSuggestions(prev => prev.map(item =>
      typeof item === 'string' ? item : (item.id === id ? { ...item, accepted: false } : item)
    ));
  };

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

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input type="file" accept=".txt,.docx,.pdf" onChange={handleFileChange} />
      {originalText.length > MAX_CHAR_WARNING && (
        <div style={{ color: 'red' }}>
          Warning: Document is too large. Please limit it to approximately 19,000 characters to ensure full analysis.
        </div>
      )}
      <div style={{ fontSize: '0.85rem', color: '#555' }}>
        <strong>Legend:</strong>
        <span style={{ backgroundColor: '#fff59d', padding: '0 6px', marginLeft: 8 }}>Suggestion</span>
        <span style={{ backgroundColor: '#c8e6c9', padding: '0 6px', marginLeft: 8 }}>Accepted</span>
        <span style={{ backgroundColor: '#ffcdd2', padding: '0 6px', marginLeft: 8 }}>Rejected</span>
      </div>
      <div style={{ display: 'flex', gap: '1rem', height: '400px' }}>
        <div style={{ width: '33%', border: '1px solid #ccc', overflowY: 'auto' }}>
          <div ref={canvasContainerRef} style={{ width: '100%' }} />
          <div ref={docxContainerRef} style={{ width: '100%' }} />
        </div>
        <textarea
          value={originalText}
          readOnly
          placeholder="Original Document"
          style={{
            width: '33%',
            height: '100%',
            resize: 'none',
            border: '1px solid #ccc',
            padding: '0.5rem',
            overflowY: 'scroll',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}
        />
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
      </div>
    </div>
  );
}

export default App;
