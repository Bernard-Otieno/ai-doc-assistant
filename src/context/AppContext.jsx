// src/context/AppContext.jsx

import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestionsFromAPI = async (text) => {
    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: 'en-US',  // Adjust language as necessary
        }),
      });
  
      if (!response.ok) {
        const errorDetails = await response.text(); // Read error details from the response
        throw new Error(`Failed to fetch suggestions: ${errorDetails}`);
      }
  
      const data = await response.json();
      setSuggestions(data.suggestions || []); // Assuming API returns suggestions in 'suggestions' field
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };
  

  return (
    <AppContext.Provider value={{ suggestions, setSuggestions, fetchSuggestionsFromAPI }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
