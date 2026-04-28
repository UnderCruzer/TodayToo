import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  String _language = 'ja';
  List<Map<String, dynamic>> _conversations = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final id = await StorageService.getElderId();
    final lang = await StorageService.getLanguage();
    if (!mounted) return;
    setState(() => _language = lang);

    if (id == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }

    try {
      final data = await ApiService.getConversations(id);
      if (mounted) setState(() => _conversations = data);
    } catch (e) {
      debugPrint('[history] $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        title: Text(
          _language == 'ja' ? '会話履歴' : '대화 기록',
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w300),
        ),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF333333),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF7F77DD)),
            )
          : _conversations.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('🌸', style: TextStyle(fontSize: 48)),
                      const SizedBox(height: 16),
                      Text(
                        _language == 'ja'
                            ? 'まだ会話がありません'
                            : '아직 대화 기록이 없어요',
                        style: const TextStyle(
                          fontSize: 18,
                          color: Color(0xFF888888),
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _conversations.length,
                  itemBuilder: (ctx, i) {
                    final conv = _conversations[i];
                    return _ConversationCard(
                      question: conv['question'] as String? ?? '',
                      answer: conv['answer'] as String?,
                      emotionTags:
                          (conv['emotionTags'] as List?)?.cast<String>() ?? [],
                    );
                  },
                ),
    );
  }
}

class _ConversationCard extends StatelessWidget {
  final String question;
  final String? answer;
  final List<String> emotionTags;

  const _ConversationCard({
    required this.question,
    this.answer,
    required this.emotionTags,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // AI 질문
          Text(
            question,
            style: const TextStyle(
              fontSize: 20,
              color: Color(0xFF7F77DD),
              fontWeight: FontWeight.w500,
            ),
          ),
          // 어르신 대답
          if (answer != null) ...[
            const SizedBox(height: 12),
            Text(
              answer!,
              style: const TextStyle(
                fontSize: 20,
                color: Color(0xFF333333),
                height: 1.4,
              ),
            ),
          ],
          // 감정 태그
          if (emotionTags.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: emotionTags
                  .map(
                    (tag) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEEDFE),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        tag,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF7F77DD),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}
