export const waitForControllerCompletion = (runTest: (signalComplete: () => void) => void): Promise<object> => {
  return new Promise<object>((resolve, reject) => {
    runTest(() => {
      resolve({});
    });
  })
}