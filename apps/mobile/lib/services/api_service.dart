import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

const _baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://172.30.1.70:3000');

class ApiService {
  static Future<Map<String, dynamic>> registerElder(String name, String language) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/elder/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'language': language}),
    );
    if (res.statusCode != 200) throw Exception('Register failed: ${res.statusCode}');
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<String?> getTodayMessage(String elderId) async {
    final res = await http.get(Uri.parse('$_baseUrl/api/elder/$elderId/today'));
    if (res.statusCode != 200) return null;
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['message'] as String?;
  }

  static Future<String> sendVoice(String elderId, String audioPath, String language) async {
    final request = http.MultipartRequest('POST', Uri.parse('$_baseUrl/api/elder/voice'))
      ..fields['elderId'] = elderId
      ..fields['language'] = language
      ..files.add(await http.MultipartFile.fromPath('audio', audioPath, filename: 'voice.m4a'));

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode != 200) throw Exception('Voice API failed: ${response.statusCode}');
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['text'] as String;
  }

  static Future<String> sendChat(String elderId, String message, String language) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/elder/chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'elderId': elderId, 'message': message, 'language': language}),
    );
    if (res.statusCode != 200) throw Exception('Chat failed: ${res.statusCode}');
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['text'] as String;
  }

  static Future<String> sendPhoto(String elderId, String imagePath, String language) async {
    final request = http.MultipartRequest('POST', Uri.parse('$_baseUrl/api/elder/photo'))
      ..fields['elderId'] = elderId
      ..fields['language'] = language
      ..files.add(await http.MultipartFile.fromPath('image', imagePath, filename: 'photo.jpg'));

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode != 200) throw Exception('Photo API failed: ${response.statusCode}');
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['text'] as String;
  }

  static Future<List<Map<String, dynamic>>> getConversations(String elderId) async {
    final res = await http.get(Uri.parse('$_baseUrl/api/elder/$elderId/conversations'));
    if (res.statusCode != 200) throw Exception('Fetch failed: ${res.statusCode}');
    return (jsonDecode(res.body) as List).cast<Map<String, dynamic>>();
  }

  static Future<List<Map<String, dynamic>>> getMemoirs(String elderId) async {
    final res = await http.get(Uri.parse('$_baseUrl/api/elder/$elderId/memoirs'));
    if (res.statusCode != 200) throw Exception('Fetch failed: ${res.statusCode}');
    return (jsonDecode(res.body) as List).cast<Map<String, dynamic>>();
  }

  static Future<String> createInviteToken(String elderId) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/elder/invite'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'elderId': elderId}),
    );
    if (res.statusCode != 200) throw Exception('Invite failed: ${res.statusCode}');
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['token'] as String;
  }

  static Future<void> registerPushToken(String elderId, String token) async {
    await http.post(
      Uri.parse('$_baseUrl/api/elder/push-token'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'elderId': elderId, 'pushToken': token}),
    );
  }
}
