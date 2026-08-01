import React, { useCallback, useEffect, useState } from 'react';
import {
  getAiSettings,
  saveProviderKey,
  deleteProviderKey,
  saveProviderModel,
  activateProvider,
  getProviderModels,
  testProviderConnection,
} from '../services/api';
import { errorMessage } from '../api/axios';
import { useToast } from '../components/common/Toast';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import { ErrorState } from '../components/common/EmptyState';
import { ConfirmModal } from '../components/common/Modal';
import { TextInput, Select } from '../components/forms/Field';

const PROVIDER_INFO = {
  gemini: {
    label: 'Google Gemini',
    note: 'Generous free tier. Keys from Google AI Studio.',
    keysUrl: 'https://aistudio.google.com/apikey',
  },
  openai: {
    label: 'OpenAI',
    note: 'Paid per request. Keys from the OpenAI dashboard.',
    keysUrl: 'https://platform.openai.com/api-keys',
  },
  groq: {
    label: 'Groq',
    note: 'Very fast, with a free tier. Runs open models.',
    keysUrl: 'https://console.groq.com/keys',
  },
  openrouter: {
    label: 'OpenRouter',
    note: 'One key, many models — including free ones.',
    keysUrl: 'https://openrouter.ai/keys',
  },
  mock: {
    label: 'Mock (offline)',
    note: 'Canned replies. Development only, no provider call.',
    keysUrl: null,
  },
};

