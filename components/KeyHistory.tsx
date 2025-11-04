import React from 'react';
import { type ProxyKey, Lifetime } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { TrashIcon } from './icons/TrashIcon';

interface KeyHistoryProps {
  keys: ProxyKey[];
  onDeleteKey: (keyId: string) => void;
  isLoading: boolean;
}

const KeyHistoryItem: React.FC<{
  proxyKey: ProxyKey;
  onDelete: (id: string) => void;
}> = ({ proxyKey, onDelete }) => {
  const [copied, setCopied] = React.useState(false);

  // Expiration logic is removed as 'createdAt' is no longer available.
  // const isExpired = proxyKey.lifetime > 0 && Date.now() > proxyKey.createdAt + proxyKey.lifetime * 1000;

  const getLifetimeString = () => {
    if (proxyKey.lifetime === Lifetime.UNLIMITED) {
      return "Lifetime: Unlimited";
    }
    // Simple duration display since we don't have an expiry date.
    const days = Math.floor(proxyKey.lifetime / 86400);
    if (days > 0) return `Lifetime: ${days} day(s)`;
    const hours = Math.floor(proxyKey.lifetime / 3600);
    return `Lifetime: ${hours} hour(s)`;
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(proxyKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-opacity duration-300">
      <div className="flex-grow min-w-0">
        <code className="text-cyan-400 text-sm break-all">{proxyKey.key}</code>
        <div className="text-xs text-gray-400 mt-2 flex items-center gap-x-4 flex-wrap">
          <span>Region: {proxyKey.region}</span>
          <span>{getLifetimeString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-end">
        {/* Active/Expired status badge is removed */}
        <button
          onClick={handleCopy}
          className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          aria-label="Copy key"
        >
          {copied ? <span className="text-xs px-1">Copied</span> : <CopyIcon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => onDelete(proxyKey.id)}
          className="p-2 rounded-md bg-gray-700 hover:bg-red-500/50 text-gray-300 hover:text-red-300 transition-colors"
          aria-label="Delete key"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const KeyHistory: React.FC<KeyHistoryProps> = ({ keys, onDeleteKey, isLoading }) => {
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-10 px-6 bg-gray-800/50 rounded-2xl border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">Loading Key History...</h2>
          <p className="text-gray-400">Fetching your keys from the database.</p>
        </div>
      );
    }

    if (keys.length === 0) {
      return (
        <div className="text-center py-10 px-6 bg-gray-800/50 rounded-2xl border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">No Keys Generated Yet</h2>
          <p className="text-gray-400">Use the form above to generate your first proxy key.</p>
        </div>
      );
    }
  
    return (
      <div className="space-y-4">
        {keys.map(key => (
          <KeyHistoryItem key={key.id} proxyKey={key} onDelete={onDeleteKey} />
        ))}
      </div>
    );
  }


  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Key History</h2>
      {renderContent()}
    </div>
  );
};