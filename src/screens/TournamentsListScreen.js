import React, { useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTournaments } from '../api/tournaments';
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const horizontalPadding = width * 0.05;

export default function TournamentsListScreen({ navigation }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isGuest } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTournaments();
      setTournaments(data);
    } catch (e) {
      console.log('Failed to load tournaments', e);
    } finally {
      setLoading(false);
    }
  };

  const renderTournament = ({ item }) => {
    const startDate = item.startDate ? new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';
    const isLeague = item.type === 'league';

    return (
      <TouchableOpacity
        style={styles.tournamentCard}
        onPress={() => navigation.navigate('TournamentDetails', { tournamentId: item.id, tournamentName: item.name })}
      >
        <View style={styles.cardAccent} />
        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: isLeague ? '#FFF7ED' : '#F0F9FF' }]}>
              <MaterialCommunityIcons
                name={isLeague ? 'trophy-variant' : 'tournament'}
                size={28}
                color={isLeague ? '#EA580C' : '#0EA5E9'}
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.tournamentName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.tagRow}>
                <View style={styles.typeTag}>
                  <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.teamCountText}>{item.teams?.length || 0} TEAMS</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name="calendar-range" size={14} color="#94A3B8" />
              <Text style={styles.footerValue}>{startDate}</Text>
            </View>
            <View style={styles.footerItem}>
              <Entypo name="shield" size={12} color="#94A3B8" />
              <Text style={styles.footerValue}>Championship</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.premiumHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Tournaments</Text>
          <Text style={styles.headerSub}>Active Series & Leagues</Text>
        </View>
        {!isGuest && (
          <TouchableOpacity
            style={styles.addTournamentBtn}
            onPress={() => navigation.navigate('CreateTournament')}
          >
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={tournaments}
          renderItem={renderTournament}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadData}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="trophy-outline" size={60} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyText}>No Active Tournaments or Series</Text>
              <Text style={styles.emptySub}>{
                isGuest ?
                  'Login to create a tournament or series. OR wait for an admin to create one.' :
                  'Create a league or knockout series to start tracking points.'
              }</Text>
              {!isGuest && (
                <TouchableOpacity
                  style={styles.createMainBtn}
                  onPress={() => navigation.navigate('CreateTournament')}
                >
                  <Text style={styles.createMainBtnText}>Setup Tournament</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: horizontalPadding,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  addTournamentBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  list: {
    padding: horizontalPadding,
    paddingTop: 20,
  },
  tournamentCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardAccent: {
    width: 6,
    backgroundColor: '#1E293B',
  },
  cardMain: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  tournamentName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  teamCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    gap: 5,
  },
  footerValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#475569',
  },
  emptySub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  createMainBtn: {
    marginTop: 30,
    backgroundColor: '#1E293B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
    elevation: 4,
  },
  createMainBtnText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  }
});
