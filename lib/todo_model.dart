import 'package:hive_flutter/adapters.dart';

part "todo_model.g.dart";


@HiveType(typeId: 0)
class TodoGroup {
  @HiveField(0)
  String title;
  @HiveField(1)
  List<Todo> todos;
  TodoGroup({required this.title, required this.todos});
}

@HiveType(typeId: 1)
class Todo {
  @HiveField(0)
  String title;
  @HiveField(1)
  bool isDone;
  Todo({
    required this.title,
    this.isDone = false,
  });
}
