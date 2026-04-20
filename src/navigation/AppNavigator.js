import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import MatchDetailsScreen from '../screens/MatchDetailsScreen';
import MatchScoringScreen from '../screens/MatchScoringScreen';
import CreateTeamScreen from '../screens/CreateTeamScreen';
import AddPlayerScreen from '../screens/AddPlayerScreen';
import CreateMatchScreen from '../screens/CreateMatchScreen';
import MatchReportScreen from '../screens/MatchReportScreen';
import ViewTeamsScreen from '../screens/ViewTeamsScreen';
import PlayersListScreen from '../screens/PlayersListScreen';
import TournamentsListScreen from '../screens/TournamentsListScreen';
import TournamentDetailsScreen from '../screens/TournamentDetailsScreen';
import CreateTournamentScreen from '../screens/CreateTournamentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import UserGuideScreen from '../screens/UserGuideScreen';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="MatchDetails"
        component={MatchDetailsScreen}
        options={{ title: 'Match Details' }}
      />
      <Stack.Screen
        name="MatchScoring"
        component={MatchScoringScreen}
        options={{ title: 'Scoring' }}
      />
      <Stack.Screen
        name="CreateTeam"
        component={CreateTeamScreen}
        options={{ title: 'Create Team' }}
      />
      <Stack.Screen
        name="AddPlayer"
        component={AddPlayerScreen}
        options={{ title: 'Add Player' }}
      />
      <Stack.Screen
        name="CreateMatch"
        component={CreateMatchScreen}
        options={{ title: 'New Match' }}
      />
      <Stack.Screen
        name="MatchReport"
        component={MatchReportScreen}
        options={{ title: 'Match Report' }}
      />
      <Stack.Screen
        name="ViewTeams"
        component={ViewTeamsScreen}
        options={{ title: 'Team Directory' }}
      />
      <Stack.Screen
        name="PlayersList"
        component={PlayersListScreen}
        options={{ title: 'Player Directory' }}
      />
      <Stack.Screen
        name="TournamentsList"
        component={TournamentsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TournamentDetails"
        component={TournamentDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTournament"
        component={CreateTournamentScreen}
        options={{ title: 'New Tournament' }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserGuide"
        component={UserGuideScreen}
        options={{ headerShown: false }}
      />

    </Stack.Navigator>
  );
}
