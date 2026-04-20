import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  Alert, Modal, FlatList, Image,
  Dimensions, LayoutAnimation
} from 'react-native';
import { getMatchScoreboard, recordBall, undoBall, declareInnings, getMatchPerformance } from '../api/matches';
import { getTeamPlayers } from '../api/players';
import { socket, connectSocket, disconnectSocket, joinMatchRoom, leaveMatchRoom } from '../api/socket';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ActionSheet from '../components/ActionSheet';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const WICKET_TYPES = [
  { key: 'bowled', label: 'Bowled', icon: 'cricket' },
  { key: 'caught', label: 'Caught', icon: 'hand-back-right-outline' },
  { key: 'lbw', label: 'LBW', icon: 'human-male-height-variant' },
  { key: 'run_out', label: 'Run Out', icon: 'run-fast' },
  { key: 'stumped', label: 'Stumped', icon: 'hand-pointing-right' },
  { key: 'hit_wicket', label: 'Hit Wicket', icon: 'flash-outline' },
  { key: 'handled_ball', label: 'Handled Ball', icon: 'hand-front-right-outline' },
  { key: 'obstructing_field', label: 'Obstructing Field', icon: 'cancel' },
  { key: 'timed_out', label: 'Timed Out', icon: 'timer-outline' },
];

