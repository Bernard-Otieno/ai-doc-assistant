export const GlobalWorkerOptions = {
  workerSrc: ''
};

export const getDocument = () => ({
  promise: Promise.resolve({
    numPages: 1,
    getPage: async () => ({
      getTextContent: async () => ({
        items: []  // Fake text content for testing purposes
      })
    })
  })
});
