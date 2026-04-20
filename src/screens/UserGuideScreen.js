import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const GUIDES = [
  {
    role: 'Admin',
    icon: 'shield-account',
    color: '#6366F1',
    description: 'Manage your organization, teams, and players with full control.',
    steps: [
      {
        title: 'Team Management',
        text: 'Create and edit teams. Assign logos and short names to help identify them in the scoreboard.',
        icon: 'account-group-outline'
      },
      {
        title: 'Player Registry',
        text: 'Register players globally. You can add them to specific teams and track their career stats.',
        icon: 'card-account-details-outline'
      },
      {
        title: 'Match Setup',
        text: 'Schedule new matches between teams. Set venue, date, and overs for each match.',
        icon: 'calendar-plus'
      },
      {
        title: 'Organization Settings',
        text: 'Manage organization details and linked official accounts.',
        icon: 'office-building'
      }
    ]
  },
  {
    role: 'Scorer',
    icon: 'cricket',
    color: '#F59E0B',
    description: 'Real-time ball-by-ball scoring with easy-to-use interface.',
    steps: [
      {
        title: 'Toss & Innings',
        text: 'Record the toss winner and their decision. Start the first innings with selected openers.',
        icon: 'clock-time-six-outline'
      },
      {
        title: 'Ball Entry',
        text: 'Tap runs (0-6) or extras (Wide, No Ball, Bye). Select wicket types for accurate records.',
        icon: 'record-circle-outline'
      },
      {
        title: 'Undo & correction',
        text: 'Made a mistake? Use the Undo button to revert the last ball instantly.',
        icon: 'undo-variant'
      },
      {
        title: 'Match Completion',
        text: 'Declare innings or finish the match. The system automatically computes the result.',
        icon: 'check-decagram-outline'
      }
    ]
  },
  {
    role: 'Audience',
    icon: 'account-eye',
    color: '#10B981',
    description: 'Stay updated with live scores, reports, and team statistics.',
    steps: [
      {
        title: 'Live Tracking',
        text: 'Follow matches in real-time. The scoreboard updates as soon as a ball is recorded.',
        icon: 'broadcast'
      },
      {
        title: 'Detailed Reports',
        text: 'View full match scorecards, bowling figures, and over-by-over timelines.',
        icon: 'file-chart-outline'
      },
      {
        title: 'Points Table',
        text: 'Track tournament standings. Points are updated automatically after every match.',
        icon: 'table-large'
      },
      {
        title: 'Team Analytics',
        text: 'Check team winning streaks and player performance history.',
        icon: 'trending-up'
      }
    ]
  }
];

export default function UserGuideScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const activeGuide = GUIDES[activeTab];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[activeGuide.color, activeGuide.color + 'CC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <MaterialCommunityIcons name={activeGuide.icon} size={32} color="white" />
            <Text style={styles.headerTitle}>{activeGuide.role} Guide</Text>
          </View>
          <Text style={styles.headerSubtitle}>{activeGuide.description}</Text>
        </View>

        <View style={styles.tabBar}>
          {GUIDES.map((g, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.tabItem, activeTab === idx && styles.activeTabItem]}
              onPress={() => setActiveTab(idx)}
            >
              <Text style={[styles.tabText, activeTab === idx && styles.activeTabText]}>
                {g.role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.visualizationContainer}>
          <LinearGradient
            colors={['#fff', '#f8fafc']}
            style={styles.guideVisual}
          >
            <MaterialCommunityIcons name={activeGuide.icon} size={100} color={activeGuide.color + '20'} style={styles.visualBgIcon} />
            <View style={styles.visualContent}>
              <Text style={styles.visualTitle}>How to use as {activeGuide.role}</Text>
              <Text style={styles.visualText}>Follow these 4 simple steps to master the {activeGuide.role} workflow in BallTrack.</Text>
            </View>
          </LinearGradient>
        </View>

        {activeGuide.steps.map((step, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={[styles.stepNumberContainer, { backgroundColor: activeGuide.color }]}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <MaterialCommunityIcons name={step.icon} size={24} color={activeGuide.color} />
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
              <Text style={styles.stepDescription}>{step.text}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: activeGuide.color }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionBtnText}>Got it, thanks!</Text>
          <MaterialCommunityIcons name="check-circle-outline" size={20} color="white" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabItem: {
    backgroundColor: 'white',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  activeTabText: {
    color: '#334155',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  visualizationContainer: {
    marginBottom: 25,
  },
  guideVisual: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    position: 'relative',
  },
  visualBgIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  visualContent: {
    zIndex: 1,
  },
  visualTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  visualText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  }
});
