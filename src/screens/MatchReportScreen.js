import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Image, Dimensions, TouchableOpacity
} from 'react-native';
import { getInningsScoreboard, getMatchPerformance } from '../api/matches';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socket, connectSocket, disconnectSocket, joinMatchRoom, leaveMatchRoom } from '../api/socket';

const { width } = Dimensions.get('window');

// ── Helpers ─────────────────────────────────────────────────────────────────
const WICKET_LABEL = {
  bowled: 'b',
  caught: 'c &b',
  lbw: 'lbw',
  run_out: 'run out',
  stumped: 'st',
  hit_wicket: 'hit wkt',
  handled_ball: 'handled ball',
  obstructing_field: 'obstr. field',
  timed_out: 'timed out',
};

function dismissalText(b) {
  if (!b.dismissed) return 'not out';
  const wt = WICKET_LABEL[b.wicketType] || b.wicketType;
  if (b.wicketType === 'caught' && b.fielderName && b.bowlerName) {
    return `c ${b.fielderName} b ${b.bowlerName}`;
  }
  if (b.wicketType === 'stumped' && b.fielderName && b.bowlerName) {
    return `st ${b.fielderName} b ${b.bowlerName}`;
  }
  if (b.wicketType === 'run_out' && b.fielderName) {
    return `run out (${b.fielderName})`;
  }
  if (b.bowlerName) return `${wt} ${b.bowlerName}`;
  return wt;
}

