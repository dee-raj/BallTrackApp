import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { getTeams } from '../api/teams';
import { createPlayer, addPlayerToTeam, getPlayers } from '../api/players';

export default function AddPlayerScreen({ navigation }) {
  const [mode, setMode] = useState('new'); // 'new' | 'existing'
  const [globalPlayers, setGlobalPlayers] = useState([]);
  const [selectedGlobalPlayerId, setSelectedGlobalPlayerId] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [teamsData, playersData] = await Promise.all([
        getTeams(),
        getPlayers()
      ]);
      setTeams(teamsData);
      setGlobalPlayers(playersData);
      if (teamsData.length > 0 && !selectedTeamId) setSelectedTeamId(teamsData[0].id);
    } catch (e) {
      console.log('Error loading data', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreate = async () => {
    if (!jerseyNumber || !selectedTeamId) {
      Alert.alert('Error', 'Please select a team and enter a jersey number.');
      return;
    }

    if (mode === 'new' && !fullName.trim()) {
      Alert.alert('Error', 'Please enter the player name.');
      return;
    }

    if (mode === 'existing' && !selectedGlobalPlayerId) {
      Alert.alert('Error', 'Please select an existing player.');
      return;
    }

    try {
      setLoading(true);

      let targetPlayerId = selectedGlobalPlayerId;

      if (mode === 'new') {
        const player = await createPlayer({
          fullName,
          phone: phone || undefined,
          email: email || undefined,
          dateOfBirth: dateOfBirth || undefined
        });
        targetPlayerId = player.id;
      }

      await addPlayerToTeam(selectedTeamId, targetPlayerId, jerseyNumber);

      Alert.alert('Success', 'Player registered and added to team!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not add player');
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
            <Text style={styles.title}>Player Registration</Text>
            <Text style={styles.subtitle}>Link a player to a team squad</Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, mode === 'new' && styles.tabActive]} onPress={() => setMode('new')}>
              <Text style={[styles.tabText, mode === 'new' && styles.tabTextActive]}>Brand New</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, mode === 'existing' && styles.tabActive]} onPress={() => setMode('existing')}>
              <Text style={[styles.tabText, mode === 'existing' && styles.tabTextActive]}>Existing Discovery</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{mode === 'new' ? 'Player Profile' : 'Select Player'}</Text>

              {mode === 'new' ? (
                <View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>FULL NAME</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="E.g. Virat Kohli"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>

                  <View style={[styles.inputRow, { gap: 10 }]}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>PHONE</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="99XXXXXX00"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>JERSEY #</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="18"
                        value={jerseyNumber}
                        onChangeText={setJerseyNumber}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="player@example.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>DATE OF BIRTH (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1995-05-20"
                      value={dateOfBirth}
                      onChangeText={setDateOfBirth}
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {globalPlayers.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.playerBadge, selectedGlobalPlayerId === p.id && styles.badgeActive]}
                        onPress={() => setSelectedGlobalPlayerId(p.id)}
                      >
                        <View style={[styles.avatarSmall, selectedGlobalPlayerId === p.id && styles.avatarSmallActive]}>
                          <Text style={[styles.avatarSmallText, selectedGlobalPlayerId === p.id && styles.avatarSmallTextActive]}>{p.fullName[0]}</Text>
                        </View>
                        <Text style={[styles.badgeText, selectedGlobalPlayerId === p.id && styles.badgeTextActive]} numberOfLines={1}>{p.fullName}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>JERSEY NUMBER</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="E.g. 07, 10, 99"
                      value={jerseyNumber}
                      onChangeText={setJerseyNumber}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Assign to Team</Text>
              <View style={styles.teamsGrid}>
                {teams.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.teamCard, selectedTeamId === t.id && styles.teamCardActive]}
                    onPress={() => setSelectedTeamId(t.id)}
                  >
                    <View style={styles.teamLogoContainer}>
                      <Image source={{ uri: t.logoUrl || 'https://via.placeholder.com/50' }} style={styles.teamLogo} />
                    </View>
                    <Text style={[styles.teamCardName, selectedTeamId === t.id && styles.teamCardNameActive]} numberOfLines={1}>{t.name}</Text>
                    {selectedTeamId === t.id && (
                      <View style={styles.checkMark}>
                        <View style={styles.dot} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading || teams.length === 0}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Registration 🏏</Text>}
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
    padding: 25,
    backgroundColor: '#fffbebff',
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
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B'
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10
  },
  tabActive: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  tabText: {
    color: '#64748B',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: '#1E293B'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'BOLD',
    color: '#64748B',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  inputRow: {
    flexDirection: 'row',
  },
  horizontalScroll: {
    marginBottom: 20,
  },
  playerBadge: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 10,
    width: 90,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarSmallActive: {
    backgroundColor: '#3B82F6',
  },
  avatarSmallText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  avatarSmallTextActive: {
    color: 'white',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  badgeTextActive: {
    color: '#1E293B',
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamCard: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'pink',
  },
  teamCardActive: {
    borderWidth: 3,
    borderColor: '#34C759',
    backgroundColor: '#F0FDF4',
  },
  teamLogoContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  teamLogo: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  teamCardName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  teamCardNameActive: {
    color: '#1E293B',
  },
  checkMark: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  button: {
    backgroundColor: '#1E293B',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
});