const FIELDER_NEEDED = ['caught', 'run_out', 'stumped'];

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

  // Dismissed batsmen (player IDs that are out this innings)
  const [dismissedPlayerIds, setDismissedPlayerIds] = useState([]);

  // Live performance stats
  const [perfData, setPerfData] = useState(null); // raw from API

  // Player selector modal
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectionType, setSelectionType] = useState(null); // 'batsman'|'nonStriker'|'bowler'

  // Wicket modal state
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [selectedWicketType, setSelectedWicketType] = useState(null);
  const [selectedFielderId, setSelectedFielderId] = useState(null);
  const [showFielderPicker, setShowFielderPicker] = useState(false);

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetTitle, setActionSheetTitle] = useState('');
  const [actionSheetOptions, setActionSheetOptions] = useState([]);

  useEffect(() => {
    loadData();

    // Realtime setup
    connectSocket();
    joinMatchRoom(matchId);

    const handleBallAdded = (data) => {
      // Update scoreboard visually
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setScoreboard(data.match ? { ...data.match, innings: [data.innings] } : null);
      // Full refresh to ensure consistency with performances
      loadDataSilently();
    };

    const handleBallRemoved = (data) => {
      loadDataSilently();
    };

    const handleInningsEnd = (data) => {
      loadDataSilently();
    };

    socket.on('ball:added', handleBallAdded);
    socket.on('ball:removed', handleBallRemoved);
    socket.on('innings:end', handleInningsEnd);

    return () => {
      socket.off('ball:added', handleBallAdded);
      socket.off('ball:removed', handleBallRemoved);
      socket.off('innings:end', handleInningsEnd);
      leaveMatchRoom(matchId);
      disconnectSocket();
    };
  }, [matchId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadDataSilently();
    } catch (e) {
      console.log('Failed to load scoreboard', e);
      const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed loading scoreboard');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message
      })
    } finally {
      setLoading(false);
    }
  };

  const loadDataSilently = async () => {
    try {
      const data = await getMatchScoreboard(matchId);
      setScoreboard(data);

      const currentInnings = data?.innings?.find(i => i.status === 'in_progress')
        || (data?.innings?.length > 0 ? data.innings[data.innings.length - 1] : null);
      if (currentInnings) {
        const battingPlayers = await getTeamPlayers(currentInnings.battingTeamId);
        const bowlingPlayers = await getTeamPlayers(currentInnings.bowlingTeamId);
        setBattingTeamPlayers(battingPlayers);
        setBowlingTeamPlayers(bowlingPlayers);
      }
      await refreshPerformance(data);
    } catch (e) {
      console.log('Silent load failed', e);
    }
  };

  const refreshPerformance = async (sbData) => {
    try {
      const perf = await getMatchPerformance(matchId);
      setPerfData(perf);
      // Identify the active innings
      const sb = sbData || scoreboard;
      const activeInnings = sb?.innings?.find(i => i.status === 'in_progress')
        || sb?.innings?.[sb.innings.length - 1];
      if (!activeInnings) return;
      const inningPerf = perf.performances?.find(p => p.inningsNumber === activeInnings.inningsNumber);
      if (inningPerf) {
        setDismissedPlayerIds(inningPerf.dismissedPlayerIds || []);
      }
    } catch (_) {
      // Non-fatal: perf data may not exist yet
    }
  };

  const getCurrentInningPerf = () => {
    if (!perfData || !scoreboard) return null;
    const activeInnings = scoreboard.innings?.find(i => i.status === 'in_progress')
      || scoreboard.innings?.[scoreboard.innings.length - 1];
    return perfData.performances?.find(p => p.inningsNumber === activeInnings?.inningsNumber);
  };

  const getBatsmanStats = (playerId) => {
    const inningPerf = getCurrentInningPerf();
    return inningPerf?.battingScorecard?.find(b => b.playerId === playerId) || null;
  };

  const getBowlerStats = (playerId) => {
    const inningPerf = getCurrentInningPerf();
    return inningPerf?.bowlingScorecard?.find(b => b.playerId === playerId) || null;
  };

  const postBallLogic = async (runsScored = 0, isWicket = false, sbData = null) => {
    const data = sbData || await getMatchScoreboard(matchId);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setScoreboard(data);

    const newInnings = data?.innings?.find(i => i.status === 'in_progress')
      || data?.innings?.[data.innings.length - 1];

    if (newInnings) {
      if (newInnings.status === 'completed') {
        await refreshPerformance(data);
        setActionSheetTitle('Innings Completed!');
        setActionSheetOptions([
          { text: 'View Full Match Report', icon: 'file-document-outline', onPress: () => { setActionSheetVisible(false); navigation.navigate('MatchReport', { matchId }); } },
          { text: 'Back to Dashboard', icon: 'home-outline', onPress: () => { setActionSheetVisible(false); navigation.navigate('Dashboard'); } }
        ]);
        setActionSheetVisible(true);
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

      await refreshPerformance(data);

      if (isWicket) {
        setBatsmanId(null);
        openPlayerSelection('batsman');
      } else if (isOverComplete) {
        setBowlerId(null);
        openPlayerSelection('bowler');
      }
    }
  };

  const currentInnings = scoreboard?.innings?.find(i => i.status === 'in_progress')
    || scoreboard?.innings?.[scoreboard?.innings?.length - 1];

  // ─── Run handler ──────────────────────────────────────────────────────────
  const handleRecordRuns = async (runs) => {
    if (!currentInnings) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No active innings'
      });
      return;
    }
    if (!batsmanId || !nonStrikerId || !bowlerId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select Striker, Non-Striker, and Bowler first!'
      });
      return;
    }
    try {
      setSubmitting(true);
      await recordBall({
        matchId, inningsId: currentInnings.id,
        batsmanPlayerId: batsmanId, nonStrikerPlayerId: nonStrikerId, bowlerPlayerId: bowlerId,
        runsOffBat: runs, extraType: 'normal', extraRuns: 0,
      });
      await postBallLogic(runs, false);
    } catch (e) {
      const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed recording ball');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message
      });
    } finally { setSubmitting(false); }
  };

  // ─── Extra handler ────────────────────────────────────────────────────────
  const handleRecordExtra = async (extraType) => {
    if (!currentInnings) return;
    if (!batsmanId || !nonStrikerId || !bowlerId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select Striker, Non-Striker, and Bowler first!'
      });
      return;
    }
    try {
      setSubmitting(true);
      const extraRuns = extraType === 'wide' || extraType === 'no_ball' ? 0 : 1;
      await recordBall({
        matchId, inningsId: currentInnings.id,
        batsmanPlayerId: batsmanId, nonStrikerPlayerId: nonStrikerId, bowlerPlayerId: bowlerId,
        runsOffBat: 0, extraType, extraRuns,
      });
      await postBallLogic(extraType === 'wide' || extraType === 'no_ball' ? 0 : 1, false);
    } catch (e) {
      const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed recording extra');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message
      });
    } finally { setSubmitting(false); }
  };

  // ─── Wicket flow ─────────────────────────────────────────────────────────
  const handleWicketPress = () => {
    if (!currentInnings) return;
    if (!batsmanId || !nonStrikerId || !bowlerId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select Striker, Non-Striker, and Bowler first!'
      });
      return;
    }
    setSelectedWicketType(null);
    setSelectedFielderId(null);
    setShowWicketModal(true);
  };

  const handleConfirmWicket = async () => {
    if (!selectedWicketType) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please choose how the batsman was dismissed.'
      });
      return;
    }
    if (FIELDER_NEEDED.includes(selectedWicketType) && !selectedFielderId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please choose the fielder involved.'
      });
      return;
    }
    setShowWicketModal(false);
    try {
      setSubmitting(true);
      await recordBall({
        matchId, inningsId: currentInnings.id,
        batsmanPlayerId: batsmanId, nonStrikerPlayerId: nonStrikerId, bowlerPlayerId: bowlerId,
        runsOffBat: 0, extraType: 'normal', extraRuns: 0,
        isWicket: true,
        wicketType: selectedWicketType,
        fielderPlayerId: selectedFielderId || undefined,
      });
      await postBallLogic(0, true);
    } catch (e) {
      const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed recording wicket');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message
      });
    } finally { setSubmitting(false); }
  };

  // ─── Undo ─────────────────────────────────────────────────────────────────
  const handleUndoBall = async () => {
    if (!currentInnings) return;
    try {
      setSubmitting(true);
      await undoBall(matchId);
      await loadData();
    } catch (e) {
      const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed undoing ball');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message
      });
    } finally { setSubmitting(false); }
  };

  // ─── Declare ─────────────────────────────────────────────────────────────
  const handleDeclare = () => {
    if (!currentInnings) return;
    setActionSheetTitle('Are you sure you want to declare this innings?');
    setActionSheetOptions([
      {
        text: 'Yes, Declare Innings',
        destructive: true,
        icon: 'flag-variant-outline',
        onPress: async () => {
          setActionSheetVisible(false);
          try {
            await declareInnings(currentInnings.id);
            loadData();
          } catch (e) {
            const message = e?.response?.data?.errors ? e.response.data.errors.join(', ') : (e?.response?.data?.message || 'Failed declaring innings');
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

  // ─── Player selection modal ───────────────────────────────────────────────
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

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getPlayerName = (id, teamPlayers) => {
    if (!id) return 'Select Player';
    const rec = teamPlayers.find(p => p.playerId === id);
    return rec ? rec.player.fullName : 'Unknown';
  };

  const isPlayerOnField = (id) => id === batsmanId || id === nonStrikerId || id === bowlerId;
  const isPlayerDismissed = (id) => dismissedPlayerIds.includes(id);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1E293B" />
      </View>
    );
  }

  // ─── Current over balls display ───────────────────────────────────────────
  const renderCurrentOverBalls = () => {
    const balls = currentInnings?.balls || [];
    const sorted = [...balls].sort((a, b) => a.sequenceNo - b.sequenceNo);
    const latestOver = sorted.length > 0 ? sorted[sorted.length - 1].overNumber : 1;
    const overBalls = sorted.filter(b => b.overNumber === latestOver);

    if (overBalls.length === 0) {
      return <Text style={styles.noBallsText}>Start of over {latestOver}</Text>;
    }
    return overBalls.map((ball, idx) => {
      let display = ball.runsScored.toString();
      let dotColor = '#94A3B8';
      let textColor = '#fff';
      if (ball.wicketType) { display = 'W'; dotColor = '#EF4444'; }
      else if (ball.ballType === 'wide') { display = `${ball.extras}wd`; dotColor = '#F59E0B'; }
      else if (ball.ballType === 'no_ball') { display = `${ball.runsScored}nb`; dotColor = '#F59E0B'; }
      else if (ball.runsScored === 4) { dotColor = '#3B82F6'; }
      else if (ball.runsScored === 6) { dotColor = '#8B5CF6'; }
      else if (ball.runsScored === 0) { display = '•'; textColor = '#94A3B8'; dotColor = 'transparent'; }
      return (
        <View key={ball.id || idx} style={[
          styles.ballDot,
          { backgroundColor: dotColor, borderColor: ball.runsScored === 0 ? '#E2E8F0' : dotColor, borderWidth: ball.runsScored === 0 ? 1 : 0 }
        ]}>
          <Text style={[styles.ballText, { color: textColor }]}>{display}</Text>
        </View>
      );
    });
  };

  const currentOverRuns = (() => {
    const balls = currentInnings?.balls || [];
    const latestOver = balls.length > 0 ? Math.max(...balls.map(b => b.overNumber)) : 1;
    return balls.filter(b => b.overNumber === latestOver).reduce((s, b) => s + b.runsScored + b.extras, 0);
  })();

  // ─── Batting player list filter ───────────────────────────────────────────
  const getFilteredBattingPlayers = () => {
    return battingTeamPlayers.filter(p => !isPlayerDismissed(p.playerId));
  };

  const bowlerStats = getBowlerStats(bowlerId);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* ── Score Banner ── */}
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

            {/* Current Over */}
            <View style={styles.currentOverContainer}>
              <View style={styles.recentBallsList}>
                {renderCurrentOverBalls()}
              </View>
              <View style={styles.overTotalBadge}>
                <Text style={styles.overTotalText}>{currentOverRuns} runs</Text>
              </View>
            </View>

            {currentInnings.status !== 'completed' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetText}>
                  RR: {(currentInnings.totalRuns / (Math.max(1, currentInnings.legalBalls) / 6)).toFixed(2)}
                  {currentInnings.targetRuns ? `  •  Need ${currentInnings.targetRuns - currentInnings.totalRuns} from ${(scoreboard.overs * 6 - currentInnings.legalBalls)} balls` : ''}
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

        {/* ── Field Operations ── */}
        {currentInnings && currentInnings.status !== 'completed' && (
          <View style={styles.activePlayersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Field Operations</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={handleUndoBall} style={styles.utilityBtn} disabled={submitting}>
                  <Text style={styles.utilityBtnText}>↩ UNDO</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeclare} style={[styles.utilityBtn, { borderColor: '#EF4444' }]} disabled={submitting}>
                  <Text style={[styles.utilityBtnText, { color: '#EF4444' }]}>DECLARE</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Batsman cards */}
            <View style={styles.playerCardsRow}>
              {/* Striker */}
              <TouchableOpacity
                style={[styles.playerCard, batsmanId && styles.playerCardActive]}
                onPress={() => openPlayerSelection('batsman')}
              >
                <View style={styles.roleHeader}>
                  <Text style={styles.playerRoleLabel}>STRIKER</Text>
                  <MaterialCommunityIcons name="cricket" size={14} color="#3B82F6" />
                </View>
                <Text style={styles.playerCardName} numberOfLines={1}>
                  {getPlayerName(batsmanId, battingTeamPlayers)}
                </Text>
                {batsmanId && (() => {
                  const st = getBatsmanStats(batsmanId);
                  return st ? (
                    <View style={styles.liveStatRow}>
                      <Text style={styles.liveStatMain}>{st.runs}</Text>
                      <Text style={styles.liveStatSub}>({st.balls}b)</Text>
                      {st.fours > 0 && <Text style={styles.liveStatBadge}>4×{st.fours}</Text>}
                      {st.sixes > 0 && <Text style={[styles.liveStatBadge, { backgroundColor: '#EDE9FE', color: '#7C3AED' }]}>6×{st.sixes}</Text>}
                    </View>
                  ) : null;
                })()}
                <View style={styles.cardFooter}>
                  <Text style={styles.tapToChange}>Tap to change</Text>
                </View>
              </TouchableOpacity>

              {/* Non-Striker */}
              <TouchableOpacity
                style={[styles.playerCard, nonStrikerId && styles.playerCardActive]}
                onPress={() => openPlayerSelection('nonStriker')}
              >
                <View style={styles.roleHeader}>
                  <Text style={styles.playerRoleLabel}>NON-STRIKER</Text>
                  <MaterialCommunityIcons name="account-outline" size={14} color="#64748B" />
                </View>
                <Text style={styles.playerCardName} numberOfLines={1}>
                  {getPlayerName(nonStrikerId, battingTeamPlayers)}
                </Text>
                {nonStrikerId && (() => {
                  const st = getBatsmanStats(nonStrikerId);
                  return st ? (
                    <View style={styles.liveStatRow}>
                      <Text style={styles.liveStatMain}>{st.runs}</Text>
                      <Text style={styles.liveStatSub}>({st.balls}b)</Text>
                    </View>
                  ) : null;
                })()}
                <View style={styles.cardFooter}>
                  <Text style={styles.tapToChange}>Tap to change</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bowler card */}
            <TouchableOpacity
              style={[styles.bowlerCard, bowlerId && styles.bowlerCardActive]}
              onPress={() => openPlayerSelection('bowler')}
            >
              <View style={styles.bowlerInfo}>
                <View style={styles.roleHeader}>
                  <Text style={styles.playerRoleLabel}>CURRENT BOWLER</Text>
                  <MaterialCommunityIcons name="baseball" size={14} color="#10B981" />
                </View>
                <Text style={styles.bowlerName} numberOfLines={1}>
                  {getPlayerName(bowlerId, bowlingTeamPlayers)}
                </Text>
                {bowlerStats && (
                  <View style={styles.bowlerStatsRow}>
                    <Text style={styles.bowlerStat}>{bowlerStats.oversDisplay} ov</Text>
                    <Text style={styles.bowlerStatDivider}>·</Text>
                    <Text style={styles.bowlerStat}>{bowlerStats.wickets}W</Text>
                    <Text style={styles.bowlerStatDivider}>·</Text>
                    <Text style={styles.bowlerStat}>{bowlerStats.runsConceded}R</Text>
                    <Text style={styles.bowlerStatDivider}>·</Text>
                    <Text style={styles.bowlerStat}>Econ {bowlerStats.economy}</Text>
                  </View>
                )}
              </View>
              <View style={styles.bowlerIconContainer}>
                <MaterialCommunityIcons name="baseball" size={24} color="#10B981" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Scoring Pad ── */}
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
            <TouchableOpacity style={[styles.numpadBtn, styles.wicketBtn]} onPress={handleWicketPress} disabled={submitting || currentInnings?.status === 'completed'}>
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

      {/* ══════════ PLAYER SELECTOR MODAL ══════════ */}
      <Modal visible={showPlayerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectionType === 'bowler' ? 'Bowler' : selectionType === 'batsman' ? 'Striker' : 'Non-Striker'}
              </Text>
              <TouchableOpacity onPress={() => setShowPlayerModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectionType !== 'bowler' && dismissedPlayerIds.length > 0 && (
              <View style={styles.dismissedBanner}>
                <Text style={styles.dismissedBannerText}>
                  🚫 {dismissedPlayerIds.length} player{dismissedPlayerIds.length > 1 ? 's' : ''} already dismissed
                </Text>
              </View>
            )}

            <FlatList
              data={selectionType === 'bowler' ? bowlingTeamPlayers : getFilteredBattingPlayers()}
              keyExtractor={(item) => item.playerId}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>No available players</Text>
                </View>
              }
              renderItem={({ item }) => {
                const onField = isPlayerOnField(item.playerId);
                const st = selectionType !== 'bowler' ? getBatsmanStats(item.playerId) : getBowlerStats(item.playerId);
                return (
                  <TouchableOpacity
                    style={[styles.playerListItem, onField && styles.playerListItemDisabled]}
                    onPress={() => handleSelectPlayer(item.playerId)}
                    disabled={onField}
                  >
                    <View style={styles.playerListItemInfo}>
                      <View style={styles.jerseyCircle}>
                        <Text style={styles.playerListNumber}>{item.jerseyNumber || '?'}</Text>
                      </View>
                      <View>
                        <Text style={styles.playerListName}>{item.player.fullName}</Text>
                        <Text style={styles.playerListRole}>{item.isCaptain ? 'Captain' : 'Player'}</Text>
                        {st && selectionType !== 'bowler' && (
                          <Text style={styles.playerListStat}>{st.runs} runs ({st.balls}b) · SR {st.strikeRate}</Text>
                        )}
                        {st && selectionType === 'bowler' && (
                          <Text style={styles.playerListStat}>{st.oversDisplay} ov · {st.wickets}W · {st.runsConceded}R · Econ {st.economy}</Text>
                        )}
                      </View>
                    </View>
                    {onField && (
                      <View style={styles.onFieldBadge}>
                        <Text style={styles.onFieldText}>ON FIELD</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ══════════ WICKET MODAL ══════════ */}
      <Modal visible={showWicketModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏏 Wicket Type</Text>
              <TouchableOpacity onPress={() => setShowWicketModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.wicketSubLabel}>
              Batsman: <Text style={{ color: '#1E293B', fontWeight: '900' }}>{getPlayerName(batsmanId, battingTeamPlayers)}</Text>
            </Text>

            {/* Wicket type grid */}
            <View style={styles.wicketGrid}>
              {WICKET_TYPES.map(wt => (
                <TouchableOpacity
                  key={wt.key}
                  style={[styles.wicketTypeBtn, selectedWicketType === wt.key && styles.wicketTypeBtnActive]}
                  onPress={() => {
                    setSelectedWicketType(wt.key);
                    setSelectedFielderId(null); // reset fielder if type changed
                  }}
                >
                  <MaterialCommunityIcons
                    name={wt.icon}
                    size={24}
                    color={selectedWicketType === wt.key ? '#fff' : '#64748B'}
                  />
                  <Text style={[styles.wicketTypeLabel, selectedWicketType === wt.key && styles.wicketTypeLabelActive]}>
                    {wt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fielder selector — only for caught/run_out/stumped */}
            {selectedWicketType && FIELDER_NEEDED.includes(selectedWicketType) && (
              <View style={styles.fielderSection}>
                <Text style={styles.fielderSectionTitle}>
                  {selectedWicketType === 'caught' ? 'Caught by' : selectedWicketType === 'stumped' ? 'Stumped by' : 'Run out by'} (fielder)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {bowlingTeamPlayers.map(p => (
                      <TouchableOpacity
                        key={p.playerId}
                        style={[styles.fielderChip, selectedFielderId === p.playerId && styles.fielderChipActive]}
                        onPress={() => setSelectedFielderId(p.playerId)}
                      >
                        <Text style={[styles.fielderChipText, selectedFielderId === p.playerId && styles.fielderChipTextActive]}>
                          {p.player.fullName.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {selectedFielderId && (
                  <Text style={styles.fielderSelected}>
                    ✅ {getPlayerName(selectedFielderId, bowlingTeamPlayers)}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmWicketBtn, !selectedWicketType && styles.confirmWicketBtnDisabled]}
              onPress={handleConfirmWicket}
              disabled={!selectedWicketType}
            >
              <Text style={styles.confirmWicketText}>Confirm Wicket</Text>
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { justifyContent: 'center', alignItems: 'center' },

  // ── Score Banner ──────────────────────────────────────────────────────────
  scoreBanner: {
    backgroundColor: '#1E293B',
    padding: 25,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20,
  },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  battingLogoSmallContainer: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  battingLogoSmall: { width: 24, height: 24, resizeMode: 'contain' },
  battingTeamName: { color: 'white', fontSize: 18, fontWeight: '800', flex: 1 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  liveText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  scoreMainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  scoreMainText: { color: 'white', fontSize: 56, fontWeight: '900' },
  overBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  overBadgeText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  targetSection: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15, marginTop: 5 },
  targetText: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', flex: 1 },
  reportLink: { color: '#38BDF8', fontSize: 14, fontWeight: '800' },
  currentOverContainer: { flexDirection: 'row', marginTop: 15, backgroundColor: 'rgba(255,255,255,0.08)', padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  recentBallsList: { flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: 4 },
  ballDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  ballText: { fontSize: 12, fontWeight: '900' },
  noBallsText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', fontWeight: '600' },
  overTotalBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginLeft: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  overTotalText: { fontSize: 11, fontWeight: '900', color: '#CBD5E1', textTransform: 'uppercase' },
  noInningsText: { color: 'white', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },

  // ── Field Operations ──────────────────────────────────────────────────────
  activePlayersSection: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase' },
  utilityBtn: { borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  utilityBtnText: { fontSize: 11, fontWeight: '900', color: '#64748B' },

  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  playerCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  playerCard: {
    width: (width - 55) / 2, backgroundColor: 'white', padding: 16,
    borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 10, borderWidth: 2, borderColor: 'transparent',
  },
  playerCardActive: { borderColor: '#0EA5E9', backgroundColor: '#F0F9FF' },
  playerRoleLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 },
  playerCardName: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  liveStatRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  liveStatMain: { fontSize: 20, fontWeight: '900', color: '#0EA5E9' },
  liveStatSub: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  liveStatBadge: { backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: 10, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  tapToChange: { fontSize: 8, color: '#CBD5E1', fontWeight: 'bold' },

  bowlerCard: {
    backgroundColor: 'white', padding: 18, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.05,
    borderWidth: 2, borderColor: 'transparent',
  },
  bowlerCardActive: { borderColor: '#8B5CF6', backgroundColor: '#F5F3FF' },
  bowlerInfo: { flex: 1 },
  bowlerName: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
  bowlerStatsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  bowlerStat: { fontSize: 11, fontWeight: '800', color: '#7C3AED' },
  bowlerStatDivider: { fontSize: 11, color: '#C4B5FD', fontWeight: '900' },
  bowlerIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  bowlerEmoji: { fontSize: 24 },

  // ── Scoring Pad ───────────────────────────────────────────────────────────
  scoringPad: { paddingHorizontal: 20, marginTop: 10 },
  padRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  numpadBtn: {
    width: (width - 70) / 4, aspectRatio: 1, backgroundColor: 'white',
    borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8,
  },
  boundaryBtn: { backgroundColor: '#F8FAFC' },
  numpadText: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  padSubText: { fontSize: 7, fontWeight: '900', color: '#94A3B8', marginTop: 2 },
  extraBtn: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FEF3C7' },
  extraText: { fontSize: 16, fontWeight: '900', color: '#64748B' },
  wicketBtn: { flex: 2, aspectRatio: 2.38, backgroundColor: '#EF4444', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  wicketBtnText: { color: 'white', fontSize: 22, fontWeight: '900' },
  wicketSubText: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: 'bold' },

  fullReportBtn: { marginHorizontal: 20, padding: 20, backgroundColor: '#1E293B', borderRadius: 20, alignItems: 'center', elevation: 4 },
  fullReportText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // ── Modals ────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 28, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  closeBtn: { padding: 10, backgroundColor: '#F1F5F9', borderRadius: 15 },
  closeModalText: { fontSize: 18, color: '#64748B', fontWeight: 'bold' },

  dismissedBanner: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 10, marginBottom: 14, alignItems: 'center' },
  dismissedBannerText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },

  playerListItem: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center', justifyContent: 'space-between' },
  playerListItemDisabled: { opacity: 0.35 },
  playerListItemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  jerseyCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  playerListNumber: { fontWeight: '900', color: '#1E293B', fontSize: 16 },
  playerListName: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  playerListRole: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold' },
  playerListStat: { fontSize: 11, color: '#3B82F6', fontWeight: '700', marginTop: 2 },
  onFieldBadge: { backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  onFieldText: { fontSize: 10, fontWeight: '900', color: '#0EA5E9' },
  emptyList: { alignItems: 'center', paddingVertical: 30 },
  emptyListText: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },

  // ── Wicket Modal ──────────────────────────────────────────────────────────
  wicketSubLabel: { fontSize: 14, color: '#64748B', marginBottom: 18, fontWeight: '600' },
  wicketGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  wicketTypeBtn: { width: (width - 96) / 3, paddingVertical: 14, backgroundColor: '#F8FAFC', borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  wicketTypeBtnActive: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  wicketTypeEmoji: { fontSize: 22, marginBottom: 4 },
  wicketTypeLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', textAlign: 'center' },
  wicketTypeLabelActive: { color: '#EF4444' },

  fielderSection: { marginBottom: 16 },
  fielderSectionTitle: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 10 },
  fielderChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F1F5F9', borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  fielderChipActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  fielderChipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  fielderChipTextActive: { color: '#1D4ED8' },
  fielderSelected: { marginTop: 8, fontSize: 13, color: '#059669', fontWeight: '700' },

  confirmWicketBtn: { backgroundColor: '#EF4444', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 8 },
  confirmWicketBtnDisabled: { backgroundColor: '#FCA5A5' },
  confirmWicketText: { color: 'white', fontSize: 17, fontWeight: '900' },
});
