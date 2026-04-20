import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  LayoutAnimation,
  Platform,
  Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const FAQ_DATA = [
  {
    question: "How do I start a new match?",
    answer: "Go to the Dashboard and tap on the 'New Match' button. Select the two teams playing, configure the overs and toss details, and you're ready to score ball-by-ball."
  },
  {
    question: "How can I add players to my team?",
    answer: "Visit the 'Team Directory' from the Dashboard, select your team, and tap 'Add Player'. You can create a new player or search for existing ones in the registry."
  },
  {
    question: "Can I use the app offline?",
    answer: "Currently, BallTrack requires an active internet connection to sync stats in real-time. We are working on an offline mode for future updates."
  },
  {
    question: "How do I change my profile photo?",
    answer: "Go to your Profile page, tap the camera icon on your avatar, and choose a photo from your gallery."
  },
  {
    question: "What happens if I make a mistake while scoring?",
    answer: "Use the 'Undo' button at the bottom of the Scoring screen to revert the last ball. You can undo multiple balls if needed."
  },
  {
    question: "How do I delete a match?",
    answer: "Go to the Dashboard, tap on the match you want to delete, and tap the delete icon in the top right corner."
  },
  {
    question: "How can i change my password?",
    answer: "Go to your Profile page, tap on the 'Change Password' button, and enter your old and new passwords."
  },
  {
    question: "How tournaments work?",
    answer: "Tournaments are a way to organize and track multiple matches between teams. You can create a tournament, add teams, and set the rules for the tournament. You can also track the progress of the tournament and see the standings of the teams."
  },
  {
    question: "How can I delete my account?",
    answer: "Go to your Profile page, tap on the 'Delete Account' button, and follow the instructions."
  },
  {
    question: "Can I become a scorer?",
    answer: "Yes, you can become a scorer by logging in as an official and following the instructions. if you are not an official, you can contact the admin to become an official. first you have to become a official."
  },
  {
    question: "Can I become a audience?",
    answer: "Of course, you can become a audience by logging in as a guest and following the instructions."
  },
  {
    question: "Can I become a admin?",
    answer: "Yes, you can become an admin by logging in as an official and following the instructions. if you are not an official, you can contact the admin to become an admin. first you have to become a official."
  },
  {
    question: "How to Register as a admin?",
    answer: "Go to the Profile page, tap on the 'Register as Admin' button, and follow the instructions. if you are not an official, you can contact the admin to become an admin. first you have to become a official."
  },
];

const CategoryCard = ({ icon, title, color }) => (
  <TouchableOpacity style={styles.categoryCard}>
    <View style={[styles.categoryIcon, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.categoryTitle}>{title}</Text>
  </TouchableOpacity>
);

const FAQItem = ({ question, answer }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={toggleExpand}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <MaterialCommunityIcons
          name={expanded ? "minus" : "plus"}
          size={20}
          color={expanded ? "#3B82F6" : "#64748B"}
        />
      </View>
      {expanded && (
        <Text style={styles.faqAnswer}>{answer}</Text>
      )}
    </TouchableOpacity>
  );
};

export default function HelpSupportScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const handleContact = (type) => {
    if (type === 'email') {
      Linking.openURL('mailto:contact@dhurbarajjoshi.in?subject=Need Help with BallTrack&body=I need help with...');
    } else if (type === 'call') {
      Linking.openURL('tel:+917796077314');
    }
  };

  const filteredFaqs = FAQ_DATA.filter(faq =>
    faq.question.toLowerCase().includes(search.toLowerCase().trim())
  );

  const displayFaqs = (search.length > 0 || showAllFaqs)
    ? filteredFaqs
    : filteredFaqs.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Guide Banner */}
        <TouchableOpacity
          style={styles.guideBanner}
          onPress={() => navigation.navigate('UserGuide')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1E293B', '#334155']}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerTitle}>App User Guide</Text>
              <Text style={styles.bannerSub}>Master Admin, Scorer & Audience roles</Text>
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>View Tutorial</Text>
                <MaterialCommunityIcons name="arrow-right" size={14} color="#3B82F6" />
              </View>
            </View>
            <MaterialCommunityIcons name="book-open-page-variant" size={60} color="rgba(255,255,255,0.1)" style={styles.bannerIcon} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesGrid}>
          <CategoryCard icon="cricket" title="Scoring" color="#F59E0B" />
          <CategoryCard icon="account-group" title="Teams" color="#3B82F6" />
          <CategoryCard icon="shield-check" title="Privacy" color="#10B981" />
          <CategoryCard icon="cog" title="Settings" color="#6366F1" />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={24} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help in faqs..."
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {displayFaqs.length > 0 ? (
            displayFaqs.map((faq, index) => (
              <FAQItem key={index} {...faq} />
            ))
          ) : (
            <Text style={styles.noResults}>No matches found for "{search}"</Text>
          )}

          {!showAllFaqs && search.length === 0 && (
            <TouchableOpacity
              style={styles.viewMoreBtn}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowAllFaqs(true);
              }}
            >
              <Text style={styles.viewMoreText}>View More FAQs</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}

          {showAllFaqs && search.length === 0 && (
            <TouchableOpacity
              style={styles.viewMoreBtn}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowAllFaqs(false);
              }}
            >
              <Text style={styles.viewMoreText}>View Less</Text>
              <MaterialCommunityIcons name="chevron-up" size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Support */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSubtitle}>Our support team is available 24/7</Text>

          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: '#3B82F6' }]}
              onPress={() => handleContact('email')}
            >
              <MaterialCommunityIcons name="email-outline" size={20} color="white" />
              <Text style={styles.contactBtnText}>Email Us</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: '#10B981' }]}
              onPress={() => handleContact('call')}
            >
              <MaterialCommunityIcons name="phone-outline" size={20} color="white" />
              <Text style={styles.contactBtnText}>Call Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BallTrack Support Center</Text>
          <Text style={styles.footerDev}>Developed by Dhurbaraj Joshi</Text>
          <Text style={styles.footerSub}>Version 1.0.1</Text>
        </View>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#bcdeffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'monospace',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 55,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1E293B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 15,
    marginTop: 5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  faqList: {
    marginBottom: 25,
  },
  faqItem: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#1E293B',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 8,
  },
  contactBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  noResults: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 20,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  footerDev: {
    fontSize: 12,
    color: '#CBD5E1',
    marginVertical: 6,
    textDecorationLine: 'underline',
    textDecorationColor: '#027007ff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'monospace',
  },
  footerSub: {
    fontSize: 12,
    color: '#CBD5E1',
    textDecorationLine: 'underline',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
  },
  viewMoreText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 4,
  },
  clearBtn: {
    padding: 5,
  },
  guideBanner: {
    marginBottom: 25,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  bannerGradient: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  bannerInfo: {
    flex: 1,
    zIndex: 1,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  bannerSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
    fontWeight: '600',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  bannerBadgeText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '800',
  },
  bannerIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
});
