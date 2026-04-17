import client from './client';

export const getTournaments = async () => {
  const response = await client.get('/tournaments');
  return response.data;
};

export const getTournamentById = async (id) => {
  const response = await client.get(`/tournaments/${id}`);
  return response.data;
};

export const createTournament = async (data) => {
  const response = await client.post('/tournaments', data);
  return response.data;
};

export const updateTournament = async (id, data) => {
  const response = await client.patch(`/tournaments/${id}`, data);
  return response.data;
};

export const deleteTournament = async (id) => {
  const response = await client.delete(`/tournaments/${id}`);
  return response.data;
};

export const addTeamsToTournament = async (id, teamIds) => {
  const response = await client.post(`/tournaments/${id}/teams`, { teamIds });
  return response.data;
};

export const removeTeamFromTournament = async (id, teamId) => {
  const response = await client.delete(`/tournaments/${id}/teams/${teamId}`);
  return response.data;
};

export const getPointsTable = async (id) => {
  const response = await client.get(`/tournaments/${id}/points-table`);
  return response.data;
};
