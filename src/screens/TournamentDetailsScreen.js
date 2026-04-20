import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTournamentById, getPointsTable } from '../api/tournaments';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const horizontalPadding = width * 0.05;

export default function TournamentDetailsScreen({ route, navigation }) {
  const { tournamentId, tournamentName } = route.params;
  const [tournament, setTournament] = useState(null);
  const [pointsTable, setPointsTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('standings'); // 'standings' | 'matches'

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [tData, pData] = await Promise.all([
        getTournamentById(tournamentId),
        getPointsTable(tournamentId)
      ]);
      setTournament(tData);
      setPointsTable(pData);
    } catch (e) {
      console.log('Failed to load tournament data', e);
    } finally {
      setLoading(false);
    }
  };

  const renderStandingItem = ({ item, index }) => {
    const isTop3 = index < 3;
    return (
      <View style={[styles.standingRow, isTop3 && styles.top3Row]}>
        <View style={styles.rankCol}>
          <View style={[styles.rankBadge, isTop3 && styles.rankBadgeTop]}>
            <Text style={[styles.rankText, isTop3 && styles.rankTextTop]}>{index + 1}</Text>
          </View>
        </View>
        <View style={styles.teamCol}>
          <Image
            source={{ uri: item.teamLogo || 'https://via.placeholder.com/40' }}
            style={styles.teamLogoSmall}
          />
          <Text style={styles.teamNameStandings} numberOfLines={1}>{item.teamName}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statCol}>{item.played}</Text>
          <Text style={styles.statCol}>{item.won}</Text>
          <Text style={[styles.statCol, styles.ptsText]}>{item.points}</Text>
        </View>
      </View>
    );
  };

  const renderMatchItem = ({ item }) => {
    const matchDate = new Date(item.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isCompleted = item.matchStatus === 'completed';

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => navigation.navigate('MatchDetails', { matchId: item.id })}
      >
        <View style={styles.matchHeader}>
          <View style={styles.dateBadge}>
            <MaterialCommunityIcons name="calendar" size={12} color="#94A3B8" />
            <Text style={styles.matchDate}>{matchDate}</Text>
          </View>
          <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusLive]}>
            <Text style={[styles.statusText, isCompleted ? styles.textCompleted : styles.textLive]}>
              {item.matchStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.matchTeamsRow}>
          <View style={styles.teamDetail}>
            <Text style={styles.matchTeamName} numberOfLines={1}>{item.homeTeam.name}</Text>
          </View>
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.teamDetail}>
            <Text style={styles.matchTeamName} numberOfLines={1}>{item.awayTeam.name}</Text>
          </View>
        </View>

        {item.resultMargin && (
          <View style={styles.resultContainer}>
            <MaterialCommunityIcons name="trophy-variant" size={14} color="#15803D" />
            <Text style={styles.resultText}>{item.winnerTeam?.name} won by {item.resultMargin}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !tournament) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.premiumHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{tournamentName || tournament?.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: tournament?.type === 'league' ? '#FFF7ED' : '#F0F9FF' }]}>
            <Text style={[styles.typeBadgeText, { color: tournament?.type === 'league' ? '#EA580C' : '#0EA5E9' }]}>
              {tournament?.type?.toUpperCase()} SERIES
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'standings' && styles.activeTab]}
            onPress={() => setActiveTab('standings')}
          >
            <Text style={[styles.tabText, activeTab === 'standings' && styles.activeTabText]}>Standings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
            onPress={() => setActiveTab('matches')}
          >
            <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>Fixtures</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'standings' ? (
        <View style={styles.tabContent}>
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={styles.rankColHeader}>#</Text>
              <Text style={styles.teamColHeader}>TEAM</Text>
              <View style={styles.statsHeaderRow}>
                <Text style={styles.statColHeader}>P</Text>
                <Text style={styles.statColHeader}>W</Text>
                <Text style={[styles.statColHeader, styles.ptsHeader]}>PTS</Text>
              </View>
            </View>
            <FlatList
              data={pointsTable}
              renderItem={renderStandingItem}
              keyExtractor={item => item.teamId}
              contentContainerStyle={styles.tableList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Waiting for match results...</Text>
                </View>
              }
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={tournament?.matches || []}
          renderItem={renderMatchItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.matchList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={50} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>No matches scheduled yet.</Text>
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
    paddingBottom: 15,
    paddingHorizontal: horizontalPadding,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tabContainer: {
    backgroundColor: 'white',
    paddingHorizontal: horizontalPadding,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 30,
  },
  tab: {
    paddingVertical: 15,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1E293B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
  },
  activeTabText: {
    color: '#1E293B',
  },
  tabContent: {
    flex: 1,
    padding: horizontalPadding,
  },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  rankColHeader: { width: 30, fontSize: 10, fontWeight: '900', color: '#94A3B8' },
  teamColHeader: { flex: 1, fontSize: 10, fontWeight: '900', color: '#94A3B8' },
  statsHeaderRow: { flexDirection: 'row' },
  statColHeader: { width: 35, textAlign: 'center', fontSize: 10, fontWeight: '900', color: '#94A3B8' },
  ptsHeader: { color: '#1E293B' },

  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  top3Row: {
    backgroundColor: 'rgba(240, 249, 255, 0.5)',
  },
  rankCol: { width: 30 },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeTop: { backgroundColor: '#1E293B' },
  rankText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  rankTextTop: { color: 'white' },

  teamCol: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  teamLogoSmall: { width: 32, height: 32, borderRadius: 8, marginRight: 10 },
  teamNameStandings: { fontSize: 14, fontWeight: '800', color: '#1E293B' },

  statsRow: { flexDirection: 'row' },
  statCol: { width: 35, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#64748B' },
  ptsText: { color: '#1E293B', fontWeight: '900' },

  matchList: { padding: horizontalPadding, paddingTop: 10 },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  matchDate: { fontSize: 11, color: '#64748B', fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusCompleted: { backgroundColor: '#F0FDF4' },
  statusLive: { backgroundColor: '#FEF2F2' },
  statusText: { fontSize: 9, fontWeight: '900' },
  textCompleted: { color: '#16A34A' },
  textLive: { color: '#EF4444' },

  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  teamDetail: { flex: 1, alignItems: 'center' },
  matchTeamName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  vsCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginHorizontal: 15 },
  vsText: { fontSize: 8, fontWeight: '900', color: '#94A3B8' },

  resultContainer: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  resultText: { fontSize: 12, fontWeight: '800', color: '#16A34A' },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { color: '#94A3B8', fontSize: 14, fontWeight: '700', marginTop: 10 }
});
