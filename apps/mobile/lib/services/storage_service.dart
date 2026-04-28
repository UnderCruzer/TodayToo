import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _keyElderId = 'elder_id';
  static const _keyLanguage = 'language';
  static const _keyName = 'name';

  static Future<String?> getElderId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyElderId);
  }

  static Future<void> setElderId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyElderId, id);
  }

  static Future<String> getLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyLanguage) ?? 'ja';
  }

  static Future<void> setLanguage(String lang) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyLanguage, lang);
  }

  static Future<String?> getName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyName);
  }

  static Future<void> setName(String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyName, name);
  }

  static Future<bool> isRegistered() async {
    final id = await getElderId();
    return id != null && id.isNotEmpty;
  }
}
