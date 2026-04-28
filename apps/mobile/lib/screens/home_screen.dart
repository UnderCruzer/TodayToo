import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

enum _VoiceState { idle, recording, thinking, speaking }

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  String? _elderId;
  String _language = 'ja';
  String _aiMessage = '';
  _VoiceState _voiceState = _VoiceState.idle;

  final _tts = FlutterTts();
  final _recorder = AudioRecorder();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initTts();
    _loadAndGreet();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tts.stop();
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _initTts() async {
    await _tts.setSharedInstance(true);
    _tts.setCompletionHandler(
      () { if (mounted) setState(() => _voiceState = _VoiceState.idle); },
    );
    _tts.setErrorHandler(
      (_) { if (mounted) setState(() => _voiceState = _VoiceState.idle); },
    );
  }

  Future<void> _loadAndGreet() async {
    final id = await StorageService.getElderId();
    final lang = await StorageService.getLanguage();

    setState(() {
      _elderId = id;
      _language = lang;
    });

    if (id == null) {
      setState(() => _aiMessage = lang == 'ja'
          ? '設定からお名前を登録してください😊'
          : '설정에서 이름을 등록해주세요 😊');
      return;
    }

    final msg = await ApiService.getTodayMessage(id).catchError((_) => null);
    final greeting = msg ??
        (lang == 'ja'
            ? 'おはようございます！今日もよろしくお願いします😊'
            : '좋은 아침이에요! 오늘도 잘 부탁드려요 😊');

    setState(() => _aiMessage = greeting);
    _speak(greeting);
  }

  Future<void> _speak(String text) async {
    await _tts.stop();
    setState(() => _voiceState = _VoiceState.speaking);
    await _tts.setLanguage(_language == 'ja' ? 'ja-JP' : 'ko-KR');
    await _tts.setSpeechRate(0.85);
    await _tts.speak(text);
  }

  Future<void> _startRecording() async {
    if (_elderId == null) {
      _alert(_language == 'ja' ? '設定が必要です' : '설정이 필요합니다',
          _language == 'ja' ? '設定画面でIDを入力してください' : '설정 화면에서 이름을 먼저 등록해주세요');
      return;
    }

    final mic = await Permission.microphone.request();
    if (!mic.isGranted) {
      _alert(_language == 'ja' ? 'マイクの許可が必要です' : '마이크 권한이 필요해요', '');
      return;
    }

    await _tts.stop();
    final dir = await getTemporaryDirectory();
    final path = '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';

    await _recorder.start(
      const RecordConfig(
        encoder: AudioEncoder.aacLc,
        sampleRate: 16000,
        numChannels: 1,
      ),
      path: path,
    );
    setState(() => _voiceState = _VoiceState.recording);
  }

  Future<void> _stopAndSend() async {
    if (_voiceState != _VoiceState.recording) return;
    setState(() => _voiceState = _VoiceState.thinking);

    try {
      final path = await _recorder.stop();
      if (path == null || _elderId == null) throw Exception('No recording');

      final aiText = await ApiService.sendVoice(_elderId!, path, _language);
      File(path).deleteSync();

      setState(() => _aiMessage = aiText);
      _speak(aiText);
    } catch (e) {
      debugPrint('[voice] $e');
      setState(() => _voiceState = _VoiceState.idle);
      _alert(_language == 'ja' ? 'エラーが発生しました' : '오류가 발생했어요', '');
    }
  }

  void _alert(String title, String body) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title, style: const TextStyle(fontSize: 22)),
        content: body.isNotEmpty
            ? Text(body, style: const TextStyle(fontSize: 18))
            : null,
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              _language == 'ja' ? 'OK' : '확인',
              style: const TextStyle(fontSize: 18, color: Color(0xFF7F77DD)),
            ),
          ),
        ],
      ),
    );
  }

  String get _buttonLabel {
    switch (_voiceState) {
      case _VoiceState.recording:
        return _language == 'ja' ? '話し中…' : '말하는 중…';
      case _VoiceState.thinking:
        return _language == 'ja' ? '考え中…' : '생각 중…';
      case _VoiceState.speaking:
        return _language == 'ja' ? '話しています' : '말하는 중';
      case _VoiceState.idle:
        return _language == 'ja' ? '話しかける' : '말하기';
    }
  }

  Color get _buttonColor {
    if (_voiceState == _VoiceState.recording) return const Color(0xFFE57373);
    return const Color(0xFF7F77DD);
  }

  bool get _isBusy =>
      _voiceState == _VoiceState.thinking || _voiceState == _VoiceState.speaking;

  String _formatDate() {
    final now = DateTime.now();
    if (_language == 'ja') {
      const wd = ['月', '火', '水', '木', '金', '土', '日'];
      return '${now.year}年${now.month}月${now.day}日（${wd[now.weekday - 1]}）';
    }
    const wd = ['월', '화', '수', '목', '금', '토', '일'];
    return '${now.year}년 ${now.month}월 ${now.day}일 ${wd[now.weekday - 1]}요일';
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),

            // 날짜
            Text(
              _formatDate(),
              style: const TextStyle(fontSize: 18, color: Color(0xFF888888)),
            ),
            const SizedBox(height: 20),

            // AI 메시지 카드 (큰 글씨 — 시각 보조)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: const Color(0xFFEEEDFE),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _language == 'ja' ? '今日もね より' : '오늘도요 에서',
                    style: const TextStyle(
                      fontSize: 15,
                      color: Color(0xFF7F77DD),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _aiMessage.isEmpty
                        ? (_language == 'ja' ? 'しばらくお待ちください…' : '잠시만 기다려주세요…')
                        : _aiMessage,
                    style: const TextStyle(
                      fontSize: 28,
                      color: Color(0xFF333333),
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),

            const Spacer(),

            // 마이크 버튼 — 누르고 말하기
            Center(
              child: GestureDetector(
                onTapDown: _isBusy ? null : (_) => _startRecording(),
                onTapUp: _isBusy ? null : (_) => _stopAndSend(),
                onTapCancel: _isBusy ? null : () => _stopAndSend(),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    color: _isBusy ? _buttonColor.withOpacity(0.6) : _buttonColor,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: _buttonColor.withOpacity(0.4),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_voiceState == _VoiceState.thinking)
                        const SizedBox(
                          width: 52,
                          height: 52,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 3,
                          ),
                        )
                      else
                        Text(
                          _voiceState == _VoiceState.recording ? '🔴' : '🎙️',
                          style: const TextStyle(fontSize: 52),
                        ),
                      const SizedBox(height: 8),
                      Text(
                        _buttonLabel,
                        style: const TextStyle(
                          fontSize: 18,
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),
            Center(
              child: Text(
                _language == 'ja'
                    ? 'ボタンを押しながら話してください'
                    : '버튼을 누르고 말씀하세요',
                style: const TextStyle(fontSize: 16, color: Color(0xFF888888)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
