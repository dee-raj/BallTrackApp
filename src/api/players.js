import apiClient from './client';

export const getPlayers = async () => {
  const response = await apiClient.get('/players');
  return response.data;
};

export const createPlayer = async (playerData) => {
  const response = await apiClient.post('/players', playerData);
  return response.data;
};

export const updatePlayer = async (playerId, playerData) => {
  const response = await apiClient.patch(`/players/${playerId}`, playerData);
  return response.data;
};

export const deletePlayer = async (playerId) => {
  const response = await apiClient.delete(`/players/${playerId}`);
  return response.data;
};

export const addPlayerToTeam = async (teamId, playerId, jerseyNumber, isCaptain = false) => {
  const response = await apiClient.post(`/players/team/${teamId}`, {
    playerId,
    jerseyNumber: parseInt(jerseyNumber),
    isCaptain,
  });
  return response.data;
};

export const getTeamPlayers = async (teamId) => {
  const response = await apiClient.get(`/players/team/${teamId}`);
  return response.data;
};

export const removePlayerFromTeam = async (teamId, playerId) => {
  const response = await apiClient.delete(`/players/team/${teamId}/${playerId}`);
  return response.data;
};
