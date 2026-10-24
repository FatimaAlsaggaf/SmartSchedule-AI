import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/user_provider.dart';
import 'providers/schedule_provider.dart';
import 'providers/comment_provider.dart';
import 'screens/login_screen.dart';
import 'screens/faculty_home_screen.dart';
import 'screens/committee_home_screen.dart';
import 'screens/student_home_screen.dart'; // ✅ 1. Import Student Screen

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => ScheduleProvider()),
        ChangeNotifierProvider(create: (_) => CommentProvider()),
      ],
      child: MaterialApp(
        title: 'SmartSchedule',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.indigo,
          fontFamily: 'Roboto',
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),

        // ✅ 2. CHANGED: Point directly to StudentHomeScreen for testing
        home: const StudentHomeScreen(),

        routes: {
          '/login': (context) => const LoginScreen(),
          '/faculty-home': (context) => const FacultyHomeScreen(),
          '/committee-home': (context) => const CommitteeHomeScreen(),
          // ✅ 3. Add the student route
          '/student-home': (context) => const StudentHomeScreen(),
        },
      ),
    );
  }
}
