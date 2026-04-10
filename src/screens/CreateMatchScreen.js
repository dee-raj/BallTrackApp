import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image, Dimensions, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { getTeams } from '../api/teams';
import { createMatch } from '../api/matches';

const { width } = Dimensions.get('window');

export default function CreateMatchScreen({ navigation }) {
  const [teams, setTeams] = useState([]);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [overs, setOvers] = useState('20');
  const [venue, setVenue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const data = await getTeams();
      setTeams(data);
    } catch (e) {
      console.log('Error loading teams', e);
    }
  };

  const handleCreate = async () => {
    if (!homeTeamId || !awayTeamId || !overs) {
      Alert.alert('Error', 'Please select teams and overs');
      return;
    }
    if (homeTeamId === awayTeamId) {
      Alert.alert('Error', 'Home and Away team must be different');
      return;
    }

    try {
      setLoading(true);
      const match = await createMatch({
        homeTeamId,
        awayTeamId,
        matchDate: new Date().toISOString(),
        overs: parseInt(overs),
        venue: venue || undefined,
      });

      Alert.alert('Success', 'Match Created!', [
        { text: 'OK', onPress: () => navigation.replace('MatchDetails', { matchId: match.id }) }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not create match');
    } finally {
      setLoading(false);
    }
  };

  const renderTeamPicker = (selectedId, onSelect, label) => (
    <View style={styles.pickerSection}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamsHorizontal}>
        {teams.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.teamCard, selectedId === t.id && styles.teamCardActive]}
            onPress={() => onSelect(t.id)}
          >
            <View style={styles.logoContainer}>
              <Image source={{ uri: t.logoUrl || 'https://via.placeholder.com/50' }} style={styles.teamLogo} />
            </View>
            <Text style={[styles.teamName, selectedId === t.id && styles.teamNameActive]} numberOfLines={1}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.title}>Start New Match</Text>
            <Text style={styles.subtitle}>Fill in the details to begin scoring</Text>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {renderTeamPicker(homeTeamId, setHomeTeamId, "Home Team")}
            {renderTeamPicker(awayTeamId, setAwayTeamId, "Away Team")}

            <View style={styles.inputSection}>
              <Text style={styles.label}>Match Config</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputWrapper, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>OVERS</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="20"
                    value={overs}
                    onChangeText={setOvers}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.inputWrapper, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>VENUE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mumbai, Maharashtra"
                    value={venue}
                    onChangeText={setVenue}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleCreate}
              disabled={loading || teams.length < 2}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Setup Match 🏏</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    padding: 30,
    backgroundColor: '#f6fdebff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B'
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
    fontWeight: '600',
  },
  pickerSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 15,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  teamsHorizontal: {
    flexDirection: 'row',
  },
  teamCard: {
    width: 100,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  teamCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamLogo: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  teamName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  teamNameActive: {
    color: '#007AFF',
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    padding: 0,
  },
  button: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

