import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../main.dart';

class _Msg {
  final bool isAi;
  final String text;
  _Msg({required this.isAi, required this.text});
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _elderId;
  String _language = 'ja';
  final List<_Msg> _messages = [];
  bool _thinking = false;
  final _tts = FlutterTts();
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  bool _greeted = false;

  @override
  void initState() {
    super.initState();
    _initTts();
    _loadAndGreet();
  }

  @override
  void dispose() {
    _tts.stop();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _initTts() async {
    _tts.setCompletionHandler(() {});
    _tts.setErrorHandler((_) {});
  }

  Future<void> _loadAndGreet() async {
    if (_greeted) return;
    final id = await StorageService.getElderId();
    final lang = await StorageService.getLanguage();
    if (!mounted) return;
    setState(() { _elderId = id; _language = lang; _greeted = true; });

    String greeting;
    if (id == null) {
      greeting = lang == 'ja'
          ? '⚙️ 設定からお名前を登録してください'
          : '⚙️ 설정에서 이름을 먼저 등록해주세요';
    } else {
      final msg = await ApiService.getTodayMessage(id).catchError((_) => null);
      greeting = msg ?? (lang == 'ja' ? 'おはようございます！今日もよろしくお願いします😊' : '좋은 아침이에요! 오늘도 잘 부탁드려요 😊');
    }
    if (mounted) {
      setState(() => _messages.add(_Msg(isAi: true, text: greeting)));
      _speak(greeting);
    }
  }

  Future<void> _speak(String text) async {
    await _tts.stop();
    await _tts.setLanguage(_language == 'ja' ? 'ja-JP' : 'ko-KR');
    await _tts.setSpeechRate(0.85);
    await _tts.speak(text);
  }

  Future<void> _sendText() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _thinking) return;
    if (_elderId == null) {
      setState(() => _messages.add(_Msg(isAi: true,
          text: _language == 'ja' ? '先に設定で名前を登録してください' : '먼저 설정에서 이름을 등록해주세요')));
      return;
    }
    _textController.clear();
    FocusScope.of(context).unfocus();
    setState(() {
      _messages.add(_Msg(isAi: false, text: text));
      _thinking = true;
    });
    _scrollToBottom();
    try {
      final aiText = await ApiService.sendChat(_elderId!, text, _language);
      if (mounted) {
        setState(() {
          _messages.add(_Msg(isAi: true, text: aiText));
          _thinking = false;
        });
        _scrollToBottom();
        _speak(aiText);
      }
    } catch (e) {
      debugPrint('[chat] $e');
      if (mounted) setState(() => _thinking = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _formatDate() {
    final now = DateTime.now();
    if (_language == 'ja') {
      const wd = ['月', '火', '水', '木', '金', '土', '日'];
      return '${now.month}月${now.day}日（${wd[now.weekday - 1]}）';
    }
    const wd = ['월', '화', '수', '목', '금', '토', '일'];
    return '${now.month}월 ${now.day}일 ${wd[now.weekday - 1]}요일';
  }

  @override
  Widget build(BuildContext context) {
    final isJa = _language == 'ja';
    final top = MediaQuery.of(context).padding.top;
    final bottom = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: kBg,
      resizeToAvoidBottomInset: true,
      body: Column(
        children: [
          // ── 헤더 ──────────────────────────────────────────────────
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [kPrimaryDark, kPrimary],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            padding: EdgeInsets.only(top: top + 14, left: 20, right: 20, bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_formatDate(),
                    style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.7), fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text(isJa ? '今日もね' : '오늘도요',
                    style: const TextStyle(fontSize: 22, color: Colors.white, fontWeight: FontWeight.w800)),
              ],
            ),
          ),

          // ── 채팅 목록 ──────────────────────────────────────────────
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
              itemCount: _messages.length + (_thinking ? 1 : 0),
              itemBuilder: (_, i) {
                if (i == _messages.length) return const _ThinkingBubble();
                return _ChatBubble(isAi: _messages[i].isAi, text: _messages[i].text);
              },
            ),
          ),

          // ── 입력창 ─────────────────────────────────────────────────
          Container(
            color: Colors.white,
            padding: EdgeInsets.only(left: 14, right: 14, top: 10, bottom: bottom + 10),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    enabled: !_thinking,
                    style: const TextStyle(fontSize: 16, color: kText),
                    decoration: InputDecoration(
                      hintText: isJa ? '話しかけてみてください…' : '말을 입력해보세요…',
                      hintStyle: const TextStyle(color: kTextSub, fontSize: 15),
                      filled: true,
                      fillColor: kBg,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    ),
                    onSubmitted: (_) => _sendText(),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _thinking ? null : _sendText,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 46, height: 46,
                    decoration: BoxDecoration(
                      color: _thinking ? kPrimary.withValues(alpha: 0.4) : kPrimary,
                      borderRadius: BorderRadius.circular(23),
                    ),
                    child: const Icon(Icons.arrow_upward_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final bool isAi;
  final String text;
  const _ChatBubble({required this.isAi, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: isAi ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (isAi) ...[
            Container(
              width: 30, height: 30,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [kPrimaryDark, kPrimary]),
                borderRadius: BorderRadius.circular(15),
              ),
              child: const Icon(Icons.smart_toy_outlined, color: Colors.white, size: 15),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              decoration: BoxDecoration(
                color: isAi ? Colors.white : kPrimary,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: isAi ? Radius.zero : const Radius.circular(16),
                  bottomRight: isAi ? const Radius.circular(16) : Radius.zero,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 16,
                  color: isAi ? kText : Colors.white,
                  height: 1.5,
                ),
              ),
            ),
          ),
          if (!isAi) const SizedBox(width: 8),
        ],
      ),
    );
  }
}

class _ThinkingBubble extends StatelessWidget {
  const _ThinkingBubble();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [kPrimaryDark, kPrimary]),
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Icon(Icons.smart_toy_outlined, color: Colors.white, size: 15),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 6, offset: const Offset(0, 2))],
            ),
            child: const SizedBox(
              width: 36, height: 14,
              child: CircularProgressIndicator(strokeWidth: 2, color: kPrimary),
            ),
          ),
        ],
      ),
    );
  }
}
