import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

// 실기기 테스트: --dart-define=API_URL=http://<서버IP>:3000
// 안드로이드 에뮬레이터 기본값: 10.0.2.2 (호스트 머신)
// iOS 시뮬레이터 기본값: 127.0.0.1
const _baseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:3000',
);

class ApiService {
  static Future<Map<String, dynamic>> registerElder(
    String name,
    String language,
  ) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/elder/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'language': language}),
    );
    if (res.statusCode != 200) {
      throw Exception('Register failed: ${res.statusCode}');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<String?> getTodayMessage(String elderId) async {
    final res = await http.get(Uri.parse('$_baseUrl/api/elder/$elderId/today'));
    if (res.statusCode != 200) return null;
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['message'] as String?;
  }

  // 녹음 파일 → Whisper STT → AI 응답 텍스트
  static Future<String> sendVoice(
    String elderId,
    String audioPath,
    String language,
  ) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$_baseUrl/api/elder/voice'),
    )
      ..fields['elderId'] = elderId
      ..fields['language'] = language
      ..files.add(
        await http.MultipartFile.fromPath('audio', audioPath, filename: 'voice.m4a'),
      );

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode != 200) {
      throw Exception('Voice API failed: ${response.statusCode}');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['text'] as String;
  }

  static Future<List<Map<String, dynamic>>> getConversations(
    String elderId,
  ) async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/elder/$elderId/conversations'),
    );
    if (res.statusCode != 200) throw Exception('Fetch failed: ${res.statusCode}');
    return (jsonDecode(res.body) as List).cast<Map<String, dynamic>>();
  }

  static Future<List<Map<String, dynamic>>> getMemoirs(String elderId) async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/elder/$elderId/memoirs'),
    );
    if (res.statusCode != 200) throw Exception('Fetch failed: ${res.statusCode}');
    return (jsonDecode(res.body) as List).cast<Map<String, dynamic>>();
  }

  static Future<void> registerPushToken(
    String elderId,
    String token,
  ) async {
    await http.post(
      Uri.parse('$_baseUrl/api/elder/push-token'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'elderId': elderId, 'pushToken': token}),
    );
  }
}
