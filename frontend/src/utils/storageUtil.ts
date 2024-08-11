// Get
const getSessionItem = (itemName: string): string | undefined => {
  const item = sessionStorage.getItem(itemName);
  return item ? item : undefined;
};

// Set
const setSessionItem = (itemName: string, itemValue: string): void => {
  sessionStorage.setItem(itemName, itemValue);
};

// Delete
const removeSessionItem = (itemName: string): void => {
  sessionStorage.removeItem(itemName);
};

export default {
  getSessionItem,
  setSessionItem,
  removeSessionItem,
};
