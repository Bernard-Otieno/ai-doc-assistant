import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { fireEvent } from '@testing-library/react';  


jest.mock('pdfjs-dist'); // the mock

test('renders file input', () => {
  render(<App />);
  const fileInput = screen.getByLabelText(/Choose a Document/i);
  expect(fileInput).toBeInTheDocument();
});

//Title of the app
test('renders app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/AI Document Assistant/i);
  expect(titleElement).toBeInTheDocument();
});


//Displays Suggestions Panel After Upload Simulation
test('displays suggestions panel after uploading a file', async () => {
  render(<App />);
  
  // Mocking the DataTransfer object
  const file = new File(['Dummy content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const fileInput = screen.getByLabelText(/Choose a Document/i);
  
  // Mock the DataTransfer object
  const dataTransfer = {
    files: [file],
  };
  
  // Simulate file selection using fireEvent
  fireEvent.change(fileInput, { target: { files: dataTransfer.files } });

  // Check if suggestions panel appears (waiting for async rendering)
  const suggestionHeader = await screen.findByText(/Improved Version/i); // adjust text if needed
  expect(suggestionHeader).toBeInTheDocument();
});

