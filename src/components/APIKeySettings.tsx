import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Settings, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { RibbonButton } from './RibbonButton';

interface APIKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

type AIProvider = 'openai' | 'anthropic' | 'mock';

interface APIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      // GPT-5 (if you have access)
      'gpt-5',
      // Latest Reasoning Models (o1 series) - Best for complex tasks
      'o1-preview', // Most capable reasoning model
      'o1-mini', // Fast reasoning model
      'o1', // Full reasoning model
      // Latest GPT-4o Models (Recommended for most use cases)
      'gpt-4o', // Latest multimodal flagship
      'gpt-4o-mini', // Fast and affordable
      'gpt-4o-2024-11-20', // Latest dated version
      'gpt-4o-2024-08-06',
      'gpt-4o-2024-05-13',
      'gpt-4o-mini-2024-07-18',
      'chatgpt-4o-latest', // Always latest GPT-4o
      // GPT-4 Turbo Models
      'gpt-4-turbo',
      'gpt-4-turbo-2024-04-09',
      'gpt-4-turbo-preview',
      // GPT-4 Models
      'gpt-4',
      'gpt-4-0613',
      'gpt-4-0125-preview',
      // GPT-3.5 Turbo Models
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-0125',
      'gpt-3.5-turbo-1106'
    ],
    keyPlaceholder: 'sk-...',
    instructions: 'Get your API key from https://platform.openai.com/api-keys'
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
    keyPlaceholder: 'sk-ant-...',
    instructions: 'Get your API key from https://console.anthropic.com/settings/keys'
  },
  mock: {
    name: 'Mock AI (No API Key Required)',
    models: ['mock-gpt'],
    keyPlaceholder: 'No key required',
    instructions: 'Uses simulated responses - perfect for testing without costs'
  }
};

