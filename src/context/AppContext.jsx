import React, { createContext, useState, useContext } from 'react';

// Create a new context to manage global state for suggestions
const AppContext = createContext();

// Context provider component that wraps the app and shares state/functions
export const AppProvider = ({ children }) => {
  // State to hold grammar suggestions returned from the API
  const [suggestions, setSuggestions] = useState([]);

  // Function to fetch grammar suggestions from the backend API
  const fetchSuggestionsFromAPI = async (text) => {
    try {
      // Send POST request to the API with text content and language
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: 'en-US',  // You can change this to support other locales
        }),
      });

      // Check if the response is not OK and throw a detailed error if so
      if (!response.ok) {
        const errorDetails = await response.text(); // Read the server's error message
        throw new Error(`Failed to fetch suggestions: ${errorDetails}`);
      }

      // Parse the response and update the suggestions state
      const data = await response.json();
      setSuggestions(data.suggestions || []); // Fallback to empty array if none
    } catch (error) {
      // Handle any network or parsing errors
      console.error('Error fetching suggestions:', error);
    }
  };

  // Provide the suggestions state and functions to the app
  return (
    <AppContext.Provider value={{ suggestions, setSuggestions, fetchSuggestionsFromAPI }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to consume the AppContext in other components
export const useAppContext = () => useContext(AppContext);
