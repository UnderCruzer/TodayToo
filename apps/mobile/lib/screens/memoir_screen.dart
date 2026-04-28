import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class MemoirScreen extends StatefulWidget {
  const MemoirScreen({super.key});

  @override
  State<MemoirScreen> createState() => _MemoirScreenState();
}

class _MemoirScreenState extends State<MemoirScreen> {
  String _language = 'ja';
  List<Map<String, dynamic>> _memoirs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final id = await StorageService.getElderId();
    final lang = await StorageService.getLanguage();
    setState(() => _language = lang);

    if (id == null) {
      setState(() => _loading = false);
      return;
    }

    try {
      final data = await ApiService.getMemoirs(id);
      setState(() => _memoirs = data);
    } catch (e) {
      debugPrint('[memoir] $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        title: Text(
          _language == 'ja' ? '思い出の記録' : '회고록',
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
          : _memoirs.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('📖', style: TextStyle(fontSize: 48)),
                      const SizedBox(height: 16),
                      Text(
                        _language == 'ja'
                            ? 'まだ回顧録がありません'
                            : '아직 회고록이 없어요',
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
                  itemCount: _memoirs.length,
                  itemBuilder: (ctx, i) {
                    final memoir = _memoirs[i];
                    return _MemoirCard(
                      month: memoir['month'] as String? ?? '',
                      chapters:
                          (memoir['chapters'] as List?)
                              ?.cast<Map<String, dynamic>>() ??
                          [],
                      language: _language,
                    );
                  },
                ),
    );
  }
}

class _MemoirCard extends StatelessWidget {
  final String month;
  final List<Map<String, dynamic>> chapters;
  final String language;

  const _MemoirCard({
    required this.month,
    required this.chapters,
    required this.language,
  });

  String _formatMonth() {
    final parts = month.split('-');
    if (parts.length != 2) return month;
    final y = parts[0];
    final m = int.tryParse(parts[1]) ?? parts[1];
    return language == 'ja' ? '$y年${m}月' : '$y년 ${m}월';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 월 헤더
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Color(0xFFEEEDFE),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Text(
              _formatMonth(),
              style: const TextStyle(
                fontSize: 22,
                color: Color(0xFF7F77DD),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          // 챕터 미리보기 (최대 2개)
          ...chapters.take(2).map(
            (ch) => Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (ch['title'] != null)
                    Text(
                      ch['title'] as String,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF333333),
                      ),
                    ),
                  if (ch['content'] != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      ch['content'] as String,
                      style: const TextStyle(
                        fontSize: 17,
                        color: Color(0xFF555555),
                        height: 1.5,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
