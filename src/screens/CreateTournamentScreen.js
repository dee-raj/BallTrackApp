import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image, Dimensions, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTeams } from '../api/teams';
import { createTournament, addTeamsToTournament } from '../api/tournaments';

const { width } = Dimensions.get('window');

export default function CreateTournamentScreen({ navigation }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('league'); // 'league' | 'knockout' | 'series'
  const [description, setDescription] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const data = await getTeams();
      setTeams(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load teams');
    }
  };

  const toggleTeamSelection = (id) => {
    if (selectedTeamIds.includes(id)) {
      setSelectedTeamIds(selectedTeamIds.filter(tid => tid !== id));
    } else {
      setSelectedTeamIds([...selectedTeamIds, id]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a tournament name');
      return;
    }

    try {
      setLoading(true);
      const tournament = await createTournament({
        name,
        type,
        description,
        startDate: new Date().toISOString()
      });

      if (selectedTeamIds.length > 0) {
        await addTeamsToTournament(tournament.id, selectedTeamIds);
      }

      Alert.alert('Success', 'Tournament Created!', [
        { text: 'OK', onPress: () => navigation.replace('TournamentDetails', { tournamentId: tournament.id, tournamentName: tournament.name }) }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.title}>New Tournament</Text>
            <Text style={styles.subtitle}>Setup a series or league for rankings</Text>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.inputSection}>
              <Text style={styles.label}>Basic Info</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Summer Cup 2024"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={[styles.inputWrapper, { marginTop: 15 }]}>
                <Text style={styles.inputLabel}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                  placeholder="Optional details"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Tournament Type</Text>
              <View style={styles.typeRow}>
                {['league', 'knockout', 'series'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                    onPress={() => setType(t)}
                  >
                    <MaterialCommunityIcons 
                      name={t === 'league' ? 'trophy-outline' : 'tournament'} 
                      size={20} 
                      color={type === t ? 'white' : '#64748B'} 
                    />
                    <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerSection}>
              <Text style={styles.label}>Participating Teams ({selectedTeamIds.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamsHorizontal}>
                {teams.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.teamCard, selectedTeamIds.includes(t.id) && styles.teamCardActive]}
                    onPress={() => toggleTeamSelection(t.id)}
                  >
                    <View style={styles.logoContainer}>
                      <Image source={{ uri: t.logoUrl || 'https://via.placeholder.com/50' }} style={styles.teamLogo} />
                    </View>
                    <Text style={[styles.teamName, selectedTeamIds.includes(t.id) && styles.teamNameActive]} numberOfLines={1}>{t.name}</Text>
                    {selectedTeamIds.includes(t.id) && (
                      <View style={styles.checkIcon}>
                        <MaterialCommunityIcons name="check-circle" size={16} color="#0EA5E9" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleCreate}
              disabled={loading}
            >
              <View style={styles.btnContent}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.buttonText}>Setup Tournament</Text>
                    <MaterialCommunityIcons name="trophy-variant" size={24} color="white" />
                  </>
                )}
              </View>
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
    backgroundColor: '#f9ebfdff',
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
  inputSection: {
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
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
  },
  typeBtnTextActive: {
    color: 'white',
  },
  pickerSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
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
    borderColor: '#0EA5E9',
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
    color: '#0EA5E9',
  },
  checkIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
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
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
