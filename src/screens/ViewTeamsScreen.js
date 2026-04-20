import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, TextInput, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTeams, deleteTeam, updateTeam } from '../api/teams';
import { getTeamPlayers, removePlayerFromTeam } from '../api/players';
import { uploadImage } from '../api/uploads';
import { AuthContext } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import ActionSheet from '../components/ActionSheet';

export default function ViewTeamsScreen({ navigation }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [newLogoUri, setNewLogoUri] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isGuest } = useContext(AuthContext);

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetTitle, setActionSheetTitle] = useState('');
  const [actionSheetOptions, setActionSheetOptions] = useState([]);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await getTeams();
      setTeams(data);
    } catch (e) {
      console.log('Error loading teams', e);
    } finally {
      setLoading(false);
    }
  };

  const pickTeamEditLogo = async () => {
    setActionSheetTitle('Update Logo');
    setActionSheetOptions([
      {
        text: 'Camera',
        icon: 'camera',
        onPress: async () => {
          setActionSheetVisible(false);
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Toast.show({
              type: 'info',
              text1: 'Error',
              text2: 'We need camera access to take photos.'
            });
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled) setNewLogoUri(result.assets[0].uri);
        }
      },
      {
        text: 'Library',
        icon: 'image-multiple',
        onPress: async () => {
          setActionSheetVisible(false);
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled) setNewLogoUri(result.assets[0].uri);
        }
      }
    ]);
    setActionSheetVisible(true);
  };

  const handleSelectTeam = async (team) => {
    if (selectedTeam?.id === team.id) {
      setSelectedTeam(null);
      setTeamPlayers([]);
      return;
    }

    setSelectedTeam(team);
    refreshTeamPlayers(team.id);
  };

  const refreshTeamPlayers = async (teamId) => {
    try {
      setPlayersLoading(true);
      const data = await getTeamPlayers(teamId);
      setTeamPlayers(data);
    } catch (e) {
      console.log('Failed fetching players', e);
    } finally {
      setPlayersLoading(false);
    }
  }

  const handleDeleteTeam = (team) => {
    setActionSheetTitle(`Delete ${team.name}?`);
    setActionSheetOptions([
      {
        text: 'Delete Team Permanently',
        destructive: true,
        icon: 'trash-can-outline',
        onPress: async () => {
          setActionSheetVisible(false);
          try {
            setDeletingId(team.id);
            await deleteTeam(team.id);
            if (selectedTeam?.id === team.id) setSelectedTeam(null);
            loadTeams();
          } catch (e) {
            const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed deleting team');
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: message
            });
          } finally {
            setDeletingId(null);
          }
        }
      }
    ]);
    setActionSheetVisible(true);
  };

  const handleRemovePlayerFromTeam = (tp) => {
    setActionSheetTitle(`Remove ${tp.player?.fullName}?`);
    setActionSheetOptions([
      {
        text: 'Remove Player from Roster',
        destructive: true,
        icon: 'account-remove-outline',
        onPress: async () => {
          setActionSheetVisible(false);
          try {
            await removePlayerFromTeam(selectedTeam.id, tp.playerId);
            refreshTeamPlayers(selectedTeam.id);
          } catch (e) {
            const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed removing player');
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: message
            });
          }
        }
      }
    ]);
    setActionSheetVisible(true);
  };

  const submitUpdateTeam = async () => {
    if (!editingTeam?.name.trim()) return;
    try {
      setIsUpdating(true);
      let logoUrl = editingTeam.logoUrl;

      if (newLogoUri) {
        try {
          const uploadResult = await uploadImage(newLogoUri);
          logoUrl = uploadResult.url;
        } catch (uploadErr) {
          console.log('Update logo failed', uploadErr);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Could not upload new team logo.'
          });
          setIsUpdating(false);
          return;
        }
      }

      await updateTeam(editingTeam.id, {
        name: editingTeam.name,
        shortName: editingTeam.shortName || undefined,
        homeGround: editingTeam.homeGround || undefined,
        logoUrl: logoUrl,
      });
      setEditingTeam(null);
      setNewLogoUri(null);
      loadTeams();
    } catch (e) {
      const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed updating team');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1E293B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Analytics</Text>
        <Text style={styles.subtitle}>Total Registered Teams: <Text style={{ fontWeight: 'bold', color: '#128612ff', fontSize: 18 }}>{teams?.length}</Text></Text>
      </View>

      <FlatList
        data={teams}
        keyExtractor={t => t.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <View style={[styles.teamCard, deletingId === item.id && { opacity: 0.5 }]}>
            <TouchableOpacity onPress={() => handleSelectTeam(item)} style={styles.teamHeader}>
              <View style={styles.teamInfoMain}>
                <Text style={styles.teamNumber}>{index + 1}.</Text>
                <View style={styles.logoContainer}>
                  <Image source={{ uri: item.logoUrl || 'https://via.placeholder.com/50' }} style={styles.teamLogo} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{item.name}</Text>
                  {item.shortName && <Text style={styles.teamShortName}>{item.shortName}</Text>}
                </View>
              </View>

              <View style={styles.headerRight}>
                {!isGuest && (
                  <View style={styles.adminActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setEditingTeam(item)}>
                      <MaterialCommunityIcons name="pencil" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteTeam(item)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
                <MaterialCommunityIcons
                  name={selectedTeam?.id === item.id ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#94A3B8"
                />
              </View>
            </TouchableOpacity>

            {selectedTeam?.id === item.id && (
              <View style={styles.playersContainer}>
                <View style={styles.squadHeader}>
                  <Text style={styles.squadTitle}>Playing XI & Squad</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{teamPlayers.length} Players</Text>
                  </View>
                </View>
                {playersLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
                ) : (
                  teamPlayers.length > 0 ? (
                    teamPlayers.map(tp => (
                      <View key={tp.id} style={styles.playerRow}>
                        <View style={styles.playerAvatarContainer}>
                          <Image
                            source={{ uri: tp.player?.photoUrl || 'https://png.pngtree.com/png-vector/20250523/ourlarge/pngtree-cricket-player-logo-vector-on-transparent-background-png-image_16363836.png' }}
                            style={styles.playerRowAvatar}
                          />
                          <View style={styles.playerRowJerseyBadge}>
                            <Text style={styles.playerRowJerseyText}>{tp.jerseyNumber}</Text>
                          </View>
                        </View>

                        <View style={styles.playerRowInfo}>
                          <Text style={styles.playerRowName} numberOfLines={1}>
                            {tp.player?.fullName}
                          </Text>
                          <Text style={styles.playerRowDob}>
                            DOB: {tp.player?.dateOfBirth?.split('T')[0] || 'N/A'}
                          </Text>
                        </View>

                        <View style={styles.playerRowActions}>
                          {tp.isCaptain && (
                            <View style={styles.captainBadgeRow}>
                              <MaterialCommunityIcons name="star" size={10} color="#92400E" />
                              <Text style={styles.captainTextRow}>CAPTAIN</Text>
                            </View>
                          )}
                          {!isGuest && (
                            <TouchableOpacity
                              style={styles.removePlayerBtn}
                              onPress={() => handleRemovePlayerFromTeam(tp)}
                            >
                              <MaterialCommunityIcons name="account-remove-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptySquad}>
                      <Text style={styles.noPlayersText}>No players registered in this squad.</Text>
                    </View>
                  )
                )}
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={!!editingTeam} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalInnerHeader}>
              <Text style={styles.modalTitle}>Update Team Info</Text>
              <TouchableOpacity onPress={() => { setEditingTeam(null); setNewLogoUri(null); }}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.editLogoPicker} onPress={pickTeamEditLogo}>
              {newLogoUri ? (
                <Image source={{ uri: newLogoUri }} style={styles.editLogoPreview} />
              ) : editingTeam?.logoUrl ? (
                <Image source={{ uri: editingTeam.logoUrl }} style={styles.editLogoPreview} />
              ) : (
                <View style={styles.editLogoPlaceholder}>
                  <Text style={styles.editLogoEmoji}>🛡️</Text>
                  <Text style={styles.editLogoBtnText}>Change Logo</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>TEAM NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter team name"
                value={editingTeam?.name || ''}
                onChangeText={v => setEditingTeam({ ...editingTeam, name: v })}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>SHORT NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="E.g. MI, CSK"
                value={editingTeam?.shortName || ''}
                onChangeText={v => setEditingTeam({ ...editingTeam, shortName: v })}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>HOME GROUND</Text>
              <TextInput
                style={styles.input}
                placeholder="E.g. Mumbai, Maharashtra"
                value={editingTeam?.homeGround || ''}
                onChangeText={v => setEditingTeam({ ...editingTeam, homeGround: v })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditingTeam(null)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitUpdateTeam} style={styles.modalSubmitBtn} disabled={isUpdating}>
                {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ActionSheet
        visible={actionSheetVisible}
        title={actionSheetTitle}
        options={actionSheetOptions}
        onCancel={() => setActionSheetVisible(false)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 25,
    backgroundColor: 'white',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 20,
    backgroundColor: '#f9ebfdff',
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
  teamCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  teamInfoMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginRight: 12,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teamLogo: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  teamShortName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginLeft: 8,
  },
  actionEmoji: {
    fontSize: 14,
  },
  expandIcon: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 5,
  },
  playersContainer: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  squadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  squadTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  playerAvatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  playerRowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  playerRowJerseyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1E293B',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
    paddingHorizontal: 2,
  },
  playerRowJerseyText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  playerRowInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  playerRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  playerRowDob: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  playerRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  captainBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  captainTextRow: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  removePlayerBtn: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  emptySquad: {
    padding: 20,
    alignItems: 'center',
  },
  noPlayersText: {
    fontStyle: 'italic',
    color: '#94A3B8',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 24,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  modalInnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeText: {
    fontSize: 18,
    color: '#64748B',
    padding: 5,
  },
  editLogoPicker: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editLogoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editLogoPlaceholder: {
    alignItems: 'center',
  },
  editLogoEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  editLogoBtnText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748B',
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 5,
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 14,
    elevation: 4,
  },
  modalCancelText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
  },
  modalSubmitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
