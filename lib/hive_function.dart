import 'dart:developer';
import 'package:flutter/cupertino.dart';
import 'package:hive_flutter/adapters.dart';
import 'package:todo_app/todo_model.dart';

class TodoFunctions with ChangeNotifier {
  Box<TodoGroup> todoGroubox = Hive.box('TO_Do');
  static ValueNotifier<List<TodoGroup>> studentListNotifier = ValueNotifier([]);

  Future<void> addToDo(TodoGroup value) async {
     await todoGroubox.add(value);
   await getAllTodos();
    log(studentListNotifier.value[0].title);
  }

  Future<void> addTodoItem(int index, String title, Todo todos) async {
    todoGroubox.values.elementAt(index).todos.add(todos);
     studentListNotifier.value.clear();
    studentListNotifier.value.addAll(todoGroubox.values);
    studentListNotifier.notifyListeners();
    log("${studentListNotifier.value[index].todos[0].title}called");
  }

  Future<void> getAllTodos() async {
    studentListNotifier.value.clear();
    studentListNotifier.value.addAll(todoGroubox.values);
    log(studentListNotifier.value.first.title);
    studentListNotifier.notifyListeners();
  }

  Future<void> deleteTodoGroup(int index) async {
    todoGroubox.deleteAt(index);
    await getAllTodos();
  }

  Future<void> deleteTodoItem(int index, int groupIndex) async {
    todoGroubox.values.elementAt(groupIndex).todos.removeAt(index);
    await getAllTodos();
  }
}
