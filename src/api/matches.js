import apiClient from './client';

export const getMatches = async () => {
  const response = await apiClient.get('/matches');
  return response.data;
};

export const getMatchScoreboard = async (matchId) => {
  const response = await apiClient.get(`/matches/${matchId}/scoreboard`);
  return response.data;
};

export const getInningsScoreboard = async (matchId, inningsNumber) => {
  const response = await apiClient.get(`/matches/${matchId}/innings/${inningsNumber}`);
  return response.data;
};

export const recordBall = async (ballData) => {
  const response = await apiClient.post('/matches/ball', ballData);
  return response.data;
};

export const recordToss = async (tossData) => {
  const response = await apiClient.post('/matches/toss', tossData);
  return response.data;
};

export const startInnings = async (inningsData) => {
  const response = await apiClient.post('/matches/innings', inningsData);
  return response.data;
};

export const createMatch = async (matchData) => {
  const response = await apiClient.post('/matches', matchData);
  return response.data;
};

export const undoBall = async (matchId) => {
  const response = await apiClient.post(`/matches/${matchId}/undo`);
  return response.data;
};

export const declareInnings = async (inningsId) => {
  const response = await apiClient.post('/matches/declare', { inningsId });
  return response.data;
};

export const deleteMatch = async (matchId) => {
  const response = await apiClient.delete(`/matches/${matchId}`);
  return response.data;
};

export const updateMatch = async (matchId, matchData) => {
  const response = await apiClient.patch(`/matches/${matchId}`, matchData);
  return response.data;
};

export const getMatchPerformance = async (matchId) => {
  const response = await apiClient.get(`/matches/${matchId}/performance`);
  return response.data;
};
