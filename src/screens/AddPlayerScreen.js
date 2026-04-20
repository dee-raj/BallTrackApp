import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import ConfirmModal from '../components/ConfirmModal';
import ActionSheet from '../components/ActionSheet';
import * as ImagePicker from 'expo-image-picker';
import { getTeams } from '../api/teams';
import { createPlayer, addPlayerToTeam, getPlayers } from '../api/players';
import { uploadImage } from '../api/uploads';

export default function AddPlayerScreen({ navigation }) {
  const [mode, setMode] = useState('new'); // 'new' | 'existing'
  const [globalPlayers, setGlobalPlayers] = useState([]);
  const [selectedGlobalPlayerId, setSelectedGlobalPlayerId] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [photoUri, setPhotoUri] = useState(null);

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(false);

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmResolver, setConfirmResolver] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamsData, playersData] = await Promise.all([
        getTeams(),
        getPlayers()
      ]);
      setTeams(teamsData);
      setGlobalPlayers(playersData);
      const allTeams = [{ id: 'global', name: 'Global Pool (No Team)', isGlobal: true }, ...teamsData];
      setTeams(allTeams);
      if (!selectedTeamId) setSelectedTeamId('global');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load teams and players' });
    }
  };

  const handleCamera = async () => {
    setActionSheetVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'We need camera access to take photos.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) setPhotoUri(result.assets[0].uri);
  };

  const handleLibrary = async () => {
    setActionSheetVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) setPhotoUri(result.assets[0].uri);
  };

  const pickImage = () => {
    setActionSheetVisible(true);
  };

  const handleCreate = async () => {
    if (selectedTeamId !== 'global' && !jerseyNumber) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a jersey number to link the player.' });
      return;
    }

    if (mode === 'existing' && selectedTeamId === 'global') {
      Toast.show({ type: 'info', text1: 'Notice', text2: 'Please select a team to link the existing player.' });
      return;
    }

    if (mode === 'new' && !fullName.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter the player name.' });
      return;
    }

    if (mode === 'existing' && !selectedGlobalPlayerId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select an existing player.' });
      return;
    }

    try {
      setLoading(true);

      let targetPlayerId = selectedGlobalPlayerId;
      let uploadedUrl = undefined;

      if (mode === 'new') {
        // Upload photo if selected
        if (photoUri) {
          try {
            const uploadResult = await uploadImage(photoUri);
            uploadedUrl = uploadResult.url;
          } catch (uploadErr) {
            console.log('Upload failed', uploadErr);
            // We can choose to continue or abort. Let's warn the user.
            const proceed = await new Promise(resolve => {
              setConfirmResolver(() => resolve);
              setConfirmVisible(true);
            });
            if (!proceed) {
              setLoading(false);
              return;
            }
          }
        }

        const player = await createPlayer({
          fullName,
          phone: phone || undefined,
          email: email || undefined,
          dateOfBirth: dateOfBirth || undefined,
          photoUrl: uploadedUrl
        });
        targetPlayerId = player.id;
      }

      if (selectedTeamId !== 'global') {
        await addPlayerToTeam(selectedTeamId, targetPlayerId, jerseyNumber);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Player registered and added to team!' });
      } else {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Player registered to global pool!' });
      }
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e) {
      const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed adding player');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message
      });
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
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ flex: 1, paddingBottom: 12 }}>
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

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{mode === 'new' ? 'Player Profile' : 'Select Player'}</Text>

              {mode === 'new' ? (
                <View>
                  <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.selectedPhoto} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <MaterialCommunityIcons name="camera-outline" size={30} color="#64748B" />
                        <Text style={styles.photoActionText}>Add Photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>

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
                      {t.isGlobal ? (
                        <MaterialCommunityIcons name="earth" size={24} color="#94A3B8" style={styles.teamLogo} />
                      ) : (
                        <Image source={{ uri: t.logoUrl || 'https://via.placeholder.com/50' }} style={styles.teamLogo} />
                      )}
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
              <View style={styles.btnContent}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.buttonText}>Confirm Registration</Text>
                )}
              </View>
            </TouchableOpacity>
            <ActionSheet
              visible={actionSheetVisible}
              title="Choose a photo source"
              options={[
                { text: 'Camera', onPress: handleCamera, icon: 'camera' },
                { text: 'Library', onPress: handleLibrary, icon: 'image-multiple' }
              ]}
              onCancel={() => setActionSheetVisible(false)}
            />
            <ConfirmModal
              visible={confirmVisible}
              title="Upload Failed"
              type="danger"
              message="Photo could not be uploaded. Proceed without photo?"
              confirmText="Yes, Proceed"
              cancelText="Cancel"
              onCancel={() => {
                setConfirmVisible(false);
                if (confirmResolver) confirmResolver(false);
              }}
              onConfirm={() => {
                setConfirmVisible(false);
                if (confirmResolver) confirmResolver(true);
              }}
            />
          </View>
        </ScrollView>
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
  photoPicker: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    marginBottom: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoEmoji: {
    fontSize: 30,
    marginBottom: 4,
  },
  photoActionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
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
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
