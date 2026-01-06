const STORAGE_KEY = 'whist-game-state';

export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving game state:', error);
  }
}

export function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
}

export function clearGameState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing game state:', error);
  }
}

