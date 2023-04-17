import 'package:flutter/cupertino.dart';
import 'package:todo_app/todo_model.dart';

class Homeprovider with ChangeNotifier{

 int selectedIndex = 0;
 List<TodoGroup>? toDoGroupList;
 void updateCurrentIndex(int index){
  selectedIndex = index;
  notifyListeners();
 }


}