export function APIKeySettings({ isOpen, onClose }: APIKeySettingsProps) {
  const [provider, setProvider] = useState<AIProvider>('mock');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('vibeRouletteAPIConfig');
    if (savedConfig) {
      try {
        const config: APIConfig = JSON.parse(savedConfig);
        setProvider(config.provider);
        setApiKey(config.apiKey || '');
        // Use saved model or default to best model for provider
        // Default to gpt-5 (best quality if available, will fallback automatically)
        const defaultModel = config.provider === 'openai' ? 'gpt-5' 
          : config.provider === 'anthropic' ? 'claude-3-5-sonnet-20241022'
          : 'mock-gpt';
        setModel(config.model || defaultModel);
      } catch (e) {
        console.error('Failed to load API config:', e);
      }
    } else {
      // Default to mock
      setModel('mock-gpt');
    }
  }, [isOpen]);

  useEffect(() => {
    // Update model when provider changes - default to best model
    if (!model || !AI_PROVIDERS[provider].models.includes(model)) {
      const defaultModel = provider === 'openai' ? 'gpt-5' 
        : provider === 'anthropic' ? 'claude-3-5-sonnet-20241022'
        : 'mock-gpt';
      setModel(defaultModel);
    }
  }, [provider]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    // Validate
    if (provider !== 'mock' && !apiKey.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter an API key' });
      setIsSaving(false);
      return;
    }

    try {
      const config: APIConfig = {
        provider,
        apiKey: provider === 'mock' ? '' : apiKey,
        model
      };

      // Save to localStorage
      localStorage.setItem('vibeRouletteAPIConfig', JSON.stringify(config));

      // Test the API key if not mock
      if (provider !== 'mock') {
        const testResult = await testAPIKey(provider, apiKey, model);
        if (!testResult.success) {
          setSaveMessage({ type: 'error', text: testResult.error || 'Invalid API key' });
          setIsSaving(false);
          return;
        }
      }

      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const testAPIKey = async (provider: AIProvider, key: string, model: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${key}`
          }
        });
        return { success: response.ok, error: response.ok ? undefined : 'Invalid API key' };
      } else if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model,
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }]
          })
        });
        return { success: response.status !== 401, error: response.status === 401 ? 'Invalid API key' : undefined };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to validate API key' };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100]"
            onClick={onClose}
            style={{
              backdropFilter: 'blur(8px)'
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg pointer-events-auto"
              style={{
                background: 'var(--ticket-cream)',
                boxShadow: '0 20px 60px rgba(177, 107, 255, 0.6)',
              }}
            >
            {/* Die-cut corners */}
            <div 
              className="absolute top-0 right-0 w-4 h-4"
              style={{
                background: 'var(--ink-violet)',
                clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
              }}
            />
            <div 
              className="absolute bottom-0 left-0 w-4 h-4"
              style={{
                background: 'var(--ink-violet)',
                clipPath: 'polygon(0 100%, 100% 100%, 0 0)'
              }}
            />

            {/* Header */}
            <div
              className="sticky top-0 flex items-center justify-between p-6 border-b z-10"
              style={{
                background: 'var(--orchid-electric)',
                borderColor: 'rgba(15, 10, 31, 0.1)'
              }}
            >
              <div className="flex items-center gap-3">
                <Settings size={24} color="var(--ink-violet)" />
                <h2 
                  className="m-0"
                  style={{ 
                    fontFamily: 'var(--font-display)', 
                    color: 'var(--ink-violet)' 
                  }}
                >
                  AI API SETTINGS
                </h2>
              </div>
              <button
                onClick={onClose}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={24} color="var(--ink-violet)" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Important Notice */}
              <div
                className="p-4 rounded-lg flex items-start gap-3"
                style={{
                  background: 'rgba(255, 106, 0, 0.1)',
                  border: '1px solid var(--neon-orange)'
                }}
              >
                <Key size={20} color="var(--neon-orange)" className="mt-0.5" />
                <div>
                  <h3 className="m-0 mb-2" style={{ color: 'var(--ink-violet)', fontFamily: 'var(--font-display)' }}>
                    Your API Key, Your Costs
                  </h3>
                  <p className="text-sm m-0 opacity-70" style={{ color: 'var(--ink-violet)' }}>
                    Vibe Roulette doesn't store or use your API keys on our servers. 
                    All AI requests are made directly from your browser to your chosen provider.
                    You'll be charged based on your provider's pricing.
                  </p>
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block mb-3" style={{ color: 'var(--ink-violet)', fontFamily: 'var(--font-display)' }}>
                  AI Provider
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((providerKey) => {
                    const providerInfo = AI_PROVIDERS[providerKey];
                    const isSelected = provider === providerKey;
                    
                    return (
                      <motion.button
                        key={providerKey}
                        onClick={() => setProvider(providerKey)}
                        className="p-4 rounded-lg text-left transition-all"
                        style={{
                          background: isSelected ? 'linear-gradient(135deg, var(--neon-orange), var(--orchid-electric))' : 'white',
                          border: isSelected ? '2px solid var(--mint-glow)' : '2px solid rgba(15, 10, 31, 0.1)',
                          color: 'var(--ink-violet)',
                          cursor: 'pointer'
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                          {providerInfo.name}
                        </div>
                        <div className="text-xs opacity-60">
                          {providerKey === 'mock' ? 'Free (Testing)' : 'Paid API'}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block mb-2" style={{ color: 'var(--ink-violet)', fontFamily: 'var(--font-display)' }}>
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border text-sm"
                  style={{
                    background: 'white',
                    borderColor: 'rgba(15, 10, 31, 0.2)',
                    color: 'var(--ink-violet)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {AI_PROVIDERS[provider].models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* API Key Input */}
              {provider !== 'mock' && (
                <div>
                  <label className="block mb-2" style={{ color: 'var(--ink-violet)', fontFamily: 'var(--font-display)' }}>
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={AI_PROVIDERS[provider].keyPlaceholder}
                      className="w-full px-4 py-3 pr-12 rounded-lg border text-sm"
                      style={{
                        background: 'white',
                        borderColor: 'rgba(15, 10, 31, 0.2)',
                        color: 'var(--ink-violet)',
                        fontFamily: 'var(--font-body)'
                      }}
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                      type="button"
                    >
                      {showKey ? <EyeOff size={18} color="var(--ink-violet)" /> : <Eye size={18} color="var(--ink-violet)" />}
                    </button>
                  </div>
                  <p className="text-xs mt-2 opacity-60" style={{ color: 'var(--ink-violet)' }}>
                    {AI_PROVIDERS[provider].instructions}
                  </p>
                </div>
              )}

              {/* Save Message */}
              {saveMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg flex items-center gap-2"
                  style={{
                    background: saveMessage.type === 'success' ? 'rgba(81, 255, 196, 0.1)' : 'rgba(255, 51, 102, 0.1)',
                    border: `1px solid ${saveMessage.type === 'success' ? 'var(--mint-glow)' : '#FF3366'}`,
                    color: 'var(--ink-violet)'
                  }}
                >
                  {saveMessage.type === 'success' ? (
                    <CheckCircle size={18} color="var(--mint-glow)" />
                  ) : (
                    <AlertCircle size={18} color="#FF3366" />
                  )}
                  <span className="text-sm">{saveMessage.text}</span>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <RibbonButton
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="primary"
                  size="lg"
                >
                  <div className="flex items-center gap-2">
                    <Key size={20} />
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </div>
                </RibbonButton>
                
                <RibbonButton
                  onClick={onClose}
                  variant="secondary"
                  size="lg"
                >
                  Cancel
                </RibbonButton>
              </div>

              {/* Security Note */}
              <div
                className="p-3 rounded text-xs"
                style={{
                  background: 'rgba(177, 107, 255, 0.05)',
                  color: 'var(--ink-violet)',
                  opacity: 0.7
                }}
              >
                🔒 Your API key is stored locally in your browser and never sent to our servers. 
                It's only used to make direct API calls to your chosen provider.
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

