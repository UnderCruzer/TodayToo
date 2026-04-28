import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../main.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _nameController = TextEditingController();
  String _language = 'ja';
  bool _registered = false;
  bool _loading = false;
  bool _inviteLoading = false;
  String? _currentName;
  String? _elderId;
  String? _inviteToken;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final id = await StorageService.getElderId();
    final lang = await StorageService.getLanguage();
    final name = await StorageService.getName();
    if (!mounted) return;
    setState(() {
      _elderId = id;
      _registered = id != null;
      _language = lang;
      _currentName = name;
      if (name != null) _nameController.text = name;
    });
  }

  Future<void> _register() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      _alert(_language == 'ja' ? 'お名前を入力してください' : '이름을 입력해주세요');
      return;
    }
    setState(() => _loading = true);
    try {
      final data = await ApiService.registerElder(name, _language);
      final id = data['elderId'] as String;
      await Future.wait([
        StorageService.setElderId(id),
        StorageService.setLanguage(_language),
        StorageService.setName(name),
      ]);
      if (mounted) setState(() { _elderId = id; _registered = true; _currentName = name; });
      _alert(_language == 'ja' ? '登録しました！✅' : '등록했어요! ✅');
    } catch (e) {
      _alert(_language == 'ja' ? 'エラーが発生しました' : '오류가 발생했어요');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generateInvite() async {
    if (_elderId == null) {
      _alert(_language == 'ja' ? '先に登録してください' : '먼저 등록을 완료해주세요');
      return;
    }
    setState(() { _inviteLoading = true; _inviteToken = null; });
    try {
      final token = await ApiService.createInviteToken(_elderId!);
      if (mounted) setState(() => _inviteToken = token);
    } catch (e) {
      _alert(_language == 'ja' ? 'コード生成に失敗しました' : '코드 생성에 실패했어요');
    } finally {
      if (mounted) setState(() => _inviteLoading = false);
    }
  }

  void _copyToken() {
    if (_inviteToken == null) return;
    Clipboard.setData(ClipboardData(text: _inviteToken!));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_language == 'ja' ? 'コードをコピーしました' : '코드를 복사했어요'),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: kPrimary,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _alert(String msg) {
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Text(msg, style: const TextStyle(fontSize: 17, color: kText)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('확인', style: TextStyle(fontSize: 16, color: kPrimary, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isJa = _language == 'ja';
    final top = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: kBg,
      body: CustomScrollView(
        slivers: [
          // ── 앱바 ──────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 110,
            pinned: true,
            backgroundColor: kPrimary,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: EdgeInsets.only(left: 20, bottom: 14, top: top),
              title: Text(
                isJa ? '設定' : '설정',
                style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
              ),
              collapseMode: CollapseMode.pin,
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [kPrimaryDark, kPrimary],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 20, 18, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── 등록 상태 배지 ─────────────────────────────────
                  if (_registered && _currentName != null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: kGreen.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: kGreen.withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_rounded, color: kGreen, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '${isJa ? '登録済み: ' : '등록됨: '}$_currentName',
                              style: const TextStyle(fontSize: 15, color: kGreen, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // ── 섹션: 프로필 수정 ───────────────────────────────
                  _SectionLabel(label: isJa ? 'プロフィール' : '프로필'),
                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(isJa ? 'お名前' : '이름',
                            style: const TextStyle(fontSize: 12, color: kTextSub, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _nameController,
                          style: const TextStyle(fontSize: 22, color: kText, fontWeight: FontWeight.w600),
                          decoration: InputDecoration(
                            hintText: isJa ? '田中花子' : '홍길동',
                            hintStyle: TextStyle(color: kTextSub.withValues(alpha: 0.45), fontSize: 20),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE5E5EF)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: kPrimary, width: 1.8),
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(isJa ? '言語' : '언어',
                            style: const TextStyle(fontSize: 12, color: kTextSub, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 10),
                        Row(children: [
                          _LangChip(label: '日本語', selected: _language == 'ja',
                              onTap: () { setState(() => _language = 'ja'); StorageService.setLanguage('ja'); }),
                          const SizedBox(width: 8),
                          _LangChip(label: '한국어', selected: _language == 'ko',
                              onTap: () { setState(() => _language = 'ko'); StorageService.setLanguage('ko'); }),
                        ]),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // 등록/수정 버튼
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _register,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimary,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: kPrimary.withValues(alpha: 0.4),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                      child: _loading
                          ? const SizedBox(width: 20, height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(
                              _registered ? (isJa ? '更新する' : '수정하기') : (isJa ? '登録する' : '등록하기'),
                              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                            ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── 섹션: 가족 초대 ────────────────────────────────
                  _SectionLabel(label: isJa ? '家族・保護者の招待' : '가족 / 보호자 초대'),
                  _Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 36, height: 36,
                              decoration: BoxDecoration(color: kPrimaryLight, borderRadius: BorderRadius.circular(10)),
                              child: const Icon(Icons.group_add_rounded, color: kPrimary, size: 18),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(isJa ? '招待コードを発行' : '초대 코드 생성',
                                      style: const TextStyle(fontSize: 15, color: kText, fontWeight: FontWeight.w700)),
                                  Text(
                                    isJa ? 'LINEでコードを送るだけ' : 'LINE으로 코드를 보내면 등록 완료',
                                    style: const TextStyle(fontSize: 12, color: kTextSub),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        if (_inviteToken != null) ...[
                          // 코드 표시 박스
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: kPrimaryLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    _inviteToken!,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                      color: kPrimary,
                                      letterSpacing: 2,
                                    ),
                                  ),
                                ),
                                GestureDetector(
                                  onTap: _copyToken,
                                  child: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: kPrimary,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(Icons.copy_rounded, color: Colors.white, size: 16),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFFBEB),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFFFE082)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('💡', style: TextStyle(fontSize: 14)),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    isJa
                                        ? 'LINEで @TodayTooBot に\n「登録 [コード]」と送ってください'
                                        : 'LINE에서 @TodayTooBot 에게\n「등록 [코드]」를 보내주세요',
                                    style: const TextStyle(fontSize: 13, color: Color(0xFF7A5F00), height: 1.5),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),
                        ],

                        SizedBox(
                          width: double.infinity,
                          height: 46,
                          child: OutlinedButton(
                            onPressed: _inviteLoading ? null : _generateInvite,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: kPrimary,
                              side: const BorderSide(color: kPrimary, width: 1.5),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _inviteLoading
                                ? const SizedBox(width: 18, height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: kPrimary))
                                : Text(
                                    _inviteToken != null
                                        ? (isJa ? '새로 발급하기' : '새로 발급하기')
                                        : (isJa ? 'コードを発行する' : '코드 발급하기'),
                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── 섹션: 앱 정보 ───────────────────────────────────
                  _SectionLabel(label: isJa ? 'アプリ情報' : '앱 정보'),
                  _Card(
                    child: Column(
                      children: [
                        _InfoRow(
                          icon: Icons.info_outline_rounded,
                          label: isJa ? 'バージョン' : '버전',
                          value: '1.0.0',
                        ),
                        const Divider(height: 1, color: Color(0xFFF0F0F5)),
                        _InfoRow(
                          icon: Icons.favorite_outline_rounded,
                          label: isJa ? '開発元' : '개발사',
                          value: 'TodayToo',
                        ),
                        const Divider(height: 1, color: Color(0xFFF0F0F5)),
                        _InfoRow(
                          icon: Icons.translate_rounded,
                          label: isJa ? 'サポート言語' : '지원 언어',
                          value: '日本語 · 한국어',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: kTextSub, letterSpacing: 0.5)),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: child,
    );
  }
}

class _LangChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _LangChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          height: 44,
          decoration: BoxDecoration(
            color: selected ? kPrimary : kBg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: selected ? kPrimary : const Color(0xFFE5E5EF), width: 1.5),
          ),
          alignment: Alignment.center,
          child: Text(label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: selected ? Colors.white : kTextSub,
              )),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: kTextSub),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(fontSize: 14, color: kText, fontWeight: FontWeight.w500)),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 14, color: kTextSub)),
        ],
      ),
    );
  }
}
