import React, { useState, useContext, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions, Alert, Platform, Pressable, Modal, TouchableWithoutFeedback } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMatches, deleteMatch } from '../api/matches';
import { AuthContext } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const horizontalPadding = width * 0.05;

export default function DashboardScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const { isGuest, user, logout } = useContext(AuthContext);

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
      console.log(e.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = (match) => {
    Alert.alert(
      'Delete Match',
      `Delete match: ${match.homeTeam.name} vs ${match.awayTeam.name}?`,
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
              Alert.alert('Error', 'Failed to delete match');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const renderMatch = ({ item }) => {
    const isLive = item.matchStatus === 'live' || item.matchStatus === 'in_progress' || item.matchStatus === 'second_innings';
    const isCompleted = item.matchStatus === 'completed';
    const matchDate = new Date(item.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Linking scores to specific teams regardless of batting order
    const homeInnings = item.innings?.find(i => i.battingTeamId === item.homeTeamId || i.battingTeamId === item.homeTeam?.id);
    const awayInnings = item.innings?.find(i => i.battingTeamId === item.awayTeamId || i.battingTeamId === item.awayTeam?.id);

    return (
      <TouchableOpacity
        style={[styles.matchCard, deletingId === item.id && styles.dimmed]}
        onPress={() => navigation.navigate('MatchDetails', { matchId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, isLive ? styles.statusLive : (isCompleted ? styles.statusCompleted : styles.statusUpcoming)]}>
            {isLive && <View style={styles.liveDot} />}
            <Text style={[styles.statusText, isLive ? styles.textLive : (isCompleted ? styles.textCompleted : styles.textUpcoming)]}>
              {isLive ? 'LIVE' : (isCompleted ? 'COMPLETED' : 'UPCOMING')}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.matchDateText}>{matchDate}</Text>
            {!isGuest && (
              <TouchableOpacity onPress={() => handleDeleteMatch(item)} style={styles.deleteBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.matchMain}>
          <View style={styles.teamContainer}>
            <Image
              source={{ uri: item.homeTeam.logoUrl || 'https://via.placeholder.com/60' }}
              style={styles.teamBadge}
            />
            <Text style={styles.teamName} numberOfLines={1}>{item.homeTeam.shortName}</Text>
            {homeInnings && (
              <Text style={styles.scoreText}>{homeInnings.totalRuns}/{homeInnings.totalWickets}</Text>
            )}
          </View>

          <View style={styles.vsCenter}>
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
          </View>

          <View style={styles.teamContainer}>
            <Image
              source={{ uri: item.awayTeam.logoUrl || 'https://via.placeholder.com/60' }}
              style={styles.teamBadge}
            />
            <Text style={styles.teamName} numberOfLines={1}>{item.awayTeam.shortName}</Text>
            {awayInnings && (
              <Text style={styles.scoreText}>{awayInnings.totalRuns}/{awayInnings.totalWickets}</Text>
            )}
          </View>
        </View>

        {item.resultMargin && (
          <View style={styles.resultPill}>
            <MaterialCommunityIcons name="trophy-outline" size={12} color="#15803D" />
            <Text style={styles.resultPillText}>
              {item.winnerTeam?.name} won by {item.resultMargin}
            </Text>
          </View>
        )}


        <View style={styles.venueRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="#94A3B8" />
          <Text style={styles.venueText}>{item.venue || 'No Venue'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.premiumHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Hello, {isGuest ? 'Cricket Fan' : user?.fullName}</Text>
          <Text style={styles.dashboardTitle}>Match Center</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => setMenuVisible(true)}
          >
            <MaterialCommunityIcons name="dots-vertical" size={22} color="#475569" />
          </Pressable>
        </View>
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate('TournamentsList');
                    }}
                  >
                    <MaterialCommunityIcons name="trophy-variant" size={18} color="#0EA5E9" />
                    <Text style={styles.menuItemText}>Tournaments</Text>
                  </TouchableOpacity>

                  {!isGuest && (<>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        navigation.navigate('PlayersList');
                      }}
                    >
                      <MaterialCommunityIcons name="account-group" size={18} color="#475569" />
                      <Text style={styles.menuItemText}>Players</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        navigation.navigate('Profile');
                      }}
                    >
                      <MaterialCommunityIcons name="account-circle" size={18} color="#8B5CF6" />
                      <Text style={styles.menuItemText}>Profile</Text>
                    </TouchableOpacity>

                  </>)}
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate('ViewTeams')
                    }}
                  >
                    <MaterialCommunityIcons name="database-outline" size={18} color="#475569" />
                    <Text style={styles.menuItemText}>Teams Directory</Text>
                  </TouchableOpacity>

                  {isGuest && (
                    <>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          setMenuVisible(false);
                          navigation.navigate('HelpSupport');
                        }}
                      >
                        <MaterialCommunityIcons name="help-circle" size={18} color="#8B5CF6" />
                        <Text style={styles.menuItemText}>Help & Support</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          setMenuVisible(false);
                          logout();
                        }}
                      >
                        <MaterialCommunityIcons name="login" size={18} color="#8B5CF6" />
                        <Text style={styles.menuItemText}>Login</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>

      {loading && !deletingId ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, !isGuest && styles.listWithFab]}
          onRefresh={loadMatches}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cricket" size={80} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>No Matches Found</Text>
              <Text style={styles.emptySub}>Start by creating your first match or series.</Text>
            </View>
          }
        />
      )}

      {(!isGuest && user?.role === 'admin') && (
        <View style={styles.navBarContainer}>
          <View style={styles.navBar}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CreateMatch')}>
              <View style={[styles.navIconBg, { backgroundColor: '#E0F2FE' }]}>
                <MaterialCommunityIcons name="plus" size={24} color="#0EA5E9" />
              </View>
              <Text style={styles.navLabel}>Match</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CreateTeam')}>
              <View style={[styles.navIconBg, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="shield-plus-outline" size={20} color="#16A34A" />
              </View>
              <Text style={styles.navLabel}>Team</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AddPlayer')}>
              <View style={[styles.navIconBg, { backgroundColor: '#FEF9C3' }]}>
                <MaterialCommunityIcons name="account-plus-outline" size={20} color="#CA8A04" />
              </View>
              <Text style={styles.navLabel}>Player</Text>
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
    backgroundColor: '#F1F5F9', // Slightly darker background to make cards pop
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 25,
    paddingHorizontal: horizontalPadding,
    backgroundColor: '#bcdeffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#815983ff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#aaeaffff',
  },
  dropdownMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 75,
    right: horizontalPadding,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 24,
    minWidth: 200,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 90,
    paddingRight: horizontalPadding,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  list: {
    padding: horizontalPadding,
  },
  listWithFab: {
    paddingBottom: 120,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9ff',
  },
  dimmed: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusLive: { backgroundColor: '#FEF2F2' },
  statusCompleted: { backgroundColor: '#F0FDF4' },
  statusUpcoming: { backgroundColor: '#F8FAFC' },
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
  textLive: { color: '#EF4444' },
  textCompleted: { color: '#16A34A' },
  textUpcoming: { color: '#94A3B8' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchDateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  deleteBtn: {
    marginLeft: 8,
    padding: 4,
  },
  matchMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamBadge: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#334155',
  },
  vsCenter: {
    paddingHorizontal: 15,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
  },
  resultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 12,
  },
  resultPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    marginLeft: 6,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  venueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#475569',
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  navBarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#185505ff',
    borderRadius: 24,
    padding: 10,
    justifyContent: 'space-around',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  navItem: {
    alignItems: 'center',
    width: width * 0.2,
  },
  navIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  }
});
