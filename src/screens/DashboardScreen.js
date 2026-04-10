import React, { useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMatches, deleteMatch } from '../api/matches';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const { logout, isGuest, user } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [])
  );

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await getMatches();
      setMatches(data);
    } catch (e) {
      console.log('Failed to load matches', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = (match) => {
    Alert.alert(
      'Delete Match',
      `Are you sure you want to delete the match between ${match.homeTeam.name} and ${match.awayTeam.name}? All scoring data will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(match.id);
              await deleteMatch(match.id);
              loadMatches();
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to delete match');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'live': return { bg: '#FEF2F2', text: '#EF4444', label: 'LIVE' };
      case 'completed': return { bg: '#F0FDF4', text: '#16A34A', label: 'COMPLETED' };
      case 'scheduled': return { bg: '#EFF6FF', text: '#2563EB', label: 'UPCOMING' };
      default: return { bg: '#F8FAFC', text: '#64748B', label: status?.toUpperCase() };
    }
  };

  const renderMatch = ({ item }) => {
    const status = getStatusStyle(item.matchStatus);
    const matchDate = new Date(item.matchDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return (
      <TouchableOpacity
        style={[styles.matchCard, { backgroundColor: status.bg }, deletingId === item.id && { opacity: 0.5 }]}
        onPress={() => navigation.navigate('MatchDetails', { matchId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            {item.matchStatus === 'live' && <View style={styles.liveDot} />}
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.matchDateText}>{matchDate}</Text>
            {!isGuest && (
              <TouchableOpacity onPress={() => handleDeleteMatch(item)} style={styles.deleteMatchBtn}>
                <Text style={styles.deleteEmoji}>🗑</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.teamsRow}>
          <View style={styles.teamInRow}>
            <View style={styles.logoContainer}>
              <Image
                style={styles.teamLogo}
                source={{ uri: item.homeTeam.logoUrl || 'https://via.placeholder.com/50' }}
              />
            </View>
            <Text style={styles.teamNameText} numberOfLines={1}>{item.homeTeam.name}</Text>
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.teamInRow}>
            <View style={styles.logoContainer}>
              <Image
                style={styles.teamLogo}
                source={{ uri: item.awayTeam.logoUrl || 'https://via.placeholder.com/50' }}
              />
            </View>
            <Text style={styles.teamNameText} numberOfLines={1}>{item.awayTeam.name}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.venueText}>📍 {item.venue || "TBD"}</Text>
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGreetingName = () => {
    if (isGuest) return 'Guest';
    return user?.fullName;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>{getGreeting()} {getGreetingName()}!</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          {!isGuest && (
            <TouchableOpacity onPress={() => navigation.navigate('PlayersList')} style={styles.circleBtn}>
              <Text style={styles.circleBtnEmoji}>👥</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={logout} style={[styles.circleBtn, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.circleBtnEmoji, { color: '#EF4444' }]}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !deletingId ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E293B" />
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, !isGuest && { paddingBottom: 120 }]}
          refreshing={loading}
          onRefresh={loadMatches}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏏</Text>
              <Text style={styles.emptyText}>No matches found</Text>
              <TouchableOpacity
                style={styles.createFirstBtn}
                onPress={() => navigation.navigate('CreateMatch')}
              >
                <Text style={styles.createFirstText}>Create Your First Match</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {!isGuest && (
        <View style={styles.fabContainer}>
          <View style={styles.fabBar}>
            <TouchableOpacity style={styles.fabIconBtn} onPress={() => navigation.navigate('CreateMatch')}>
              <View style={[styles.emojiCircle, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
                <Text style={styles.fabEmoji}>🏏</Text>
              </View>
              <Text style={styles.fabLabel}>New Match</Text>
            </TouchableOpacity>

            <View style={styles.verticalSeparator} />
            <TouchableOpacity style={styles.fabIconBtn} onPress={() => navigation.navigate('CreateTeam')}>
              <View style={[styles.emojiCircle, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                <Text style={styles.fabEmoji}>🛡️</Text>
              </View>
              <Text style={styles.fabLabel}>New Team</Text>
            </TouchableOpacity>

            <View style={styles.verticalSeparator} />
            <TouchableOpacity style={styles.fabIconBtn} onPress={() => navigation.navigate('AddPlayer')}>
              <View style={[styles.emojiCircle, { backgroundColor: 'rgba(255, 149, 0, 0.15)' }]}>
                <Text style={styles.fabEmoji}>👤</Text>
              </View>
              <Text style={styles.fabLabel}>New Player</Text>
            </TouchableOpacity>

            <View style={styles.verticalSeparator} />
            <TouchableOpacity style={styles.fabIconBtn} onPress={() => navigation.navigate('ViewTeams')}>
              <View style={[styles.emojiCircle, { backgroundColor: 'rgba(0, 122, 255, 0.15)' }]}>
                <Text style={styles.fabEmoji}>📂</Text>
              </View>
              <Text style={styles.fabLabel}>Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9ebfdff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerGreeting: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  circleBtnEmoji: {
    fontSize: 18,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteMatchBtn: {
    marginLeft: 10,
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F24444',
  },
  deleteEmoji: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  matchDateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  teamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  teamInRow: {
    alignItems: 'center',
    width: width * 0.3,
  },
  logoContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teamLogo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  teamNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  vsContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  cardFooter: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venueText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  createFirstBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  fabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  verticalSeparator: {
    width: 1,
    height: '100%',
    backgroundColor: '#F8FAFC',
  },
  fabIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  emojiCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  fabEmoji: {
    fontSize: 20,
  },
  fabLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  }
});


