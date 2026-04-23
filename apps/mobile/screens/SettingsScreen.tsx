import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import {
  getStoredElderId,
  setStoredElderId,
  getStoredLanguage,
  setStoredLanguage,
} from '../lib/storage';

export default function SettingsScreen() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ja');
  const [elderId, setElderId] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const [id, lang] = await Promise.all([
        getStoredElderId(),
        getStoredLanguage(),
      ]);
      if (id) setElderId(id);
      setLanguage(lang);
    })();
  }, []);

  async function handleSave() {
    if (!elderId.trim()) {
      Alert.alert(
        language === 'ja' ? 'IDを入力してください' : 'ID를 입력해주세요'
      );
      return;
    }
    await Promise.all([
      setStoredElderId(elderId.trim()),
      setStoredLanguage(language),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleLanguage(lang: 'ja' | 'ko') {
    setLanguage(lang);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {language === 'ja' ? '設定' : '설정'}
      </Text>

      {/* 언어 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {language === 'ja' ? '言語' : '언어'}
        </Text>
        <View style={styles.langButtons}>
          <TouchableOpacity
            style={[
              styles.langButton,
              language === 'ja' && styles.langButtonActive,
            ]}
            onPress={() => toggleLanguage('ja')}
          >
            <Text
              style={[
                styles.langButtonText,
                language === 'ja' && styles.langButtonTextActive,
              ]}
            >
              日本語
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.langButton,
              language === 'ko' && styles.langButtonActive,
            ]}
            onPress={() => toggleLanguage('ko')}
          >
            <Text
              style={[
                styles.langButtonText,
                language === 'ko' && styles.langButtonTextActive,
              ]}
            >
              한국어
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 어르신 ID 입력 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {language === 'ja' ? 'ユーザーID' : '사용자 ID'}
        </Text>
        <TextInput
          style={styles.input}
          value={elderId}
          onChangeText={setElderId}
          placeholder={
            language === 'ja'
              ? 'IDを入力してください'
              : 'ID를 입력해주세요'
          }
          placeholderTextColor="#AAA"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>
          {saved
            ? (language === 'ja' ? '保存しました ✓' : '저장했어요 ✓')
            : (language === 'ja' ? '保存する' : '저장하기')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.version}>今日もね / 오늘도요 v1.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 20 },
  title: {
    fontSize: 26,
    fontWeight: '300',
    color: '#333',
    marginBottom: 32,
  },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
  },
  langButtons: { flexDirection: 'row', gap: 12 },
  langButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  langButtonActive: {
    borderColor: '#7F77DD',
    backgroundColor: '#EEEDFE',
  },
  langButtonText: { fontSize: 20, color: '#888' },
  langButtonTextActive: { color: '#7F77DD', fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    backgroundColor: '#FFF',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#7F77DD',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { fontSize: 22, color: '#FFF', fontWeight: '600' },
  version: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    marginTop: 40,
  },
});
