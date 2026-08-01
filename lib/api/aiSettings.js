import { ApiError } from './respond.js';

/**
 * The mock provider is a canned-reply stub with no key and no model, so every
 * configuration endpoint rejects it rather than storing settings that would
 * never be read.
 */
export const assertConfigurableProvider = (provider) => {
  if (provider === 'mock') {
    throw new ApiError(
      400,
      'The mock provider has no API key or model configuration.',
      'MOCK_NOT_CONFIGURABLE'
    );
  }
};

export default assertConfigurableProvider;
