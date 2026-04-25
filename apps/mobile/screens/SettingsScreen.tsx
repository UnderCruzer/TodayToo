import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  getStoredElderId,
  setStoredElderId,
  getStoredLanguage,
  setStoredLanguage,
} from '../lib/storage';
import { registerElder } from '../lib/api';

export default function SettingsScreen() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ja');
  const [name, setName] = useState('');
  const [elderId, setElderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const [id, lang] = await Promise.all([getStoredElderId(), getStoredLanguage()]);
      setElderId(id);
      setLanguage(lang);
    })();
  }, []);

  async function handleRegister() {
    if (!name.trim()) {
      Alert.alert(language === 'ja' ? 'お名前を入力してください' : '이름을 입력해주세요');
      return;
    }
    setLoading(true);
    try {
      const { elderId: newId } = await registerElder(name.trim(), language);
      await Promise.all([setStoredElderId(newId), setStoredLanguage(language)]);
      setElderId(newId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert(language === 'ja' ? '登録に失敗しました' : '등록에 실패했어요');
    } finally {
      setLoading(false);
    }
  }

  async function handleLanguageChange(lang: 'ja' | 'ko') {
    setLanguage(lang);
    await setStoredLanguage(lang);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{language === 'ja' ? '設定' : '설정'}</Text>

      {/* 언어 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{language === 'ja' ? '言語' : '언어'}</Text>
        <View style={styles.langButtons}>
          {(['ja', 'ko'] as const).map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.langButton, language === lang && styles.langButtonActive]}
              onPress={() => handleLanguageChange(lang)}
            >
              <Text style={[styles.langButtonText, language === lang && styles.langButtonTextActive]}>
                {lang === 'ja' ? '日本語' : '한국어'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 등록 상태 */}
      {elderId ? (
        <View style={styles.section}>
          <View style={styles.registeredBox}>
            <Text style={styles.registeredIcon}>✓</Text>
            <Text style={styles.registeredText}>
              {language === 'ja' ? '登録済みです' : '등록되어 있어요'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.reregisterButton}
            onPress={() => setElderId(null)}
          >
            <Text style={styles.reregisterText}>
              {language === 'ja' ? '再登録する' : '다시 등록하기'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {language === 'ja' ? 'お名前' : '이름'}
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={language === 'ja' ? '例：田中さん' : '예: 홍길동'}
            placeholderTextColor="#AAA"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {saved
                  ? (language === 'ja' ? '登録しました ✓' : '등록했어요 ✓')
                  : (language === 'ja' ? '登録する' : '등록하기')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.version}>今日もね / 오늘도요 v1.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 20 },
  title: { fontSize: 26, fontWeight: '300', color: '#333', marginBottom: 32 },
  section: { marginBottom: 28 },
  sectionLabel: { fontSize: 18, color: '#666', marginBottom: 12 },
  langButtons: { flexDirection: 'row', gap: 12 },
  langButton: {
    flex: 1, borderWidth: 1.5, borderColor: '#DDD',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  langButtonActive: { borderColor: '#7F77DD', backgroundColor: '#EEEDFE' },
  langButtonText: { fontSize: 20, color: '#888' },
  langButtonTextActive: { color: '#7F77DD', fontWeight: '500' },
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 12,
    padding: 16, fontSize: 20, backgroundColor: '#FFF', color: '#333', marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#7F77DD', borderRadius: 12, padding: 18, alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 22, color: '#FFF', fontWeight: '600' },
  registeredBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EEEDFE', borderRadius: 12, padding: 16, marginBottom: 12,
  },
  registeredIcon: { fontSize: 22, color: '#7F77DD' },
  registeredText: { fontSize: 20, color: '#7F77DD' },
  reregisterButton: { padding: 8 },
  reregisterText: { fontSize: 16, color: '#AAA', textAlign: 'center' },
  version: { fontSize: 14, color: '#CCC', textAlign: 'center', marginTop: 40 },
});
