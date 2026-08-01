import api from '../api/axios';

/**
 * API client.
 *
 * Every function returns the response payload directly and lets errors
 * propagate — callers decide what a failure means in their context. The
 * previous version caught, console.logged and rethrew every error, which added
 * noise without changing behaviour.
 */

const unwrap = (response) => response.data;

const toQuery = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') {
      search.append(key, value);
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

// ─── Projects ────────────────────────────────────────────────────────────────

/**
 * @param {object} filters search, subject, classLevel, difficulty, material,
 *   tag, budgetMin, budgetMax, status, page, limit, sort
 * @returns {Promise<{data, page, limit, total, totalPages}>}
 */
export const fetchProjects = (filters = {}, options = {}) =>
  api.get(`/projects${toQuery(filters)}`, options).then(unwrap);

export const getProjectById = (id) => api.get(`/projects/${id}`).then(unwrap);

export const getRelatedProjects = (id) =>
  api.get(`/projects/${id}/related`).then((r) => r.data.data);

export const getRecommendedProjects = (preferences = {}) =>
  api.get(`/projects/recommended${toQuery(preferences)}`).then((r) => r.data.data);

export const createProject = (projectData) => api.post('/projects', projectData).then(unwrap);

export const updateProject = (id, projectData) =>
  api.put(`/projects/${id}`, projectData).then(unwrap);

export const deleteProject = (id) => api.delete(`/projects/${id}`).then(unwrap);

export const updateProjectStatus = (id, status, rejectionReason) =>
  api.patch(`/projects/${id}/status`, { status, rejectionReason }).then(unwrap);

// ─── Feedback ────────────────────────────────────────────────────────────────

export const submitFeedback = (feedbackData) => api.post('/feedback', feedbackData).then(unwrap);

export const getProjectFeedback = (projectId) =>
  api.get(`/feedback/project/${projectId}`).then(unwrap);

export const deleteFeedback = (id) => api.delete(`/feedback/${id}`).then(unwrap);

// ─── YouTube ─────────────────────────────────────────────────────────────────

/** Resolves a pasted URL into { videoId, videoTitle, videoChannel, ... }. */
export const previewVideo = (url, options = {}) =>
  api.post('/youtube/preview', { url }, options).then(unwrap);

// ─── AI ──────────────────────────────────────────────────────────────────────

export const chatWithAI = (payload) => api.post('/ai/chat', payload).then(unwrap);

export const getProjectHelp = (payload) => api.post('/ai/project-help', payload).then(unwrap);

// ─── AI settings (admin only) ────────────────────────────────────────────────
// These endpoints never return a usable API key — only a masked hint and a
// `configured` flag. Keys are write-only from the client's perspective.

export const getAiSettings = () => api.get('/ai/settings').then(unwrap);

export const getProviderModels = (provider, refresh = false) =>
  api.get(`/ai/settings/${provider}/models${refresh ? '?refresh=true' : ''}`).then(unwrap);

export const saveProviderKey = (provider, apiKey) =>
  api.put(`/ai/settings/${provider}/key`, { apiKey }).then(unwrap);

export const deleteProviderKey = (provider) =>
  api.delete(`/ai/settings/${provider}/key`).then(unwrap);

export const saveProviderModel = (provider, model) =>
  api.put(`/ai/settings/${provider}/model`, { model: model || null }).then(unwrap);

export const activateProvider = (provider) =>
  api.post(`/ai/settings/${provider}/activate`).then(unwrap);

export const testProviderConnection = (provider, model) =>
  api.post(`/ai/settings/${provider}/test`, model ? { model } : {}).then(unwrap);

export default api;
