import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getConversations } from '../lib/api';
import { getStoredElderId, getStoredLanguage } from '../lib/storage';
import type { Conversation } from '@oneuldo/types';

export default function HistoryScreen() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ja');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [id, lang] = await Promise.all([
        getStoredElderId(),
        getStoredLanguage(),
      ]);
      setLanguage(lang);
      if (id) {
        const data = await getConversations(id).catch(() => []);
        setConversations(data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#7F77DD" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {language === 'ja' ? '会話の記録' : '대화 기록'}
      </Text>

      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {language === 'ja'
              ? 'まだ会話がありません'
              : '아직 대화가 없습니다'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.dateLabel}>
              {new Date(item.createdAt).toLocaleDateString(
                language === 'ja' ? 'ja-JP' : 'ko-KR'
              )}
            </Text>
            <Text style={styles.question}>{item.question}</Text>
            {item.answer ? (
              <Text style={styles.answer}>{item.answer}</Text>
            ) : null}
            {(item.photoUrls as string[]).length > 0 ? (
              <Image
                source={{ uri: (item.photoUrls as string[])[0] }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 26,
    fontWeight: '300',
    color: '#333',
    padding: 20,
    paddingBottom: 8,
  },
  list: { padding: 16, paddingTop: 8 },
  empty: { fontSize: 20, color: '#888', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  dateLabel: { fontSize: 14, color: '#AAA', marginBottom: 8 },
  question: { fontSize: 20, color: '#7F77DD', marginBottom: 6, lineHeight: 28 },
  answer: { fontSize: 20, color: '#333', lineHeight: 30 },
  thumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 10,
  },
});
