import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

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
  String? _currentName;

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
    setState(() {
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
      await Future.wait([
        StorageService.setElderId(data['elderId'] as String),
        StorageService.setLanguage(_language),
        StorageService.setName(name),
      ]);
      setState(() {
        _registered = true;
        _currentName = name;
      });
      _alert(_language == 'ja' ? '登録しました！' : '등록했어요!');
    } catch (e) {
      debugPrint('[register] $e');
      _alert(_language == 'ja' ? 'エラーが発生しました' : '오류가 발생했어요');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _alert(String msg) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        content: Text(msg, style: const TextStyle(fontSize: 20)),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        title: Text(
          _language == 'ja' ? '設定' : '설정',
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w300),
        ),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF333333),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 등록 상태 배지
            if (_registered)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEEDFE),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_language == 'ja' ? '✅ 登録済み: ' : '✅ 등록됨: '}${_currentName ?? ''}',
                  style: const TextStyle(fontSize: 18, color: Color(0xFF7F77DD)),
                ),
              ),
            const SizedBox(height: 32),

            // 이름 입력
            Text(
              _language == 'ja' ? 'お名前' : '이름',
              style: const TextStyle(
                fontSize: 18,
                color: Color(0xFF888888),
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _nameController,
              style: const TextStyle(fontSize: 26),
              decoration: InputDecoration(
                hintText: _language == 'ja' ? '例：田中花子' : '예: 홍길동',
                hintStyle: const TextStyle(color: Color(0xFFBBBBBB), fontSize: 22),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFDDDDDD)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF7F77DD), width: 2),
                ),
                contentPadding: const EdgeInsets.all(20),
              ),
            ),
            const SizedBox(height: 32),

            // 언어 선택
            Text(
              _language == 'ja' ? '言語 / 언어' : '언어 / 言語',
              style: const TextStyle(
                fontSize: 18,
                color: Color(0xFF888888),
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _LangButton(
                  label: '日本語',
                  selected: _language == 'ja',
                  onTap: () {
                    setState(() => _language = 'ja');
                    StorageService.setLanguage('ja');
                  },
                ),
                const SizedBox(width: 12),
                _LangButton(
                  label: '한국어',
                  selected: _language == 'ko',
                  onTap: () {
                    setState(() => _language = 'ko');
                    StorageService.setLanguage('ko');
                  },
                ),
              ],
            ),
            const SizedBox(height: 40),

            // 등록/수정 버튼
            SizedBox(
              width: double.infinity,
              height: 70,
              child: ElevatedButton(
                onPressed: _loading ? null : _register,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7F77DD),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFF7F77DD).withOpacity(0.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(
                        _registered
                            ? (_language == 'ja' ? '更新する' : '수정하기')
                            : (_language == 'ja' ? '登録する' : '등록하기'),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LangButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _LangButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          height: 64,
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF7F77DD) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? const Color(0xFF7F77DD) : const Color(0xFFDDDDDD),
              width: 2,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : const Color(0xFF888888),
            ),
          ),
        ),
      ),
    );
  }
}
