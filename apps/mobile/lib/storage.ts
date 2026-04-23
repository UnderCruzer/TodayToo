import AsyncStorage from '@react-native-async-storage/async-storage';

const ELDER_ID_KEY = '@oneuldo:elderId';
const LANGUAGE_KEY = '@oneuldo:language';

export async function getStoredElderId(): Promise<string | null> {
  return AsyncStorage.getItem(ELDER_ID_KEY);
}

export async function setStoredElderId(id: string): Promise<void> {
  await AsyncStorage.setItem(ELDER_ID_KEY, id);
}

export async function getStoredLanguage(): Promise<'ja' | 'ko'> {
  const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
  return (lang as 'ja' | 'ko') ?? 'ja';
}

export async function setStoredLanguage(lang: 'ja' | 'ko'): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}
