import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions, TouchableOpacity } from 'react-native';
import { getInningsScoreboard } from '../api/matches';

const { width } = Dimensions.get('window');

export default function MatchReportScreen({ route }) {
  const { matchId } = route.params;
  const [loading, setLoading] = useState(true);
  const [innings1, setInnings1] = useState(null);
  const [innings2, setInnings2] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    summary_1: true,
    overs_1: true,
    summary_2: true,
    overs_2: true
  });
  const [expandedOvers, setExpandedOvers] = useState({});

  useEffect(() => {
    loadReport();
  }, [matchId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data1 = await getInningsScoreboard(matchId, 1);
      setInnings1(data1);
      try {
        const data2 = await getInningsScoreboard(matchId, 2);
        setInnings2(data2);
      } catch (e) {
        // Second innings might not exist or failed
      }
    } catch (e) {
      console.log('Failed to fetch detailed report: ', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleOver = (innNum, overNum) => {
    const key = `${innNum}_${overNum}`;
    setExpandedOvers(prev => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key]
    }));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const renderOverTimeline = (balls, inningsNum) => {
    // Group balls by overNumber
    const grouped = balls.reduce((acc, ball) => {
      acc[ball.overNumber] = acc[ball.overNumber] || [];
      acc[ball.overNumber].push(ball);
      return acc;
    }, {});

    const sortedOvers = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));

    return (
      <View style={styles.sectionWrapper}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(`overs_${inningsNum}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitleText}>Overs Timeline</Text>
        </TouchableOpacity>

        {sortedOvers.map(overNumber => {
          const overBalls = grouped[overNumber];
          const overKey = `${inningsNum}_${overNumber}`;
          const isOverExpanded = expandedOvers[overKey] !== false; // Default to true

          return (
            <View key={overNumber} style={[styles.overCard, !isOverExpanded && { paddingBottom: 5 }]}>
              <TouchableOpacity
                style={[styles.overHeader, !isOverExpanded && { borderBottomWidth: 0, marginBottom: 0 }]}
                onPress={() => toggleOver(inningsNum, overNumber)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.overTitle}>OVER {overNumber}</Text>
                </View>
                <View style={styles.overStatsBadge}>
                  <Text style={styles.overStatsText}>
                    {overBalls.reduce((sum, b) => sum + b.runsScored, 0)} Runs
                  </Text>
                </View>
                <Text style={[styles.expandIconSmall, { marginLeft: 10 }]}>{isOverExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isOverExpanded && (
                <View style={styles.ballRow}>
                  {overBalls.map((ball, idx) => {
                    const isWkt = !!ball.wicketType;
                    const isExtra = ball.ballType !== 'normal';
                    let text = ball.runsScored.toString();
                    const isFour = ball.runsScored === 4;
                    const isSix = ball.runsScored === 6;
                    if (isExtra) {
                      if (ball.ballType === 'wide') text = 'wd';
                      else if (ball.ballType === 'no_ball') text = 'nb';
                      else if (ball.ballType === 'leg_bye') text = `${ball.extras}lb`;
                      else if (ball.ballType === 'bye') text = `${ball.extras}b`;
                    } else if (isWkt) {
                      text = 'W';
                    }

                    return (
                      <View key={ball.id || idx} style={styles.ballContainer}>
                        <View style={[styles.ballCircle, isWkt && styles.wktCircle, isExtra && styles.extraCircle, isFour && styles.fourCircle, isSix && styles.sixCircle]}>
                          <Text style={[styles.ballText, isWkt && styles.wktText, isExtra && styles.extraText, isFour && styles.fourText, isSix && styles.sixText]}>{text}</Text>
                        </View>
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

  const renderInnings = (inn) => {
    if (!inn) return null;
    const isSummaryExpanded = expandedSections[`summary_${inn.inningsNumber}`];

    return (
      <View style={styles.inningsContainer}>
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
            <Text style={styles.inningsOvers}>{inn.overs} Ov</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <TouchableOpacity
            style={styles.summaryHeader}
            onPress={() => toggleSection(`summary_${inn.inningsNumber}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.summaryTitle}>Innings Summary</Text>
            <Text style={styles.expandIcon}>{isSummaryExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {isSummaryExpanded && (
            <View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Runs</Text>
                <Text style={styles.summaryValue}>{inn.runs}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Wickets Lost</Text>
                <Text style={styles.summaryValue}>{inn.wickets}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Extras</Text>
                <Text style={styles.summaryValue}>{inn.totalExtras}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Run Rate</Text>
                <Text style={styles.summaryValue}>{inn.runRate.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Legal Balls</Text>
                <Text style={styles.summaryValue}>{inn.legalBalls}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>All Out</Text>
                <Text style={styles.summaryValue}>{inn.allOut ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: inn.inningsNumber === 1 ? "red" : "#64748B" }]}>
                  {inn.inningsNumber === 1 ? 'Target' : 'Current Score'}
                </Text>
                <Text style={[styles.summaryValue, { color: inn.inningsNumber === 1 ? "red" : "#1E293B" }]}>
                  {inn.inningsNumber === 1 ? inn.target : inn.runs}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Status</Text>
                <Text style={[styles.summaryValue, { textTransform: 'capitalize', color: inn.status === 'completed' ? '#059669' : '#D97706' }]}>{inn.status}</Text>
              </View>
            </View>
          )}
        </View>

        {renderOverTimeline(inn.balls, inn.inningsNumber)}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Detailed Analytics</Text>
        <Text style={styles.pageSubtitle}>Ball-by-ball performance review</Text>
      </View>
      {renderInnings(innings1)}
      {renderInnings(innings2)}
      <View style={{ height: 40 }} />
    </ScrollView>
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
  pageHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#aaffb1ff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  inningsContainer: {
    padding: 15
  },
  inningsHeader: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inningsHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogoSmallContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamLogoSmall: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  inningsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  inningsSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  inningsScoreBadge: {
    alignItems: 'flex-end',
  },
  inningsScore: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '800'
  },
  inningsOvers: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  overCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#E2E8F0',
  },
  overHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  overTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
  },
  overStatsBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overStatsText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  expandIconSmall: {
    fontSize: 14,
    color: '#64748B',
  },
  ballRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  ballContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 10,
    width: 40,
  },
  ballCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ballText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B'
  },

  wktCircle: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  wktText: {
    color: 'white'
  },
  extraCircle: {
    backgroundColor: '#f3d46dff',
    borderColor: '#f3d46dff',
  },
  extraText: {
    color: '#000000ff'
  },
  fourCircle: {
    backgroundColor: '#c03095ff',
    borderColor: '#c03095ff',
  },
  fourText: {
    color: 'white'
  },
  sixCircle: {
    backgroundColor: '#66b342ff',
    borderColor: '#66b342ff',
  },
  sixText: {
    color: 'white'
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  sectionWrapper: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

