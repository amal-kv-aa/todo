import 'package:flutter/cupertino.dart';
import 'package:todo_app/todo_model.dart';

class HomeProvider with ChangeNotifier {
  int selectedIndex = 0;
  List<TodoGroup> toDoGroupList = [];

  void updateCurrentIndex(int index) {
    selectedIndex = index;
    notifyListeners();
  }

  addGroupToHive(box, groupTitle) {
    List<TodoGroup> todoGroup = [TodoGroup(title: groupTitle, todos: [])];
    toDoGroupList.add(todoGroup);
    notifyListeners();
    box.put('group', todoGroup);
  }

  getGroupsFromHive(box) {
    TodoGroup data = box.get('group');
    print(data);
  }
}
