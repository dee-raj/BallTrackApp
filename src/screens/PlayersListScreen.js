import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Alert, Modal, Image } from 'react-native';

import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { deletePlayer, updatePlayer } from '../api/players';

// Memoized Helper function for age
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

const PlayerCard = React.memo(({ item, isGuest, onEdit, onDelete, isDeleting }) => {
  const playerAge = useMemo(() => calculateAge(item.dateOfBirth), [item.dateOfBirth]);
  const dobString = useMemo(() => item.dateOfBirth ? item.dateOfBirth.split('T')[0] : 'N/A', [item.dateOfBirth]);

  return (
    <View style={[styles.playerCard, isDeleting && { opacity: 0.5 }]}>
      <View style={styles.avatarContainer}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.fullName[0].toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{item.fullName}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>Age: {playerAge}</Text>
          <Text style={styles.detailText}>DOB: {dobString}</Text>
        </View>
      </View>

      {!isGuest && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
            <Text style={styles.actionEmoji}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(item)}>
            <Text style={[styles.actionEmoji, { color: '#EF4444' }]}>🗑</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default function PlayersListScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isGuest } = useContext(AuthContext);

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

  const handleDeletePlayer = useCallback((player) => {
    Alert.alert('Delete Player', `Are you sure you want to permanently delete ${player.fullName}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Permanently', style: 'destructive', onPress: async () => {
          try {
            setDeletingId(player.id);
            await deletePlayer(player.id);
            fetchPlayers();
          } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed deleting player');
          } finally {
            setDeletingId(null);
          }
        }
      }
    ]);
  }, [fetchPlayers]);

  const submitUpdatePlayer = useCallback(async () => {
    if (!editingPlayer?.fullName.trim()) return;
    try {
      setIsUpdating(true);
      await updatePlayer(editingPlayer.id, {
        fullName: editingPlayer.fullName,
        dateOfBirth: editingPlayer.dateOfBirth ?? null,
        email: editingPlayer.email ?? null,
        phone: editingPlayer.phone ?? null,
      });
      setEditingPlayer(null);
      fetchPlayers();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed updating player');
    } finally {
      setIsUpdating(false);
    }
  }, [editingPlayer, fetchPlayers]);

  const filteredPlayers = useMemo(() => {
    return players.filter(p =>
      p.fullName.toLowerCase().includes(search.toLowerCase())
    );
  }, [players, search]);

  const renderItem = useCallback(({ item }) => (
    <PlayerCard
      item={item}
      isGuest={isGuest}
      onEdit={setEditingPlayer}
      onDelete={handleDeletePlayer}
      isDeleting={deletingId === item.id}
    />
  ), [isGuest, handleDeletePlayer, deletingId]);

  if (loading && players.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E293B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Player Directory</Text>
        <Text style={styles.subtitle}>{players.length} Total Registered</Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchBar}
          placeholder="Search by name..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredPlayers}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={renderItem}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No players found</Text>
          </View>
        }
      />

      <Modal visible={!!editingPlayer} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Player Info</Text>
              <TouchableOpacity onPress={() => setEditingPlayer(null)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="E.g. Sachin Tendulkar"
                value={editingPlayer?.fullName || ''}
                onChangeText={v => setEditingPlayer({ ...editingPlayer, fullName: v })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DATE OF BIRTH</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={editingPlayer?.dateOfBirth || ''}
                onChangeText={v => setEditingPlayer({ ...editingPlayer, dateOfBirth: v })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 XXXXX XXXXX"
                value={editingPlayer?.phone || ''}
                maxLength={10}
                onChangeText={v => setEditingPlayer({ ...editingPlayer, phone: v })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="player@example.com"
                value={editingPlayer?.email || ''}
                onChangeText={v => setEditingPlayer({ ...editingPlayer, email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setEditingPlayer(null)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitUpdatePlayer}
                style={styles.modalSubmitBtn}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalSubmitText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 25,
    backgroundColor: '#c4dffaff',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  playerCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold'
  },
  info: {
    flex: 1
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B'
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 15,
  },
  adminActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginLeft: 8,
  },
  actionEmoji: {
    fontSize: 14,
    color: '#1E293B'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeModalText: {
    fontSize: 20,
    color: '#64748B',
    padding: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 5,
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalActions: {
    gap: 8,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: '#3a9c23ff',
    paddingVertical: 15,
    paddingHorizontal: 10,
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


