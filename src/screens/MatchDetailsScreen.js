import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Modal, Alert, Image, Dimensions } from 'react-native';
import { getMatchScoreboard, recordToss, startInnings, declareInnings, deleteMatch } from '../api/matches';
import { AuthContext } from '../context/AuthContext';
import { socket, connectSocket, disconnectSocket, joinMatchRoom, leaveMatchRoom } from '../api/socket';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function MatchDetailsScreen({ route, navigation }) {
  const { matchId } = route.params;
  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isGuest } = React.useContext(AuthContext);
  const [showTossModal, setShowTossModal] = useState(false);
  const [tossWinner, setTossWinner] = useState(null);
  const [tossDecision, setTossDecision] = useState(null);

  useEffect(() => {
    loadScoreboard();

    // Realtime setup
    connectSocket();
    joinMatchRoom(matchId);

    const handleUpdate = () => {
      loadScoreboardSilently();
    };

    socket.on('ball:added', handleUpdate);
    socket.on('ball:removed', handleUpdate);
    socket.on('innings:end', handleUpdate);

    return () => {
      socket.off('ball:added', handleUpdate);
      socket.off('ball:removed', handleUpdate);
      socket.off('innings:end', handleUpdate);
      leaveMatchRoom(matchId);
      disconnectSocket();
    };
  }, [matchId]);

  const loadScoreboard = async () => {
    try {
      setLoading(true);
      await loadScoreboardSilently();
    } catch (e) {
      console.log('Failed to load scoreboard', e);
    } finally {
      setLoading(false);
    }
  };

  const loadScoreboardSilently = async () => {
    try {
      const data = await getMatchScoreboard(matchId);
      setScoreboard(data);
    } catch (e) {
      console.log('Silent load failed', e);
    }
  };

  if (loading || !scoreboard) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const match = scoreboard;
  const currentInnings = match?.innings?.find(i => i.status === 'in_progress') || (match?.innings?.length > 0 ? match.innings[match.innings.length - 1] : null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'live': return '#FF3B30';
      case 'tea_break': return '#FF9500';
      default: return '#007AFF';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.statusHeader, { backgroundColor: getStatusColor(match?.matchStatus) }]}>
        <Text style={styles.statusHeaderText}>{match?.matchStatus?.replace('_', ' ').toUpperCase()}</Text>
      </View>

      <View style={styles.headerCard}>
        <View style={styles.matchMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#64748B" />
            <Text style={styles.venueText}>{match?.venue || 'No Venue specified'}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar-month-outline" size={14} color="#64748B" />
            <Text style={styles.dateText}>{new Date(match?.matchDate).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.teamInfo}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: match?.homeTeam?.logoUrl || 'https://via.placeholder.com/100' }}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.fullTeamName}>{match?.homeTeam?.name}</Text>
          </View>

          <View style={styles.vsContainer}>
            <View style={styles.vsLine} />
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.vsLine} />
          </View>

          <View style={styles.teamInfo}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: match?.awayTeam?.logoUrl || 'https://via.placeholder.com/100' }}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.fullTeamName}>{match?.awayTeam?.name}</Text>
          </View>
        </View>

        {match?.tossWinnerId ? (
          <View style={styles.tossBadge}>
            <Text style={styles.tossBadgeText}>
              <FontAwesome name="gg-circle" size={14} color="#0369A1" /> Toss: {match?.tossWinnerId === match?.homeTeam?.id ? match?.homeTeam?.name : match?.awayTeam?.name} elected to {match?.tossDecision}
            </Text>
          </View>
        ) : (
          <View style={styles.tossBadgePending}>
            <Text style={styles.tossBadgeTextPending}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#64748B" /> Toss Pending
            </Text>
          </View>
        )}
      </View>

      {currentInnings && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Current Innings</Text>
            <View style={styles.inningsBadge}>
              <Text style={styles.inningsBadgeText}>Innings {currentInnings.inningsNumber}</Text>
            </View>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreDetail}>
              <Text style={styles.scoreMain}>{currentInnings.totalRuns}/{currentInnings.totalWickets}</Text>
              <Text style={styles.overSubText}>({currentInnings.oversBowled} Overs)</Text>
            </View>
            <View style={styles.crrContainer}>
              <Text style={styles.crrLabel}>CRR</Text>
              <Text style={styles.crrValue}>{(currentInnings.totalRuns / (parseFloat(currentInnings.oversBowled) || 1)).toFixed(2)}</Text>
            </View>
          </View>

          {match?.matchStatus === 'completed' && match?.result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultDescription}>
                <MaterialCommunityIcons name="trophy-outline" size={18} color="#15803D" />{' '}
                <Text style={styles.resultTitle}>Match Result</Text>
              </Text>
              <Text style={styles.resultDescription}>{match.result}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>Match Actions</Text>
      </View>

      <View style={styles.actionsGrid}>
        {!isGuest && (
          <>
            {(!match?.tossWinnerId) && (
              <TouchableOpacity
                style={[styles.actionCard, { borderLeftColor: '#007AFF' }]}
                onPress={() => setShowTossModal(true)}
              >
                <MaterialCommunityIcons name="cube-scan" size={24} color="#007AFF" style={styles.actionIcon} />
                <Text style={styles.actionLabel}>Record Toss</Text>
              </TouchableOpacity>
            )}

            {(match?.tossWinnerId && match?.matchStatus === 'scheduled') && (
              <TouchableOpacity
                style={[styles.actionCard, { borderLeftColor: '#f59e0b' }]}
                onPress={async () => {
                  try {
                    await startInnings({
                      matchId,
                      inningsNumber: 1,
                      battingTeamId: match.tossDecision === 'bat' ? match.tossWinnerId : (match.tossWinnerId === match.homeTeam?.id ? match.awayTeam?.id : match.homeTeam?.id),
                      bowlingTeamId: match.tossDecision === 'bat' ? (match.tossWinnerId === match.homeTeam?.id ? match.awayTeam?.id : match.homeTeam?.id) : match.tossWinnerId
                    });
                    loadScoreboard();
                  } catch (e) {
                    const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed starting innings');
                    Alert.alert('Error', message);
                  }
                }}
              >
                <MaterialCommunityIcons name="cricket" size={24} color="#f59e0b" style={styles.actionIcon} />
                <Text style={styles.actionLabel}>Start 1st Innings</Text>
              </TouchableOpacity>
            )}

            {match?.matchStatus === 'tea_break' && (
              <TouchableOpacity
                style={[styles.actionCard, { borderLeftColor: '#f59e0b' }]}
                onPress={async () => {
                  try {
                    const firstInnings = match.innings[0];
                    await startInnings({
                      matchId,
                      inningsNumber: 2,
                      battingTeamId: firstInnings.bowlingTeamId,
                      bowlingTeamId: firstInnings.battingTeamId
                    });
                    loadScoreboard();
                  } catch (e) {
                    Alert.alert('Error', e?.response?.data?.message || 'Failed starting 2nd innings');
                  }
                }}
              >
                <MaterialCommunityIcons name="cached" size={24} color="#f59e0b" style={styles.actionIcon} />
                <Text style={styles.actionLabel}>Start 2nd Innings</Text>
              </TouchableOpacity>
            )}

            {currentInnings && currentInnings.status === 'in_progress' && (
              <TouchableOpacity
                style={[styles.actionCard, { borderLeftColor: '#ef4444' }]}
                onPress={() => {
                  Alert.alert('Declare Innings', 'Are you sure you want to declare this innings?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Declare', style: 'destructive', onPress: async () => {
                        try {
                          await declareInnings(currentInnings.id);
                          loadScoreboard();
                        } catch (e) {
                          Alert.alert('Error', e?.response?.data?.message || 'Failed declaring innings');
                        }
                      }
                    }
                  ]);
                }}
              >
                <MaterialCommunityIcons name="stop-circle-outline" size={24} color="#ef4444" style={styles.actionIcon} />
                <Text style={styles.actionLabel}>Declare</Text>
              </TouchableOpacity>
            )}

            {(match?.matchStatus !== 'completed' && match?.matchStatus !== 'scheduled') && (
              <TouchableOpacity
                style={[styles.actionCard, { borderLeftColor: '#34C759', backgroundColor: '#ecfdf5' }]}
                onPress={() => navigation.navigate('MatchScoring', { matchId })}
              >
                <MaterialCommunityIcons name="chart-bar" size={24} color="#34C759" style={styles.actionIcon} />
                <Text style={styles.actionLabel}>Go to Scoring</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {(match?.matchStatus === 'completed' || currentInnings) && (
          <TouchableOpacity
            style={[styles.actionCard, { borderLeftColor: '#8b5cf6' }]}
            onPress={() => navigation.navigate('MatchReport', { matchId })}
          >
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#8b5cf6" style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Full Report</Text>
          </TouchableOpacity>
        )}

        {!isGuest && (
          <TouchableOpacity
            style={[styles.actionCard, { borderLeftColor: '#dc2626' }]}
            onPress={() => {
              Alert.alert('Delete Match', 'This action cannot be undone. Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                      await deleteMatch(matchId);
                      navigation.goBack();
                    } catch (e) {
                      Alert.alert('Error', e?.response?.data?.message || 'Cannot delete match');
                    }
                  }
                }
              ]);
            }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#dc2626" style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Delete Match</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showTossModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recording Toss 🪙</Text>

            <Text style={styles.modalSubtitle}>Who won the toss?</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.modalBtn, tossWinner === match?.homeTeam?.id && styles.modalBtnActive]}
                onPress={() => setTossWinner(match?.homeTeam?.id)}
              >
                <Text style={[styles.modalBtnText, tossWinner === match?.homeTeam?.id && styles.modalBtnTextActive]}>{match?.homeTeam?.name || "A"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, tossWinner === match?.awayTeam?.id && styles.modalBtnActive]}
                onPress={() => setTossWinner(match?.awayTeam?.id)}
              >
                <Text style={[styles.modalBtnText, tossWinner === match?.awayTeam?.id && styles.modalBtnTextActive]}>{match?.awayTeam?.name || "B"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Elected to?</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.modalBtn, tossDecision === 'bat' && styles.modalBtnActive]}
                onPress={() => setTossDecision('bat')}
              >
                <View style={styles.btnContent}>
                  <MaterialCommunityIcons name="cricket" size={18} color={tossDecision === 'bat' ? '#fff' : '#64748B'} />
                  <Text style={[styles.modalBtnText, tossDecision === 'bat' && styles.modalBtnTextActive]}>Bat</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, tossDecision === 'field' && styles.modalBtnActive]}
                onPress={() => setTossDecision('field')}
              >
                <View style={styles.btnContent}>
                  <MaterialCommunityIcons name="shield-outline" size={18} color={tossDecision === 'field' ? '#fff' : '#64748B'} />
                  <Text style={[styles.modalBtnText, tossDecision === 'field' && styles.modalBtnTextActive]}>Field</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowTossModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmit}
                onPress={async () => {
                  if (!tossWinner || !tossDecision) {
                    Alert.alert('Error', 'Select Winner and Decision');
                    return;
                  }
                  try {
                    await recordToss({
                      matchId, tossWinnerId: tossWinner, decision: tossDecision
                    });
                    setShowTossModal(false);
                    loadScoreboard();
                  } catch (e) {
                    const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed recording toss');
                    Alert.alert('Error', message);
                  }
                }}
              >
                <Text style={styles.modalSubmitText}>Confirm Toss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusHeader: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusHeaderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  matchMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  teamInfo: {
    alignItems: 'center',
    width: width * 0.35,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  teamLogo: {
    width: 60,
    height: 60,
  },
  fullTeamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  vsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vsLine: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  tossBadge: {
    backgroundColor: '#F0F9FF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tossBadgeText: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  tossBadgePending: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  tossBadgeTextPending: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    margin: 15,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  inningsBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inningsBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreDetail: {
    flex: 1,
  },
  scoreMain: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1E293B',
  },
  overSubText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  crrContainer: {
    alignItems: 'flex-end',
  },
  crrLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  crrValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionTitleContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 40) / 2,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderLeftWidth: 4,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderRadius: 14,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalBtnActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  modalBtnText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalBtnTextActive: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalSubmit: {
    flex: 2,
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
  },
  modalSubmitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