// ── Batting scorecard table ──────────────────────────────────────────────────
function BattingScorecard({ scorecard, teamName }) {
  if (!scorecard || scorecard.length === 0) return null;
  return (
    <View style={styles.scorecardCard}>
      <View style={styles.scorecardHeader}>
        <Text style={styles.scorecardTeam}>{teamName} — Batting</Text>
      </View>
      {/* Column headers */}
      <View style={[styles.scRow, styles.scHeaderRow]}>
        <Text style={[styles.scCell, styles.scPlayerCell, styles.scHeaderText]}>Batsman</Text>
        <Text style={[styles.scCellNum, styles.scHeaderText]}>R</Text>
        <Text style={[styles.scCellNum, styles.scHeaderText]}>B</Text>
        <Text style={[styles.scCellNum, styles.scHeaderText]}>4s</Text>
        <Text style={[styles.scCellNum, styles.scHeaderText]}>6s</Text>
        <Text style={[styles.scCellNum, styles.scHeaderText]}>SR</Text>
      </View>
      {scorecard.map((b, idx) => (
        <View key={b.playerId} style={[styles.scRow, idx % 2 === 1 && styles.scRowAlt]}>
          <View style={styles.scPlayerCell}>
            <Text style={styles.scPlayerName} numberOfLines={1}>{b.playerName}</Text>
            <Text style={styles.scDismissal} numberOfLines={1}>{dismissalText(b)}</Text>
          </View>
          <Text style={[styles.scCellNum, b.runs >= 50 && styles.scHighlight]}>{b.runs}</Text>
          <Text style={styles.scCellNum}>{b.balls}</Text>
          <Text style={styles.scCellNum}>{b.fours}</Text>
          <Text style={styles.scCellNum}>{b.sixes}</Text>
          <Text style={styles.scCellNum}>{b.strikeRate}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Bowling scorecard table ───────────────────────────────────────────────────
function BowlingScorecard({ scorecard, teamName }) {
  if (!scorecard || scorecard.length === 0) return null;
  return (
    <View style={styles.scorecardCard}>
      <View style={[styles.scorecardHeader, { backgroundColor: '#312E81' }]}>
        <Text style={styles.scorecardTeam}>{teamName} — Bowling</Text>
      </View>
      <View style={[styles.scRow, styles.scHeaderRow]}>
        <Text style={[styles.scCell, styles.scPlayerCell, styles.scHeaderText]}>Bowler</Text>
        <Text style={[styles.scCellNum, styles.scHeaderText]}>O</Text>
        <Text style={[styles.scCellNum, styles.scHeaderText]}>M</Text>
        <Text style={[styles.scCellNum, styles.scHeaderText]}>R</Text>
        <Text style={[styles.scCellNum, styles.scHeaderText]}>W</Text>
        <Text style={[styles.scCellNum, styles.scHeaderText]}>Econ</Text>
      </View>
      {scorecard.map((b, idx) => (
        <View key={b.playerId} style={[styles.scRow, idx % 2 === 1 && styles.scRowAlt]}>
          <View style={styles.scPlayerCell}>
            <Text style={styles.scPlayerName} numberOfLines={1}>{b.playerName}</Text>
          </View>
          <Text style={styles.scCellNum}>{b.oversDisplay}</Text>
          <Text style={styles.scCellNum}>{b.maidens}</Text>
          <Text style={styles.scCellNum}>{b.runsConceded}</Text>
          <Text style={[styles.scCellNum, b.wickets >= 3 && styles.scHighlight]}>{b.wickets}</Text>
          <Text style={styles.scCellNum}>{b.economy}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MatchReportScreen({ route }) {
  const { matchId } = route.params;
  const [loading, setLoading] = useState(true);
  const [innings1, setInnings1] = useState(null);
  const [innings2, setInnings2] = useState(null);
  const [perfData, setPerfData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    batting_1: true, bowling_1: true, overs_1: false,
    batting_2: true, bowling_2: true, overs_2: false,
  });
  const [expandedOvers, setExpandedOvers] = useState({});

  useEffect(() => {
    loadReport();

    // Realtime setup
    connectSocket();
    joinMatchRoom(matchId);

    const handleUpdate = () => {
      console.log('Realtime update received for report');
      loadReportSilently();
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

  const loadReport = async () => {
    try {
      setLoading(true);
      await loadReportSilently();
    } catch (e) {
      console.log('Failed to fetch detailed report: ', e);
    } finally {
      setLoading(false);
    }
  };

  const loadReportSilently = async () => {
    try {
      const [data1, perf] = await Promise.all([
        getInningsScoreboard(matchId, 1),
        getMatchPerformance(matchId),
      ]);
      setInnings1(data1);
      setPerfData(perf);
      try {
        setInnings2(await getInningsScoreboard(matchId, 2));
      } catch (_) { }
    } catch (e) {
      console.log('Silent report load failed', e);
    }
  };

  const toggleSection = (k) => setExpandedSections(p => ({ ...p, [k]: !p[k] }));
  const toggleOver = (inn, over) => {
    const key = `${inn}_${over}`;
    setExpandedOvers(p => ({ ...p, [key]: p[key] === undefined ? false : !p[key] }));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // ── Current-over timeline ──────────────────────────────────────────────────
  const renderOverTimeline = (balls, inningsNum) => {
    const grouped = balls.reduce((acc, ball) => {
      acc[ball.overNumber] = acc[ball.overNumber] || [];
      acc[ball.overNumber].push(ball);
      return acc;
    }, {});
    const sortedOvers = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));
    const isExpanded = expandedSections[`overs_${inningsNum}`];

    return (
      <View style={styles.sectionWrapper}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(`overs_${inningsNum}`)} activeOpacity={0.7}>
          <Text style={styles.sectionTitleText}>Overs Timeline</Text>
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#94A3B8"
          />
        </TouchableOpacity>

        {isExpanded && sortedOvers.map(overNumber => {
          const overBalls = grouped[overNumber];
          const overKey = `${inningsNum}_${overNumber}`;
          const isOverExp = expandedOvers[overKey] !== false;
          const overRuns = overBalls.reduce((s, b) => s + b.runsScored + b.extras, 0);
          const overWickets = overBalls.filter(b => b.wicketType).length;

          return (
            <View key={overNumber} style={[styles.overCard, !isOverExp && { paddingBottom: 5 }]}>
              <TouchableOpacity
                style={[styles.overHeader, !isOverExp && { borderBottomWidth: 0, marginBottom: 0 }]}
                onPress={() => toggleOver(inningsNum, overNumber)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.overTitle}>OVER {overNumber}</Text>
                </View>
                <View style={styles.overStatsBadge}>
                  <Text style={styles.overStatsText}>{overRuns} Runs {overWickets > 0 ? `· ${overWickets}W` : ''}</Text>
                </View>
                <MaterialCommunityIcons
                  name={isOverExp ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#94A3B8"
                  style={{ marginLeft: 10 }}
                />
              </TouchableOpacity>

              {isOverExp && (
                <View style={styles.ballRow}>
                  {overBalls.map((ball, idx) => {
                    const isWkt = !!ball.wicketType;
                    const isExtra = ball.ballType !== 'normal';
                    const isFour = ball.runsScored === 4;
                    const isSix = ball.runsScored === 6;
                    let text = ball.runsScored.toString();
                    if (isExtra) {
                      if (ball.ballType === 'wide') text = 'wd';
                      else if (ball.ballType === 'no_ball') text = 'nb';
                      else if (ball.ballType === 'leg_bye') text = `${ball.extras}lb`;
                      else if (ball.ballType === 'bye') text = `${ball.extras}b`;
                    } else if (isWkt) { text = 'W'; }

                    // Batsman / bowler info from included relations
                    const batsmanName = ball.batsman?.fullName || '';
                    const bowlerName = ball.bowler?.fullName || '';

                    return (
                      <View key={ball.id || idx} style={styles.ballContainer}>
                        <View style={[styles.ballCircle, isWkt && styles.wktCircle, isExtra && styles.extraCircle, isFour && styles.fourCircle, isSix && styles.sixCircle]}>
                          <Text style={[styles.ballText, isWkt && styles.wktText, isExtra && styles.extraText, isFour && styles.fourText, isSix && styles.sixText]}>{text}</Text>
                        </View>
                        {batsmanName ? <Text style={styles.ballMeta} numberOfLines={1}>{batsmanName.split(' ').slice(-1)[0]}</Text> : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // ── Render one innings ──────────────────────────────────────────────────────
  const renderInnings = (inn) => {
    if (!inn) return null;
    const inningPerf = perfData?.performances?.find(p => p.inningsNumber === inn.inningsNumber);
    const isSummaryExp = expandedSections[`batting_${inn.inningsNumber}`];
    const isBowlExp = expandedSections[`bowling_${inn.inningsNumber}`];

    return (
      <View style={styles.inningsContainer}>
        {/* Header */}
        <View style={styles.inningsHeader}>
          <View style={styles.inningsHeaderMain}>
            <View style={styles.teamLogoSmallContainer}>
              <Image source={{ uri: inn.battingTeam?.logoUrl || 'https://via.placeholder.com/50' }} style={styles.teamLogoSmall} />
            </View>
            <View>
              <Text style={styles.inningsTitle}>{inn.battingTeam?.name}</Text>
              <Text style={styles.inningsSubtitle}>Innings {inn.inningsNumber}</Text>
            </View>
          </View>
          <View style={styles.inningsScoreBadge}>
            <Text style={styles.inningsScore}>{inn.runs} / {inn.wickets}</Text>
            <Text style={styles.inningsOvers}>{inn.overs} Ov  ·  RR {inn.runRate?.toFixed(2)}</Text>
          </View>
        </View>

        {/* Quick summary pills */}
        <View style={styles.pillRow}>
          <View style={styles.pill}><Text style={styles.pillLabel}>Extras</Text><Text style={styles.pillValue}>{inn.totalExtras}</Text></View>
          <View style={styles.pill}><Text style={styles.pillLabel}>All Out</Text><Text style={styles.pillValue}>{inn.allOut ? 'Yes' : 'No'}</Text></View>
          {inn.target && <View style={[styles.pill, { backgroundColor: '#FEF2F2' }]}><Text style={[styles.pillLabel, { color: '#EF4444' }]}>Target</Text><Text style={[styles.pillValue, { color: '#EF4444' }]}>{inn.target}</Text></View>}
          <View style={[styles.pill, { backgroundColor: inn.status === 'completed' ? '#F0FDF4' : '#FFFBEB' }]}>
            <Text style={[styles.pillLabel, { color: inn.status === 'completed' ? '#059669' : '#D97706' }]}>Status</Text>
            <Text style={[styles.pillValue, { color: inn.status === 'completed' ? '#059669' : '#D97706', textTransform: 'capitalize' }]}>{inn.status}</Text>
          </View>
        </View>

        {/* Batting Scorecard */}
        <TouchableOpacity style={styles.sectionCollapseHeader} onPress={() => toggleSection(`batting_${inn.inningsNumber}`)} activeOpacity={0.7}>
          <Text style={styles.sectionTitleText}>Batting Scorecard</Text>
          <MaterialCommunityIcons name={isSummaryExp ? "chevron-up" : "chevron-down"} size={18} color="#94A3B8" />
        </TouchableOpacity>
        {isSummaryExp && (
          <BattingScorecard scorecard={inningPerf?.battingScorecard} teamName={inn.battingTeam?.name} />
        )}

        {/* Bowling Scorecard */}
        <TouchableOpacity style={styles.sectionCollapseHeader} onPress={() => toggleSection(`bowling_${inn.inningsNumber}`)} activeOpacity={0.7}>
          <Text style={styles.sectionTitleText}>Bowling Figures</Text>
          <MaterialCommunityIcons name={isBowlExp ? "chevron-up" : "chevron-down"} size={18} color="#94A3B8" />
        </TouchableOpacity>
        {isBowlExp && (
          <BowlingScorecard scorecard={inningPerf?.bowlingScorecard} teamName={inn.bowlingTeam?.name} />
        )}

        {/* Overs Timeline */}
        {inn.balls && inn.balls.length > 0 && renderOverTimeline(inn.balls, inn.inningsNumber)}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Match Report</Text>
          <MaterialCommunityIcons name="chart-bar" size={24} color="#38BDF8" />
        </View>
        <Text style={styles.pageSubtitle}>Ball-by-ball performance review</Text>
      </View>
      {renderInnings(innings1)}
      {renderInnings(innings2)}
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { justifyContent: 'center', alignItems: 'center' },

  pageHeader: {
    paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18,
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: { fontSize: 24, fontWeight: '900', color: 'white' },
  pageSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 3 },

  inningsContainer: { padding: 16 },
  inningsHeader: {
    backgroundColor: '#1E293B', padding: 20, borderRadius: 20, marginBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  inningsHeaderMain: { flexDirection: 'row', alignItems: 'center' },
  teamLogoSmallContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  teamLogoSmall: { width: 32, height: 32, resizeMode: 'contain' },
  inningsTitle: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  inningsSubtitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  inningsScoreBadge: { alignItems: 'flex-end' },
  inningsScore: { color: '#38BDF8', fontSize: 22, fontWeight: '900' },
  inningsOvers: { color: 'white', fontSize: 11, opacity: 0.8 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  pillLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  pillValue: { fontSize: 14, fontWeight: '900', color: '#1E293B', marginTop: 2 },

  sectionCollapseHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 4, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },

  // ── Scorecard table ─────────────────────────────────────────────────────
  scorecardCard: { backgroundColor: 'white', borderRadius: 18, marginBottom: 18, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  scorecardHeader: { backgroundColor: '#1E3A5F', paddingVertical: 12, paddingHorizontal: 16 },
  scorecardTeam: { color: 'white', fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },

  scRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  scHeaderRow: { backgroundColor: '#F1F5F9' },
  scRowAlt: { backgroundColor: '#FAFAFA' },
  scCell: { flex: 1 },
  scPlayerCell: { flex: 3, paddingRight: 6 },
  scCellNum: { width: 36, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#334155' },
  scHeaderText: { fontSize: 11, fontWeight: '900', color: '#64748B', textTransform: 'uppercase' },
  scPlayerName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  scDismissal: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  scHighlight: { color: '#EF4444', fontWeight: '900' },

  // ── Overs Timeline ──────────────────────────────────────────────────────
  sectionWrapper: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 10 },
  sectionTitleText: { fontSize: 13, fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  expandIconSmall: { fontSize: 14, color: '#94A3B8' },

  overCard: {
    backgroundColor: 'white', padding: 14, borderRadius: 14, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, borderLeftWidth: 4, borderLeftColor: '#E2E8F0',
  },
  overHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
  overTitle: { fontSize: 11, fontWeight: '900', color: '#64748B', letterSpacing: 1 },
  overStatsBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  overStatsText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },

  ballRow: { flexDirection: 'row', flexWrap: 'wrap' },
  ballContainer: { alignItems: 'center', marginHorizontal: 3, marginBottom: 8, width: 38 },
  ballCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 3, borderWidth: 1, borderColor: '#E2E8F0' },
  ballText: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  ballMeta: { fontSize: 8, fontWeight: '600', color: '#94A3B8', textAlign: 'center', maxWidth: 36 },

  wktCircle: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  wktText: { color: 'white' },
  extraCircle: { backgroundColor: '#F3D46D', borderColor: '#F3D46D' },
  extraText: { color: '#000' },
  fourCircle: { backgroundColor: '#C03095', borderColor: '#C03095' },
  fourText: { color: 'white' },
  sixCircle: { backgroundColor: '#66B342', borderColor: '#66B342' },
  sixText: { color: 'white' },
});
