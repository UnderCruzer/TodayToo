import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../main.dart';

class PhotoScreen extends StatefulWidget {
  const PhotoScreen({super.key});

  @override
  State<PhotoScreen> createState() => _PhotoScreenState();
}

class _PhotoScreenState extends State<PhotoScreen> {
  String _language = 'ja';
  String? _elderId;
  File? _image;
  String? _aiResponse;
  bool _analyzing = false;
  final _tts = FlutterTts();
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  Future<void> _load() async {
    final id = await StorageService.getElderId();
    final lang = await StorageService.getLanguage();
    if (mounted) setState(() { _elderId = id; _language = lang; });
  }

  Future<void> _pickAndAnalyze() async {
    if (_elderId == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_language == 'ja' ? '設定でお名前を登録してください' : '설정에서 이름을 먼저 등록해주세요'),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ));
      return;
    }
    final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 75, maxWidth: 1280);
    if (picked == null) return;

    setState(() { _image = File(picked.path); _aiResponse = null; _analyzing = true; });

    try {
      final response = await ApiService.sendPhoto(_elderId!, picked.path, _language);
      if (mounted) {
        setState(() { _aiResponse = response; _analyzing = false; });
        await _tts.setLanguage(_language == 'ja' ? 'ja-JP' : 'ko-KR');
        await _tts.setSpeechRate(0.85);
        await _tts.speak(response);
      }
    } catch (e) {
      debugPrint('[photo] $e');
      if (mounted) {
        setState(() {
          _analyzing = false;
          _aiResponse = _language == 'ja'
              ? 'エラーが発生しました。サーバーに接続できません。'
              : '오류가 발생했어요. 서버에 연결할 수 없어요.';
        });
      }
    }
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
            floating: false,
            pinned: true,
            backgroundColor: kPrimary,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                isJa ? '📷 写真を送る' : '📷 사진 보내기',
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700),
              ),
              titlePadding: const EdgeInsets.only(left: 20, bottom: 16),
              collapseMode: CollapseMode.pin,
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // 사진 업로드 영역
                  GestureDetector(
                    onTap: _pickAndAnalyze,
                    child: Container(
                      width: double.infinity,
                      height: _image != null ? 220 : 180,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: kPrimaryLight, width: 2),
                        boxShadow: [BoxShadow(color: kPrimary.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, 4))],
                      ),
                      child: _image != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(18),
                              child: Image.file(_image!, fit: BoxFit.cover),
                            )
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 64, height: 64,
                                  decoration: BoxDecoration(color: kPrimaryLight, borderRadius: BorderRadius.circular(32)),
                                  child: const Icon(Icons.camera_alt_rounded, color: kPrimary, size: 32),
                                ),
                                const SizedBox(height: 14),
                                Text(isJa ? '写真をアップロード' : '사진 올리기',
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: kText)),
                                const SizedBox(height: 6),
                                Text(isJa ? 'ギャラリーから選択' : '갤러리에서 선택',
                                    style: const TextStyle(fontSize: 14, color: kTextSub)),
                              ],
                            ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // AI 분석 결과
                  if (_analyzing)
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12)]),
                      child: Row(
                        children: [
                          const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: kPrimary)),
                          const SizedBox(width: 16),
                          Text(isJa ? 'AI 分析中...' : 'AI 분석 중...',
                              style: const TextStyle(fontSize: 16, color: kTextSub)),
                        ],
                      ),
                    )
                  else if (_aiResponse != null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: kPrimaryLight,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(isJa ? '今日もね より' : '오늘도요 에서',
                              style: const TextStyle(fontSize: 13, color: kPrimary, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 10),
                          Text(_aiResponse!,
                              style: const TextStyle(fontSize: 22, color: kText, height: 1.5, fontWeight: FontWeight.w500)),
                          const SizedBox(height: 16),
                          Align(
                            alignment: Alignment.centerRight,
                            child: GestureDetector(
                              onTap: _pickAndAnalyze,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(color: kPrimary, borderRadius: BorderRadius.circular(20)),
                                child: Text(isJa ? '別の写真' : '다른 사진',
                                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                              ),
                            ),
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
