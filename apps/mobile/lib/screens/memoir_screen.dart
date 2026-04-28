import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../main.dart';

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
    if (!mounted) return;
    setState(() => _language = lang);

    if (id == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final data = await ApiService.getMemoirs(id);
      if (mounted) setState(() => _memoirs = data);
    } catch (e) {
      debugPrint('[memoir] $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatMonth(String month) {
    final parts = month.split('-');
    if (parts.length != 2) return month;
    final y = parts[0];
    final m = int.tryParse(parts[1]) ?? 0;
    return _language == 'ja' ? '$y年${m}月' : '$y년 ${m}월';
  }

  @override
  Widget build(BuildContext context) {
    final isJa = _language == 'ja';
    return Scaffold(
      backgroundColor: kBg,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            pinned: true,
            backgroundColor: kPrimary,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(isJa ? '📖 思い出の記録' : '📖 나의 회고록',
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
              titlePadding: const EdgeInsets.only(left: 20, bottom: 16),
              collapseMode: CollapseMode.pin,
            ),
          ),
          if (_loading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: kPrimary)),
            )
          else if (_memoirs.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('📖', style: TextStyle(fontSize: 56)),
                    const SizedBox(height: 16),
                    Text(isJa ? 'まだ回顧録がありません' : '아직 회고록이 없어요',
                        style: const TextStyle(fontSize: 18, color: kTextSub)),
                    const SizedBox(height: 8),
                    Text(isJa ? 'AIと会話すると自動で作成されます' : 'AI와 대화하면 자동으로 만들어져요',
                        style: const TextStyle(fontSize: 14, color: kTextSub)),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) {
                    final memoir = _memoirs[i];
                    final chapters = (memoir['chapters'] as List?)?.cast<Map<String, dynamic>>() ?? [];
                    final isShared = i % 2 == 0; // 예시 공유 상태 (실제론 memoir 데이터에서)
                    return _MemoirCard(
                      month: _formatMonth(memoir['month'] as String? ?? ''),
                      chapters: chapters,
                      isShared: isShared,
                      language: _language,
                    );
                  },
                  childCount: _memoirs.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _MemoirCard extends StatelessWidget {
  final String month;
  final List<Map<String, dynamic>> chapters;
  final bool isShared;
  final String language;

  const _MemoirCard({
    required this.month,
    required this.chapters,
    required this.isShared,
    required this.language,
  });

  @override
  Widget build(BuildContext context) {
    final isJa = language == 'ja';
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: kPrimary.withValues(alpha: 0.07), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 월 헤더
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [kPrimaryDark, kPrimary], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(month, style: const TextStyle(fontSize: 20, color: Colors.white, fontWeight: FontWeight.w800)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(isShared ? Icons.people_rounded : Icons.lock_rounded,
                          color: Colors.white, size: 13),
                      const SizedBox(width: 4),
                      Text(
                        isShared
                            ? (isJa ? '家族と共有中' : '가족 공유중')
                            : (isJa ? '自分だけ' : '나만 보기'),
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 챕터 내용
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ...chapters.take(2).map((ch) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (ch['title'] != null)
                        Text(ch['title'] as String,
                            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: kText)),
                      if (ch['content'] != null) ...[
                        const SizedBox(height: 6),
                        Text(ch['content'] as String,
                            style: const TextStyle(fontSize: 15, color: kTextSub, height: 1.5),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis),
                      ],
                    ],
                  ),
                )),
                if (chapters.length > 2) ...[
                  const SizedBox(height: 4),
                  Text('+${chapters.length - 2}${isJa ? '章 もっと見る' : '챕터 더보기'}',
                      style: const TextStyle(fontSize: 13, color: kPrimary, fontWeight: FontWeight.w600)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
