import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList, Image, Dimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import { getMatchScoreboard, recordBall, undoBall, declareInnings } from '../api/matches';
import { getTeamPlayers } from '../api/players';

const { width } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MatchScoringScreen({ route, navigation }) {
  const { matchId } = route.params;
  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Player selection state
  const [batsmanId, setBatsmanId] = useState(null);
  const [nonStrikerId, setNonStrikerId] = useState(null);
  const [bowlerId, setBowlerId] = useState(null);

  const [battingTeamPlayers, setBattingTeamPlayers] = useState([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);

  // Modal state
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectionType, setSelectionType] = useState(null); // 'batsman' | 'nonStriker' | 'bowler'

  useEffect(() => {
    loadData();
  }, [matchId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getMatchScoreboard(matchId);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setScoreboard(data);

      const currentInnings = data?.innings?.find(i => i.status === 'in_progress') || data?.innings?.[data.innings.length - 1];
      if (currentInnings) {
        const battingPlayers = await getTeamPlayers(currentInnings.battingTeamId);
        const bowlingPlayers = await getTeamPlayers(currentInnings.bowlingTeamId);
        setBattingTeamPlayers(battingPlayers);
        setBowlingTeamPlayers(bowlingPlayers);
      }
    } catch (e) {
      console.log('Failed to load scoreboard', e);
      Alert.alert('Error', 'Could not load match data');
    } finally {
      setLoading(false);
    }
  };

  const postBallLogic = async (runsScored = 0, isWicket = false) => {
    const data = await getMatchScoreboard(matchId);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setScoreboard(data);
    
    const newInnings = data?.innings?.find(i => i.status === 'in_progress') || data?.innings?.[data.innings.length - 1];

    if (newInnings) {
      if (newInnings.status === 'completed') {
        Alert.alert('Innings Completed!', 'The target has been reached or the overs are finished.', [
            { text: 'View Report', onPress: () => navigation.navigate('MatchReport', { matchId }) },
            { text: 'OK' }
        ]);
        return;
      }

      let currentStriker = batsmanId;
      let currentNonStriker = nonStrikerId;

      if (runsScored % 2 !== 0) {
        currentStriker = nonStrikerId;
        currentNonStriker = batsmanId;
      }

      const isOverComplete = newInnings.legalBalls > 0 && newInnings.legalBalls % 6 === 0;
      if (isOverComplete) {
        const temp = currentStriker;
        currentStriker = currentNonStriker;
        currentNonStriker = temp;
      }

      setBatsmanId(currentStriker);
      setNonStrikerId(currentNonStriker);

      if (isWicket) {
        setBatsmanId(null);
        openPlayerSelection('batsman');
      } else if (isOverComplete) {
        setBowlerId(null);
        openPlayerSelection('bowler');
      }
    }
  };

  const currentInnings = scoreboard?.innings?.find(i => i.status === 'in_progress') || scoreboard?.innings?.[scoreboard?.innings?.length - 1];

  const handleRecordRuns = async (runs) => {
    if (!currentInnings) {
      Alert.alert('Error', 'No active innings');
      return;
    }
    if (!batsmanId || !nonStrikerId || !bowlerId) {
      Alert.alert('Missing Players', 'Please select Striker, Non-Striker, and Bowler first!');
      return;
    }

    try {
      setSubmitting(true);
      await recordBall({
        matchId: matchId,
        inningsId: currentInnings.id,
        batsmanPlayerId: batsmanId,
        nonStrikerPlayerId: nonStrikerId,
        bowlerPlayerId: bowlerId,
        runsOffBat: runs,
        extraType: 'normal',
        extraRuns: 0
      });
      await postBallLogic(runs, false);
    } catch (e) {
      Alert.alert('Error recording ball', e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordExtra = async (extraType) => {
    if (!currentInnings) return;
    if (!batsmanId || !nonStrikerId || !bowlerId) {
      Alert.alert('Missing Players', 'Please select Striker, Non-Striker, and Bowler first!');
      return;
    }
    try {
      setSubmitting(true);
      await recordBall({
        matchId: matchId,
        inningsId: currentInnings.id,
        batsmanPlayerId: batsmanId,
        nonStrikerPlayerId: nonStrikerId,
        bowlerPlayerId: bowlerId,
        runsOffBat: 0,
        extraType: extraType,
        extraRuns: extraType === 'wide' || extraType === 'no_ball' ? 0 : 1
      });
      await postBallLogic(extraType === 'wide' || extraType === 'no_ball' ? 0 : 1, false);
    } catch (e) {
      Alert.alert('Error recording extra', e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordWicket = async () => {
    if (!currentInnings) return;
    if (!batsmanId || !nonStrikerId || !bowlerId) {
      Alert.alert('Missing Players', 'Please select Striker, Non-Striker, and Bowler first!');
      return;
    }
    try {
      setSubmitting(true);
      await recordBall({
        matchId: matchId,
        inningsId: currentInnings.id,
        batsmanPlayerId: batsmanId,
        nonStrikerPlayerId: nonStrikerId,
        bowlerPlayerId: bowlerId,
        runsOffBat: 0,
        extraType: 'normal',
        isWicket: true,
        wicketType: 'bowled'
      });
      await postBallLogic(0, true);
    } catch (e) {
      Alert.alert('Error recording wicket', e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndoBall = async () => {
    if (!currentInnings) return;
    try {
      setSubmitting(true);
      await undoBall(matchId);
      await loadData();
    } catch (e) {
      Alert.alert('Undo Failed', e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclare = () => {
    if (!currentInnings) return;
    Alert.alert('Declare Innings', 'Are you sure you want to end this innings manually?', [
        { text: 'Cancel', style: 'cancel' },
        { 
            text: 'Yes, Declare', 
            onPress: async () => {
                try {
                    await declareInnings(currentInnings.id);
                    loadData();
                } catch(e) {
                    Alert.alert('Error', 'Failed to declare innings');
                }
            }
        }
    ]);
  };

  const openPlayerSelection = (type) => {
    setSelectionType(type);
    setShowPlayerModal(true);
  };

  const handleSelectPlayer = (playerId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectionType === 'batsman') setBatsmanId(playerId);
    else if (selectionType === 'nonStriker') setNonStrikerId(playerId);
    else if (selectionType === 'bowler') setBowlerId(playerId);
    setShowPlayerModal(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1E293B" />
      </View>
    );
  }

  const getPlayerName = (id, teamPlayers) => {
    if (!id) return 'Select Player';
    const playerRecord = teamPlayers.find(p => p.playerId === id);
    return playerRecord ? playerRecord.player.fullName : 'Unknown';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {currentInnings ? (
          <View style={styles.scoreBanner}>
            <View style={styles.scoreHeader}>
              <View style={styles.battingLogoSmallContainer}>
                <Image
                  source={{ uri: currentInnings.battingTeam?.logoUrl || 'https://via.placeholder.com/50' }}
                  style={styles.battingLogoSmall}
                />
              </View>
              <Text style={styles.battingTeamName} numberOfLines={1}>
                {currentInnings.battingTeam?.name}
              </Text>
              <View style={styles.liveIndicator}>
                <View style={[styles.liveDot, { backgroundColor: currentInnings.status === 'completed' ? '#94A3B8' : '#EF4444' }]} />
                <Text style={[styles.liveText, { color: currentInnings.status === 'completed' ? '#94A3B8' : '#EF4444' }]}>
                    {currentInnings.status === 'completed' ? 'FINISH' : 'LIVE'}
                </Text>
              </View>
            </View>

            <View style={styles.scoreMainRow}>
              <Text style={styles.scoreMainText}>
                {currentInnings.totalRuns}/{currentInnings.totalWickets}
              </Text>
              <View style={styles.overBadge}>
                <Text style={styles.overBadgeText}>{currentInnings.oversBowled} OVERS</Text>
              </View>
            </View>
            
            {currentInnings.status !== 'completed' && scoreboard?.matchStatus !== 'finished' && (
                <View style={styles.targetSection}>
                    <Text style={styles.targetText}>
                        RR: {(currentInnings.totalRuns / (Math.max(1, currentInnings.legalBalls) / 6)).toFixed(2)}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('MatchReport', { matchId })}>
                        <Text style={styles.reportLink}>Full Stats 📈</Text>
                    </TouchableOpacity>
                </View>
            )}
          </View>
        ) : (
          <View style={styles.scoreBanner}>
            <Text style={styles.noInningsText}>No active innings</Text>
          </View>
        )}

        {currentInnings && currentInnings.status !== 'completed' && (
          <View style={styles.activePlayersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Field Operations</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={handleUndoBall} style={styles.utilityBtn}>
                  <Text style={styles.utilityBtnText}>↩ UNDO</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeclare} style={[styles.utilityBtn, { borderColor: '#EF4444' }]}>
                  <Text style={[styles.utilityBtnText, { color: '#EF4444' }]}>DECLARE</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.playerCardsRow}>
              <TouchableOpacity
                style={[styles.playerCard, batsmanId && styles.playerCardActive]}
                onPress={() => openPlayerSelection('batsman')}
              >
                <Text style={styles.playerRoleLabel}>STRIKER</Text>
                <Text style={styles.playerCardName} numberOfLines={1}>
                  {getPlayerName(batsmanId, battingTeamPlayers)}
                </Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.editEmoji}>🏏</Text>
                    <Text style={styles.tapToChange}>Tap to select</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playerCard, nonStrikerId && styles.playerCardActive]}
                onPress={() => openPlayerSelection('nonStriker')}
              >
                <Text style={styles.playerRoleLabel}>NON-STRIKER</Text>
                <Text style={styles.playerCardName} numberOfLines={1}>
                  {getPlayerName(nonStrikerId, battingTeamPlayers)}
                </Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.editEmoji}>👤</Text>
                    <Text style={styles.tapToChange}>Tap to select</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.bowlerCard, bowlerId && styles.bowlerCardActive]}
              onPress={() => openPlayerSelection('bowler')}
            >
              <View style={styles.bowlerInfo}>
                <Text style={styles.playerRoleLabel}>CURRENT BOWLER</Text>
                <Text style={styles.bowlerName} numberOfLines={1}>
                  {getPlayerName(bowlerId, bowlingTeamPlayers)}
                </Text>
              </View>
              <View style={styles.bowlerIconContainer}>
                <Text style={styles.bowlerEmoji}>🎾</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.scoringPad}>
          <View style={styles.padRow}>
            {[0, 1, 2, 3].map(runs => (
              <TouchableOpacity
                key={runs}
                style={styles.numpadBtn}
                onPress={() => handleRecordRuns(runs)}
                disabled={submitting || currentInnings?.status === 'completed'}
              >
                <Text style={styles.numpadText}>{runs}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.padRow}>
            <TouchableOpacity style={[styles.numpadBtn, styles.boundaryBtn]} onPress={() => handleRecordRuns(4)} disabled={submitting || currentInnings?.status === 'completed'}>
              <Text style={[styles.numpadText, { color: '#0EA5E9' }]}>4</Text>
              <Text style={styles.padSubText}>FOUR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.numpadBtn, styles.boundaryBtn]} onPress={() => handleRecordRuns(6)} disabled={submitting || currentInnings?.status === 'completed'}>
              <Text style={[styles.numpadText, { color: '#8B5CF6' }]}>6</Text>
              <Text style={styles.padSubText}>SIX</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.numpadBtn, styles.extraBtn]} onPress={() => handleRecordExtra('wide')} disabled={submitting || currentInnings?.status === 'completed'}>
              <Text style={[styles.extraText, { color: '#D97706' }]}>WD</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.numpadBtn, styles.extraBtn]} onPress={() => handleRecordExtra('no_ball')} disabled={submitting || currentInnings?.status === 'completed'}>
              <Text style={[styles.extraText, { color: '#D97706' }]}>NB</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.padRow, { gap: 8 }]}>
            <TouchableOpacity style={[styles.numpadBtn, styles.extraBtn]} onPress={() => handleRecordExtra('leg_bye')} disabled={submitting || currentInnings?.status === 'completed'}>
              <Text style={styles.extraText}>LB</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.numpadBtn, styles.extraBtn]} onPress={() => handleRecordExtra('bye')} disabled={submitting || currentInnings?.status === 'completed'}>
              <Text style={styles.extraText}>BYE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.numpadBtn, styles.wicketBtn]} onPress={handleRecordWicket} disabled={submitting || currentInnings?.status === 'completed'}>
              <Text style={styles.wicketBtnText}>WICKET</Text>
              <Text style={styles.wicketSubText}>FALL OUT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {currentInnings?.status === 'completed' && (
             <TouchableOpacity 
                style={styles.fullReportBtn} 
                onPress={() => navigation.navigate('MatchReport', { matchId })}
            >
                <Text style={styles.fullReportText}>View Detailed Full Report 📊</Text>
            </TouchableOpacity>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showPlayerModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {selectionType === 'bowler' ? 'Bowler' : 'Batsman'}</Text>
              <TouchableOpacity onPress={() => setShowPlayerModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectionType === 'bowler' ? bowlingTeamPlayers : battingTeamPlayers}
              keyExtractor={(item) => item.playerId}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.playerListItem,
                    (batsmanId === item.playerId || nonStrikerId === item.playerId || bowlerId === item.playerId) && styles.playerListItemDisabled
                  ]}
                  onPress={() => handleSelectPlayer(item.playerId)}
                  disabled={batsmanId === item.playerId || nonStrikerId === item.playerId || bowlerId === item.playerId}
                >
                  <View style={styles.playerListItemInfo}>
                    <View style={styles.jerseyCircle}>
                      <Text style={styles.playerListNumber}>{item.jerseyNumber || '?'}</Text>
                    </View>
                    <View>
                        <Text style={styles.playerListName}>{item.player.fullName}</Text>
                        <Text style={styles.playerListRole}>{item.isCaptain ? 'Captain' : 'Player'}</Text>
                    </View>
                  </View>
                  {(batsmanId === item.playerId || nonStrikerId === item.playerId || bowlerId === item.playerId) && (
                    <View style={styles.onFieldBadge}>
                      <Text style={styles.onFieldText}>ON FIELD</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
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
    justifyContent: 'center',
    alignItems: 'center'
  },
  scoreBanner: {
    backgroundColor: '#1E293B',
    padding: 25,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  battingLogoSmallContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  battingLogoSmall: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  battingTeamName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scoreMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreMainText: {
    color: 'white',
    fontSize: 56,
    fontWeight: '900',
  },
  overBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  overBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  targetSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 15,
    marginTop: 5,
  },
  targetText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reportLink: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
  },
  noInningsText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  activePlayersSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  utilityBtn: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  utilityBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
  },
  playerCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  playerCard: {
    width: (width - 55) / 2,
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerCardActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  playerRoleLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  playerCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editEmoji: {
    fontSize: 20,
  },
  tapToChange: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  bowlerCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bowlerCardActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  bowlerName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
  },
  bowlerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bowlerEmoji: {
    fontSize: 24,
  },
  scoringPad: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  padRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  numpadBtn: {
    width: (width - 70) / 4,
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  boundaryBtn: {
    backgroundColor: '#F8FAFC',
  },
  numpadText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
  },
  padSubText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#94A3B8',
    marginTop: 2,
  },
  extraBtn: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  extraText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#64748B',
  },
  wicketBtn: {
    flex: 2,
    aspectRatio: 2.38,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wicketBtnText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
  },
  wicketSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9,
    fontWeight: 'bold',
  },
  fullReportBtn: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
  },
  fullReportText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 30,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 15,
  },
  closeModalText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
  },
  playerListItem: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerListItemDisabled: {
    opacity: 0.35,
  },
  playerListItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jerseyCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  playerListNumber: {
    fontWeight: '900',
    color: '#1E293B',
    fontSize: 16,
  },
  playerListName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  playerListRole: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  onFieldBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  onFieldText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0EA5E9',
  },
});

