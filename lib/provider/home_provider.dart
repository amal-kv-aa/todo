import 'package:flutter/cupertino.dart';
import 'package:todo_app/todo_model.dart';

class Homeprovider with ChangeNotifier{

 int selectedIndex = 0;
 List<TodoGroup>? toDoGroupList=[
  TodoGroup(title: "amew", todos: [Todo(title: "maksm",isDone: false),Todo(title: "maksm",isDone: false),Todo(title: "maksm",isDone: false),Todo(title: "maksm",isDone: false)])
 ,TodoGroup(title: "ne22w", todos: [Todo(title: "maksm",isDone: false),Todo(title: "maksm",isDone: false),Todo(title: "maksm",isDone: false),Todo(title: "maksm",isDone: false)])
 ,TodoGroup(title: "newal,", todos: [Todo(title: "maksm",isDone: false),Todo(title: "maksm",isDone: false),Todo(title: "maksm",isDone: false),Todo(title: "maksm",isDone: false)])
 ];
 void updateCurrentIndex(int index){
  selectedIndex = index;
  notifyListeners();
 }


}