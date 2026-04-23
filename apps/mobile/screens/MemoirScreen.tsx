import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { getMemoirs } from '../lib/api';
import { getStoredElderId, getStoredLanguage } from '../lib/storage';
import type { Memoir } from '@oneuldo/types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function MemoirScreen() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ja');
  const [memoirs, setMemoirs] = useState<Memoir[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [id, lang] = await Promise.all([
        getStoredElderId(),
        getStoredLanguage(),
      ]);
      setLanguage(lang);
      if (id) {
        const data = await getMemoirs(id).catch(() => []);
        setMemoirs(data);
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
        {language === 'ja' ? '私の物語' : '나의 이야기'}
      </Text>

      <FlatList
        data={memoirs}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.empty}>
              {language === 'ja'
                ? 'まだ物語がありません\n毎月末に作られます'
                : '아직 이야기가 없습니다\n매달 말에 만들어져요'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              Linking.openURL(`${BASE_URL}/memoir/${item.id}`)
            }
          >
            <View style={styles.cardTop}>
              <Text style={styles.monthText}>{item.month}</Text>
              <Text style={styles.chapterCount}>
                {(item.chapters as Array<unknown>).length}
                {language === 'ja' ? '章' : '챕터'}
              </Text>
            </View>
            <Text style={styles.openText}>
              {language === 'ja' ? '読む →' : '읽기 →'}
            </Text>
          </TouchableOpacity>
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
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  empty: { fontSize: 20, color: '#888', textAlign: 'center', lineHeight: 30 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthText: { fontSize: 22, color: '#333', fontWeight: '300' },
  chapterCount: { fontSize: 16, color: '#7F77DD' },
  openText: { fontSize: 18, color: '#7F77DD' },
});
