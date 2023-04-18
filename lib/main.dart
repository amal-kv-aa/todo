import 'dart:developer';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'package:todo_app/home.dart';
import 'package:todo_app/provider/home_provider.dart';
import 'package:todo_app/todo_model.dart';

Future<void> main() async {
  await Hive.initFlutter();
  Hive.registerAdapter(TodoGroupAdapter());
  Hive.registerAdapter(TodoAdapter());
  await Hive.openBox('hive_todo');

  runApp(MultiProvider(
    providers: [ChangeNotifierProvider(create: (_) => HomeProvider())],
    child: MyApp(),
  ));
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      builder: (context, index) => MaterialApp(
        title: 'Todo List',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.cyan,
        ),
        home: const Home(),
      ),
      designSize: const Size(375, 812),
    );
  }
}
