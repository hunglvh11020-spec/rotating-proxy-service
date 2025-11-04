import React, { useState, useEffect, useCallback } from 'react';
import { KeyGenerator } from './components/KeyGenerator';
import { KeyHistory } from './components/KeyHistory';
import { type ProxyKey } from './types';

function App() {
  const [keys, setKeys] = useState<ProxyKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/keys');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch keys.');
      }
      const data: ProxyKey[] = await response.json();
      // Reverse to show newest keys first, assuming DB returns them in insertion order.
      setKeys(data.reverse());
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while fetching keys.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleKeyGenerated = (newKey: ProxyKey) => {
    setKeys(prevKeys => [newKey, ...prevKeys]);
  };

  const handleDeleteKey = async (keyId: string) => {
    const originalKeys = keys;
    // Optimistic UI update
    setKeys(prevKeys => prevKeys.filter(key => key.id !== keyId));

    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on failure
        setKeys(originalKeys);
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete key.' }));
        setError(errorData.message || 'Failed to delete key.');
      }
    } catch (err: any) {
      // Revert on failure
      setKeys(originalKeys);
      setError(err.message || 'An unexpected error occurred while deleting the key.');
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans antialiased">
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle at top right, rgba(20, 184, 166, 0.1), transparent 40%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.1), transparent 50%)',
          zIndex: 0
        }}
      />
      <main className="relative z-10 container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <header className="text-center mb-10 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Proxy Key Manager
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Generate and manage your secure proxy keys for accessing internal services.
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-12">
          <KeyGenerator onKeyGenerated={handleKeyGenerated} />
          {error && (
            <div className="text-center p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300">
                {error}
            </div>
           )}
          <KeyHistory keys={keys} onDeleteKey={handleDeleteKey} isLoading={isLoading} />
        </div>
        
        <footer className="text-center mt-16 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Proxy Service Inc. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;