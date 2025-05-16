import React, { createContext, useState, useContext } from 'react';

// context to manage global state for suggestions
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // State for grammar suggestions from API
  const [suggestions, setSuggestions] = useState([]);

  // fetch grammar suggestions from API
  const fetchSuggestionsFromAPI = async (text) => {
    try {
      // POST request to the API with text 
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: 'en-US',  // Language
        }),
      });

      // Check response
      if (!response.ok) {
        const errorDetails = await response.text(); // server error message
        throw new Error(`Failed to fetch suggestions: ${errorDetails}`);
      }

      // Parse the response
      const data = await response.json();
      setSuggestions(data.suggestions || []); // empty array if none
    } catch (error) {
      // Handling network or parsing errors
      console.error('Error fetching suggestions:', error);
    }
  };

  // Returning suggestion states and functions to app
  return (
    <AppContext.Provider value={{ suggestions, setSuggestions, fetchSuggestionsFromAPI }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
