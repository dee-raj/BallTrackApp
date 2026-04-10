import apiClient from './client';

export const getTeams = async () => {
  const response = await apiClient.get('/teams');
  return response.data;
};

export const createTeam = async (teamData) => {
  const response = await apiClient.post('/teams', teamData);
  return response.data;
};

export const updateTeam = async (teamId, teamData) => {
  const response = await apiClient.patch(`/teams/${teamId}`, teamData);
  return response.data;
};

export const deleteTeam = async (teamId) => {
  const response = await apiClient.delete(`/teams/${teamId}`);
  return response.data;
};
