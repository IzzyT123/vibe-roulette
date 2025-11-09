import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Sparkles, ArrowRight, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { RibbonButton } from './RibbonButton';

interface FirstRunSetupProps {
  onComplete: () => void;
}

type AIProvider = 'openai' | 'anthropic' | 'mock';
type SetupStep = 'welcome' | 'configure';

const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    keyPlaceholder: 'sk-...',
    instructions: 'Get your API key from https://platform.openai.com/api-keys',
    cost: '~$0.20-$1.00 per session'
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
    keyPlaceholder: 'sk-ant-...',
    instructions: 'Get your API key from https://console.anthropic.com/settings/keys',
    cost: '~$0.10-$0.50 per session'
  },
  mock: {
    name: 'Mock AI (Free)',
    models: ['mock-gpt'],
    keyPlaceholder: 'No key required',
    instructions: 'Uses simulated responses - perfect for testing',
    cost: 'FREE'
  }
};

export function FirstRunSetup({ onComplete }: FirstRunSetupProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<SetupStep>('welcome');
  const [provider, setProvider] = useState<AIProvider>('mock');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Always show on first load if no config exists
    const hasAPIConfig = localStorage.getItem('vibeRouletteAPIConfig');
    
    if (!hasAPIConfig) {
      setShow(true);
    }
  }, []);

  useEffect(() => {
    // Set default model when provider changes
    if (provider) {
      setModel(AI_PROVIDERS[provider].models[0]);
    }
  }, [provider]);

  const handleStartWithMock = () => {
    localStorage.setItem('vibeRouletteAPIConfig', JSON.stringify({
      provider: 'mock',
      apiKey: '',
      model: 'mock-gpt'
    }));
    localStorage.setItem('vibeRouletteSetupComplete', 'true');
    setShow(false);
    onComplete();
  };

  const handleConfigureRealAI = () => {
    setProvider('openai');
    setStep('configure');
  };

  const handleSaveConfig = async () => {
    setError(null);
    
    // Validate
    if (provider !== 'mock' && !apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setIsSaving(true);

    try {
      const config = {
        provider,
        apiKey: provider === 'mock' ? '' : apiKey.trim(),
        model
      };

      // Save configuration
      localStorage.setItem('vibeRouletteAPIConfig', JSON.stringify(config));
      localStorage.setItem('vibeRouletteSetupComplete', 'true');

      // Quick validation test for real API keys
      if (provider !== 'mock') {
        const testResult = await testAPIKey(provider, apiKey.trim());
        if (!testResult.success) {
          setError(testResult.error || 'API key validation failed. You can still continue, but AI may not work.');
          setIsSaving(false);
          // Don't return - let them continue anyway
          setTimeout(() => {
            setShow(false);
            onComplete();
          }, 3000);
          return;
        }
      }

      setShow(false);
      onComplete();
    } catch (err) {
      setError('Failed to save configuration');
      setIsSaving(false);
    }
  };

  const testAPIKey = async (provider: AIProvider, key: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        return { success: response.ok, error: response.ok ? undefined : 'Invalid OpenAI API key' };
      } else if (provider === 'anthropic') {
        // Anthropic doesn't have a simple validation endpoint, so we'll skip
        return { success: true };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error - check your connection' };
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8">
      <motion.div
        key={step}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full rounded-lg overflow-hidden"
        style={{
          background: 'var(--ticket-cream)',
          boxShadow: '0 20px 60px rgba(177, 107, 255, 0.6)'
        }}
      >
        {/* Header */}
        <div
          className="p-8 text-center"
          style={{
            background: 'var(--grad-arcade)',
          }}
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
            className="inline-block mb-4"
          >
            <Sparkles size={64} color="white" />
          </motion.div>
          <h1 
            className="text-5xl m-0"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'white'
            }}
          >
            {step === 'welcome' ? (
              <>
                WELCOME TO
                <br />
                VIBE ROULETTE!
              </>
            ) : (
              'CONFIGURE AI'
            )}
          </h1>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 'welcome' ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-8 space-y-6"
            >
          <div>
            <h2 
              className="text-2xl mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--ink-violet)'
              }}
            >
              🎮 Choose Your AI Experience
            </h2>
            <p className="m-0 opacity-70" style={{ color: 'var(--ink-violet)' }}>
              Vibe Roulette features AI-powered code generation to help you build faster. 
              You have two options:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Mock AI Option */}
            <motion.div
              className="p-6 rounded-lg border-2"
              style={{
                background: 'white',
                borderColor: 'var(--mint-glow)'
              }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="text-3xl mb-3">🎯</div>
              <h3 
                className="m-0 mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--ink-violet)'
                }}
              >
                Mock AI (Free)
              </h3>
              <p className="text-sm m-0 opacity-70" style={{ color: 'var(--ink-violet)' }}>
                Perfect for testing! Uses simulated responses. No API key or costs required.
              </p>
            </motion.div>

            {/* Real AI Option */}
            <motion.div
              className="p-6 rounded-lg border-2"
              style={{
                background: 'white',
                borderColor: 'var(--orchid-electric)'
              }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="text-3xl mb-3">🚀</div>
              <h3 
                className="m-0 mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--ink-violet)'
                }}
              >
                Real AI (OpenAI/Claude)
              </h3>
              <p className="text-sm m-0 opacity-70" style={{ color: 'var(--ink-violet)' }}>
                Use your own API key. You'll be charged by your provider based on usage.
              </p>
            </motion.div>
          </div>

          {/* Important Note */}
          <div
            className="p-4 rounded-lg flex items-start gap-3"
            style={{
              background: 'rgba(255, 106, 0, 0.1)',
              border: '1px solid var(--neon-orange)'
            }}
          >
            <Key size={20} color="var(--neon-orange)" className="mt-0.5" />
            <div>
              <p className="text-sm m-0" style={{ color: 'var(--ink-violet)' }}>
                <strong>Privacy & Cost:</strong> We never store your API keys. 
                All AI requests go directly from your browser to your chosen provider. 
                You can change this anytime in Settings.
              </p>
            </div>
          </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <RibbonButton
                  onClick={handleStartWithMock}
                  variant="accent"
                  size="lg"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} />
                    Start with Mock AI (Free)
                  </div>
                </RibbonButton>
                
                <RibbonButton
                  onClick={handleConfigureRealAI}
                  variant="primary"
                  size="lg"
                >
                  <div className="flex items-center gap-2">
                    Configure Real AI
                    <ArrowRight size={20} />
                  </div>
                </RibbonButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="configure"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div>
                <h2 
                  className="text-2xl mb-3"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--ink-violet)'
                  }}
                >
                  🚀 Set Up Your AI
                </h2>
                <p className="m-0 opacity-70" style={{ color: 'var(--ink-violet)' }}>
                  Configure your AI provider now so you can start coding immediately!
                </p>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block mb-3" style={{ color: 'var(--ink-violet)', fontFamily: 'var(--font-display)' }}>
                  Choose Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={() => setProvider('openai')}
                    className="p-4 rounded-lg text-left transition-all"
                    style={{
                      background: provider === 'openai' ? 'linear-gradient(135deg, var(--neon-orange), var(--orchid-electric))' : 'white',
                      border: provider === 'openai' ? '2px solid var(--mint-glow)' : '2px solid rgba(15, 10, 31, 0.1)',
                      color: 'var(--ink-violet)',
                      cursor: 'pointer'
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                      OpenAI (GPT-4)
                    </div>
                    <div className="text-xs opacity-60">
                      {AI_PROVIDERS.openai.cost}
                    </div>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setProvider('anthropic')}
                    className="p-4 rounded-lg text-left transition-all"
                    style={{
                      background: provider === 'anthropic' ? 'linear-gradient(135deg, var(--neon-orange), var(--orchid-electric))' : 'white',
                      border: provider === 'anthropic' ? '2px solid var(--mint-glow)' : '2px solid rgba(15, 10, 31, 0.1)',
                      color: 'var(--ink-violet)',
                      cursor: 'pointer'
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                      Anthropic (Claude)
                    </div>
                    <div className="text-xs opacity-60">
                      {AI_PROVIDERS.anthropic.cost}
                    </div>
                  </motion.button>
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

              {/* Important Info */}
              <div
                className="p-4 rounded-lg flex items-start gap-3"
                style={{
                  background: 'rgba(81, 255, 196, 0.1)',
                  border: '1px solid var(--mint-glow)'
                }}
              >
                <CheckCircle size={20} color="var(--mint-glow)" className="mt-0.5" />
                <div>
                  <p className="text-sm m-0" style={{ color: 'var(--ink-violet)' }}>
                    <strong>Your key is secure:</strong> Stored only in your browser, never sent to our servers. 
                    All AI requests go directly from your browser to {AI_PROVIDERS[provider].name}.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg flex items-center gap-2"
                  style={{
                    background: 'rgba(255, 51, 102, 0.1)',
                    border: '1px solid #FF3366',
                    color: 'var(--ink-violet)'
                  }}
                >
                  <AlertCircle size={18} color="#FF3366" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <RibbonButton
                  onClick={() => setStep('welcome')}
                  variant="secondary"
                  size="lg"
                >
                  ← Back
                </RibbonButton>
                
                <RibbonButton
                  onClick={handleSaveConfig}
                  disabled={isSaving || !apiKey.trim()}
                  variant="primary"
                  size="lg"
                >
                  <div className="flex items-center gap-2">
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkles size={20} />
                        </motion.div>
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Save & Start Coding!
                      </>
                    )}
                  </div>
                </RibbonButton>
              </div>

              {/* Skip to mock option */}
              <div className="text-center pt-2">
                <button
                  onClick={handleStartWithMock}
                  className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--ink-violet)', textDecoration: 'underline' }}
                >
                  Skip and use Mock AI instead (free)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

