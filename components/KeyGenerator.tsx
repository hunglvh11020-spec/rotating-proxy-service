
import React from 'react';
import { useState } from 'react';
import { Region, Lifetime, type ProxyKey } from '../types';
import { CopyIcon } from './icons/CopyIcon';

interface KeyGeneratorProps {
  onKeyGenerated: (key: ProxyKey) => void;
}

export const KeyGenerator: React.FC<KeyGeneratorProps> = ({ onKeyGenerated }) => {
  const [region, setRegion] = useState<Region>(Region.US_EAST);
  const [lifetime, setLifetime] = useState<Lifetime>(Lifetime.DAY);
  const [generatedKeyInfo, setGeneratedKeyInfo] = useState<ProxyKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedKeyInfo(null);

    try {
      // This is the new API call to the backend
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ region, lifetime }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        try {
          // Try to parse it as JSON first, as our backend is supposed to send JSON errors
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || 'Failed to generate key.');
        } catch (jsonError) {
          // If it's not JSON, it's likely a Vercel server error
          if (responseText.includes('<')) { // Basic check for HTML
            throw new Error('Server error. Please check your Vercel logs. Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are set correctly in your Vercel project settings.');
          }
          // Otherwise, show the raw text
          throw new Error(responseText || 'An unknown server error occurred.');
        }
      }

      const newKey: ProxyKey = await response.json();
      
      onKeyGenerated(newKey);
      setGeneratedKeyInfo(newKey);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedKeyInfo) return;
    navigator.clipboard.writeText(generatedKeyInfo.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-cyan-500/10 border border-gray-700 p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Key</h2>
      <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-end">
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-300 mb-2">Region</label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            className="w-full bg-gray-700 border-gray-600 text-white rounded-lg focus:ring-cyan-500 focus:border-cyan-500 p-2.5"
          >
            {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="lifetime" className="block text-sm font-medium text-gray-300 mb-2">Lifetime</label>
          <select
            id="lifetime"
            value={lifetime}
            onChange={(e) => setLifetime(Number(e.target.value) as Lifetime)}
            className="w-full bg-gray-700 border-gray-600 text-white rounded-lg focus:ring-cyan-500 focus:border-cyan-500 p-2.5"
          >
            <option value={Lifetime.HOUR}>1 Hour</option>
            <option value={Lifetime.DAY}>1 Day</option>
            <option value={Lifetime.WEEK}>7 Days</option>
            <option value={Lifetime.MONTH}>30 Days</option>
            <option value={Lifetime.UNLIMITED}>Unlimited</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:col-span-2 md:col-span-1 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center"
        >
          {isLoading ? (
             <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
            </>
          ) : 'Generate Key'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 text-center p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300">
            {error}
        </div>
      )}

      {generatedKeyInfo && (
        <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Your New Key:</h3>
            <div className="flex items-center bg-gray-900 p-3 rounded-lg">
                <code className="text-cyan-300 text-sm flex-grow overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {generatedKeyInfo.key}
                </code>
                 <button
                    onClick={handleCopy}
                    className="ml-4 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                    aria-label="Copy key"
                >
                    {copied ? (
                        <span className="text-xs text-green-400">Copied!</span>
                    ) : (
                        <CopyIcon className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
