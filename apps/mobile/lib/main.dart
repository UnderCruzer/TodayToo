import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/memoir_screen.dart';
import 'screens/photo_screen.dart';
import 'screens/settings_screen.dart';

// ─── 디자인 시스템 ────────────────────────────────────────────────────────────
const kPrimary      = Color(0xFF5144D3);
const kPrimaryDark  = Color(0xFF3B2FC0);
const kPrimaryLight = Color(0xFFECEBFF);
const kBg           = Color(0xFFF5F5FA);
const kText         = Color(0xFF1C1C2E);
const kTextSub      = Color(0xFF8E8EA8);
const kGreen        = Color(0xFF0AC47D);
const kRed          = Color(0xFFFF5C5C);

void main() => runApp(const OneuldoApp());

class OneuldoApp extends StatelessWidget {
  const OneuldoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '오늘도요',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: kPrimary, primary: kPrimary),
        scaffoldBackgroundColor: kBg,
        useMaterial3: true,
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: Colors.white,
          elevation: 0,
          height: 64,
          indicatorColor: kPrimaryLight,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            final selected = states.contains(WidgetState.selected);
            return TextStyle(
              fontSize: 11,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
              color: selected ? kPrimary : kTextSub,
            );
          }),
          iconTheme: WidgetStateProperty.resolveWith((states) {
            final selected = states.contains(WidgetState.selected);
            return IconThemeData(color: selected ? kPrimary : kTextSub, size: 22);
          }),
        ),
      ),
      home: const MainNavigator(),
    );
  }
}

class MainNavigator extends StatefulWidget {
  const MainNavigator({super.key});
  @override
  State<MainNavigator> createState() => _MainNavigatorState();
}

class _MainNavigatorState extends State<MainNavigator> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [HomeScreen(), MemoirScreen(), PhotoScreen(), SettingsScreen()],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFEAEAF0), width: 0.5)),
        ),
        child: NavigationBar(
          selectedIndex: _index,
          onDestinationSelected: (i) => setState(() => _index = i),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.chat_bubble_outline_rounded),
              selectedIcon: Icon(Icons.chat_bubble_rounded),
              label: '오늘',
            ),
            NavigationDestination(
              icon: Icon(Icons.auto_stories_outlined),
              selectedIcon: Icon(Icons.auto_stories),
              label: '회고록',
            ),
            NavigationDestination(
              icon: Icon(Icons.add_photo_alternate_outlined),
              selectedIcon: Icon(Icons.add_photo_alternate_rounded),
              label: '사진',
            ),
            NavigationDestination(
              icon: Icon(Icons.settings_outlined),
              selectedIcon: Icon(Icons.settings_rounded),
              label: '설정',
            ),
          ],
        ),
      ),
    );
  }
}
