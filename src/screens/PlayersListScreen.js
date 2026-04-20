import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Alert, Modal, Image, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { deletePlayer, updatePlayer } from '../api/players';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../api/uploads';
import Toast from 'react-native-toast-message';
import ActionSheet from '../components/ActionSheet';

const { width } = Dimensions.get('window');
const horizontalPadding = width * 0.05;

const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const PlayerCard = React.memo(({ item, index, isGuest, onEdit, onDelete, isDeleting }) => {
  const playerAge = useMemo(() => calculateAge(item.dateOfBirth), [item.dateOfBirth]);

  return (
    <View style={[styles.playerCard, isDeleting && styles.dimmed]}>
      <View style={styles.cardMain}>
        <View style={styles.avatarWrapper}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{item.fullName[0].toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
        </View>

        <View style={styles.playerInfo}>
          <Text style={styles.playerName} numberOfLines={1}>{item.fullName}</Text>
          <View style={styles.statsStrip}>
            <View style={styles.statTag}>
              <MaterialCommunityIcons name="calendar-account" size={12} color="#64748B" />
              <Text style={styles.statTagText}>{playerAge} YRS</Text>
            </View>
            <View style={[styles.statTag, { backgroundColor: '#F0F9FF' }]}>
              <MaterialCommunityIcons name="phone" size={12} color="#0EA5E9" />
              <Text style={[styles.statTagText, { color: '#0EA5E9' }]}>{item.phone || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {!isGuest && (
          <View style={styles.actionColumn}>
            <TouchableOpacity style={[styles.circleAction, { backgroundColor: '#F0F9FF' }]} onPress={() => onEdit(item)}>
              <MaterialCommunityIcons name="pencil" size={16} color="#0EA5E9" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleAction, { backgroundColor: '#FEF2F2' }]} onPress={() => onDelete(item)}>
              <MaterialCommunityIcons name="trash-can" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

export default function PlayersListScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [newPhotoUri, setNewPhotoUri] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isGuest } = useContext(AuthContext);

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetTitle, setActionSheetTitle] = useState('');
  const [actionSheetOptions, setActionSheetOptions] = useState([]);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/players');
      setPlayers(response.data);
    } catch (e) {
      console.log('Error fetching global players', e);
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (!result.canceled && result.assets?.[0]?.uri) setNewPhotoUri(result.assets[0].uri);
  };

  const handleLibrary = async () => {
    setActionSheetVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) setNewPhotoUri(result.assets[0].uri);
  };

  const pickEditImage = () => {
    setActionSheetTitle('Update Profile Photo');
    setActionSheetOptions([
      { text: 'Camera', icon: 'camera', onPress: handleCamera },
      { text: 'Library', icon: 'image-multiple', onPress: handleLibrary }
    ]);
    setActionSheetVisible(true);
  };

  const handleDeletePlayer = useCallback((player) => {
    setActionSheetTitle(`Delete ${player.fullName}?`);
    setActionSheetOptions([
      {
        text: 'Delete Player Permanently',
        destructive: true,
        icon: 'account-remove-outline',
        onPress: async () => {
          setActionSheetVisible(false);
          try {
            setDeletingId(player.id);
            await deletePlayer(player.id);
            fetchPlayers();
            Toast.show({ type: 'success', text1: 'Success', text2: 'Player deleted successfully' });
          } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed deleting player' });
          } finally {
            setDeletingId(null);
          }
        }
      }
    ]);
    setActionSheetVisible(true);
  }, [fetchPlayers]);

  const submitUpdatePlayer = useCallback(async () => {
    if (!editingPlayer?.fullName?.trim()) return;
    try {
      setIsUpdating(true);
      let photoUrl = editingPlayer.photoUrl;
      if (newPhotoUri) {
        const uploadResult = await uploadImage(newPhotoUri);
        photoUrl = uploadResult.url;
      }
      await updatePlayer(editingPlayer.id, {
        fullName: editingPlayer.fullName,
        dateOfBirth: editingPlayer.dateOfBirth ?? null,
        email: editingPlayer.email ?? null,
        phone: editingPlayer.phone ?? null,
        photoUrl: photoUrl,
      });
      setEditingPlayer(null);
      setNewPhotoUri(null);
      fetchPlayers();
      Toast.show({ type: 'success', text1: 'Success', text2: 'Player updated successfully' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed updating player' });
    } finally {
      setIsUpdating(false);
    }
  }, [editingPlayer, newPhotoUri, fetchPlayers]);

  const filteredPlayers = useMemo(() => {
    return players.filter(p => p.fullName.toLowerCase().includes(search.toLowerCase()));
  }, [players, search]);

  const renderItem = useCallback(({ item, index }) => (
    <PlayerCard
      item={item}
      index={index}
      isGuest={isGuest}
      onEdit={setEditingPlayer}
      onDelete={handleDeletePlayer}
      isDeleting={deletingId === item.id}
    />
  ), [isGuest, handleDeletePlayer, deletingId]);

  return (
    <View style={styles.container}>
      <View style={styles.premiumHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Directory</Text>
          <Text style={styles.headerSub}>{players.length} TOTAL PLAYERS</Text>
        </View>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search players..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#CBD5E1"
          />
        </View>
      </View>

      {loading && players.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={filteredPlayers}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-search-outline" size={80} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>No Players Found</Text>
            </View>
          }
        />
      )}

      {/* UPDATE PLAYER MODAL */}
      <Modal visible={!!editingPlayer} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Player</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingPlayer(null);
                  setNewPhotoUri(null);
                }}
                style={styles.closeBtn}
              >
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.photoPicker} onPress={pickEditImage}>
              {newPhotoUri ? (
                <Image source={{ uri: newPhotoUri }} style={styles.selectedPhoto} />
              ) : editingPlayer?.photoUrl ? (
                <Image source={{ uri: editingPlayer.photoUrl }} style={styles.selectedPhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <MaterialCommunityIcons name="camera" size={32} color="#94A3B8" />
                  <Text style={styles.photoActionText}>Tap to Change</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.input}
                  value={editingPlayer?.fullName || ''}
                  onChangeText={v => setEditingPlayer({ ...editingPlayer, fullName: v })}
                  placeholder="Sachin Tendulkar"
                />
              </View>

              <View style={styles.inputGroupRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>DOB (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={editingPlayer?.dateOfBirth ? (editingPlayer.dateOfBirth.includes('T') ? editingPlayer.dateOfBirth.split('T')[0] : editingPlayer.dateOfBirth) : ''}
                    onChangeText={v => setEditingPlayer({ ...editingPlayer, dateOfBirth: v })}
                    placeholder="1990-01-01"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>PHONE</Text>
                  <TextInput
                    style={styles.input}
                    value={editingPlayer?.phone || ''}
                    onChangeText={v => setEditingPlayer({ ...editingPlayer, phone: v })}
                    placeholder="10 Digits"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  value={editingPlayer?.email || ''}
                  onChangeText={v => setEditingPlayer({ ...editingPlayer, email: v })}
                  placeholder="player@example.com"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => { setEditingPlayer(null); setNewPhotoUri(null); }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitUpdatePlayer}
                style={[styles.saveBtn, isUpdating && { opacity: 0.7 }]}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
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
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumHeader: {
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: '#e9f4ffff',
    paddingHorizontal: horizontalPadding,
    paddingBottom: 25,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    zIndex: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4a8554ff',
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 10,
  },
  list: {
    padding: horizontalPadding,
    paddingTop: 20,
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#c9e3fdff',
  },
  cardMain: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 15,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0EA5E9',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  statTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  statTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
  },
  actionColumn: {
    gap: 8,
  },
  circleAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dimmed: {
    opacity: 0.4,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#CBD5E1',
    marginTop: 15,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 25,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  photoPicker: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    overflow: 'hidden',
  },
  selectedPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoActionText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 6,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#1E293B',
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
  }
});