const ProviderCard = ({ provider, canStoreKeys, onChanged }) => {
  const toast = useToast();
  const info = PROVIDER_INFO[provider.provider] || { label: provider.provider };

  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [keyError, setKeyError] = useState('');

  const [models, setModels] = useState([]);
  const [modelsError, setModelsError] = useState(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const [testing, setTesting] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const isMock = provider.provider === 'mock';

  const loadModels = useCallback(
    async (refresh = false) => {
      setLoadingModels(true);
      setModelsError(null);
      try {
        const data = await getProviderModels(provider.provider, refresh);
        setModels(data.models || []);
        setModelsError(data.error || null);
        setModelsLoaded(true);
      } catch (error) {
        setModelsError(errorMessage(error, 'Could not load models.'));
      } finally {
        setLoadingModels(false);
      }
    },
    [provider.provider]
  );

  const handleSaveKey = async () => {
    setSaving(true);
    setKeyError('');
    try {
      await saveProviderKey(provider.provider, apiKey);
      toast.success(`${info.label} key saved and verified.`);
      setApiKey('');
      setModelsLoaded(false);
      setModels([]);
      onChanged();
    } catch (error) {
      setKeyError(errorMessage(error, 'Could not save that key.'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    try {
      await deleteProviderKey(provider.provider);
      toast.success(`${info.label} key removed.`);
      setConfirmRemove(false);
      setModels([]);
      setModelsLoaded(false);
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not remove that key.'));
    }
  };

  const handleModelChange = async (model) => {
    try {
      await saveProviderModel(provider.provider, model);
      toast.success(model ? `Model set to ${model}.` : 'Reverted to the provider default.');
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save that model.'));
    }
  };

  const handleActivate = async () => {
    try {
      await activateProvider(provider.provider);
      toast.success(`${info.label} is now the active provider.`);
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not activate that provider.'));
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testProviderConnection(provider.provider);
      toast.success(result.message);
    } catch (error) {
      toast.error(errorMessage(error, 'The test failed.'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className={`rounded-card border bg-white p-5 shadow-card ${
        provider.isActive ? 'border-brand-400 ring-1 ring-brand-200' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">{info.label}</h2>
            {provider.isActive && <Badge tone="brand">Active</Badge>}
            {provider.configured ? (
              <Badge tone="success">Configured</Badge>
            ) : (
              <Badge tone="neutral">No key</Badge>
            )}
            {provider.source === 'environment' && <Badge tone="info">From environment</Badge>}
          </div>
          {info.note && <p className="mt-1 text-sm text-ink-muted">{info.note}</p>}
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
          {provider.configured && !provider.isActive && (
            <Button size="sm" onClick={handleActivate}>
              Make active
            </Button>
          )}
          {provider.configured && !isMock && (
            <Button variant="secondary" size="sm" onClick={handleTest} loading={testing}>
              Test
            </Button>
          )}
        </div>
      </div>

      {!isMock && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          {provider.source === 'environment' ? (
            <p className="rounded-lg border border-slate-200 bg-surface-sunken px-4 py-3 text-sm text-ink-muted">
              This key comes from the <code className="font-mono">{provider.envKeyName}</code>{' '}
              environment variable on the server. Saving a key here overrides it.
            </p>
          ) : provider.apiKeyHint ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-surface-sunken px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Key saved</p>
                <p className="break-anywhere font-mono text-sm text-ink-subtle">{provider.apiKeyHint}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setConfirmRemove(true)}>
                Remove
              </Button>
            </div>
          ) : null}

          <div className="mt-4">
            <TextInput
              label={provider.apiKeyHint ? 'Replace API key' : 'API key'}
              type="password"
              autoComplete="off"
              spellCheck="false"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setKeyError('');
              }}
              error={keyError}
              disabled={!canStoreKeys}
              placeholder={canStoreKeys ? 'Paste your key' : 'Key storage is unavailable'}
              hint={
                canStoreKeys
                  ? 'Verified with the provider before it is saved, then encrypted. It is never shown again or sent to a browser.'
                  : undefined
              }
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button onClick={handleSaveKey} loading={saving} disabled={!apiKey.trim() || !canStoreKeys}>
                Save key
              </Button>
              {info.keysUrl && (
                <a
                  href={info.keysUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  Get a key
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Models are listed live from the provider, never hardcoded. */}
      {provider.configured && !isMock && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-sm font-medium text-ink">Model</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadModels(modelsLoaded)}
              loading={loadingModels}
            >
              {modelsLoaded ? 'Refresh list' : 'Load available models'}
            </Button>
          </div>

          {!modelsLoaded && !loadingModels && (
            <p className="mt-2 text-sm text-ink-subtle">
              Current: <span className="break-anywhere font-mono">{provider.model || 'provider default'}</span>
            </p>
          )}

          {modelsError && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {modelsError}
            </p>
          )}

          {modelsLoaded && models.length > 0 && (
            <Select
              className="mt-3"
              label={`${models.length} models available`}
              value={provider.model || ''}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              <option value="">Provider default</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                  {model.free ? ' — free' : ''}
                  {model.deprecated ? ' (deprecated)' : ''}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleRemoveKey}
        title={`Remove the ${info.label} key?`}
        description="The assistant will stop working on this provider until a new key is added."
        confirmLabel="Remove key"
      />
    </div>
  );
};

const AiSettings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAiSettings()
      .then((response) => {
        setData(response);
        setLoading(false);
      })
      .catch((err) => {
        setError(errorMessage(err, 'Could not load AI settings.'));
        setLoading(false);
      });
  }, []);

  useEffect(load, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading settings" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState description={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">AI settings</h1>
        <p className="mt-2 text-ink-muted">
          Configure which provider powers the assistant. Add a key, pick a model from the
          provider&apos;s live catalogue, and make one provider active.
        </p>
      </header>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-ink-muted">
        <p>
          <span className="font-semibold text-ink">Where keys live: </span>
          keys are encrypted and stored on the server. They are never sent to a browser, written to
          a log, or included in an error message — this page only ever shows a masked preview.
        </p>
      </div>

      {!data.canStoreKeys && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p className="font-semibold">Key storage is disabled</p>
          <p className="mt-1">
            The server has no <code className="font-mono">SETTINGS_ENCRYPTION_KEY</code>, so keys
            cannot be saved from this page. Generate one with{' '}
            <code className="font-mono">openssl rand -base64 32</code>, add it to the server
            environment, and restart. Providers configured through environment variables still work.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {data.providers.map((provider) => (
          <ProviderCard
            key={provider.provider}
            provider={provider}
            canStoreKeys={data.canStoreKeys}
            onChanged={load}
          />
        ))}
      </div>
    </div>
  );
};

export default AiSettings;
