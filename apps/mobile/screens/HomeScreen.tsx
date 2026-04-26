import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { sendReply, getTodayMessage } from '../lib/api';
import { getStoredElderId, getStoredLanguage } from '../lib/storage';

const COLORS = {
  primary: '#7F77DD',
  primaryLight: '#EEEDFE',
  background: '#FAFAFA',
  white: '#FFFFFF',
  gray100: '#F5F5F5',
  gray300: '#DDD',
  gray500: '#888',
  gray700: '#333',
};

function formatDateLocale(date: Date, language: 'ja' | 'ko'): string {
  return date.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

export default function HomeScreen() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ja');
  const [elderId, setElderId] = useState<string | null>(null);
  const [todayMessage, setTodayMessage] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [id, lang] = await Promise.all([
          getStoredElderId(),
          getStoredLanguage(),
        ]);
        setElderId(id);
        setLanguage(lang);

        if (id) {
          const msg = await getTodayMessage(id).catch(() => null);
          setTodayMessage(
            msg ??
              (lang === 'ja'
                ? 'おはようございます！今日もよろしくお願いします😊'
                : '좋은 아침이에요! 오늘도 잘 부탁드려요 😊')
          );
        } else {
          setTodayMessage(
            lang === 'ja'
              ? '設定からお名前を登録してください😊'
              : '설정에서 이름을 등록해주세요 😊'
          );
        }
      })();
    }, [])
  );

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        language === 'ja' ? 'アクセス許可が必要です' : '접근 권한이 필요해요'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSend() {
    if (!replyText.trim() && !imageUri) return;
    if (!elderId) {
      Alert.alert(
        language === 'ja' ? '設定が必要です' : '설정이 필요합니다',
        language === 'ja'
          ? 'まず設定画面でIDを入力してください'
          : '설정 화면에서 ID를 먼저 입력해주세요'
      );
      return;
    }

    setSending(true);
    try {
      await sendReply(elderId, replyText, imageUri ?? undefined);
      setReplyText('');
      setImageUri(null);
      Alert.alert(
        language === 'ja' ? '送りました！' : '보냈어요!',
        language === 'ja'
          ? '返事をありがとうございます。しばらくお待ちください😊'
          : '답장 감사해요. 잠시 기다려주세요 😊'
      );
    } catch {
      Alert.alert(
        language === 'ja' ? 'エラー' : '오류',
        language === 'ja'
          ? 'もう一度試してください'
          : '다시 시도해주세요'
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 날짜 */}
        <Text style={styles.dateText}>
          {formatDateLocale(new Date(), language)}
        </Text>

        {/* AI 메시지 카드 */}
        <View style={styles.messageCard}>
          <Text style={styles.aiLabel}>
            {language === 'ja' ? '今日もね より' : '오늘도요 에서'}
          </Text>
          <Text style={styles.messageText}>{todayMessage}</Text>
        </View>

        {/* 사진 미리보기 */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <TouchableOpacity
              style={styles.imageRemoveButton}
              onPress={() => setImageUri(null)}
            >
              <Text style={styles.imageRemoveText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.imagePreviewLabel}>
              {language === 'ja' ? '📸 写真を選択しました' : '📸 사진을 선택했어요'}
            </Text>
          </View>
        )}

        {/* 답장 입력 */}
        <TextInput
          style={styles.input}
          placeholder={language === 'ja' ? '返事を書く...' : '답장 쓰기...'}
          placeholderTextColor={COLORS.gray500}
          multiline
          value={replyText}
          onChangeText={setReplyText}
          textAlignVertical="top"
        />

        {/* 사진 첨부 버튼 */}
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Text style={styles.photoButtonText}>
            {language === 'ja' ? '写真を送る 📸' : '사진 보내기 📸'}
          </Text>
        </TouchableOpacity>

        {/* 전송 버튼 */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.sendButtonText}>
              {language === 'ja' ? '送る' : '보내기'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  dateText: {
    fontSize: 18,
    color: COLORS.gray500,
    marginBottom: 16,
  },
  messageCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  aiLabel: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 26,
    color: COLORS.gray700,
    lineHeight: 38,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  imagePreviewLabel: {
    fontSize: 16,
    color: COLORS.gray700,
    flex: 1,
  },
  imageRemoveButton: {
    marginRight: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveText: {
    fontSize: 14,
    color: COLORS.gray700,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    padding: 16,
    fontSize: 22,
    minHeight: 100,
    backgroundColor: COLORS.white,
    marginBottom: 12,
    color: COLORS.gray700,
  },
  photoButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  photoButtonText: {
    fontSize: 20,
    color: COLORS.primary,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 22,
    color: COLORS.white,
    fontWeight: '600',
  },
});
