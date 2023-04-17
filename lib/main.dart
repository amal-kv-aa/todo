import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

void main() => runApp(MyApp());

class Todo {
  String title;
  bool isDone;

  Todo({
    required this.title,
    this.isDone = false,
  });
}

class TodoGroup {
  String title;
  List<Todo> todos;

  TodoGroup({required this.title, required this.todos});
}

class MyApp extends StatelessWidget {
  final List<TodoGroup> todoGroups = [
    TodoGroup(
      title: 'Work',
      todos: [
        Todo(title: 'Finish project proposal'),
        Todo(title: 'Submit timesheet'),
        Todo(title: 'Attend meeting with client'),
      ],
    ),
    TodoGroup(
      title: 'Home',
      todos: [
        Todo(title: 'Buy groceries'),
        Todo(title: 'Clean bathroom'),
        Todo(title: 'Pay rent'),
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      builder: (context, index) => MaterialApp(
        title: 'Todo List',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.cyan,
        ),
        home: TodoListScreen(todoGroups: todoGroups),
      ),
      designSize: const Size(375, 812),
    );
  }
}

class TodoListScreen extends StatefulWidget {
  final List<TodoGroup> todoGroups;

  const TodoListScreen({required this.todoGroups});

  @override
  _TodoListScreenState createState() => _TodoListScreenState();
}

class _TodoListScreenState extends State<TodoListScreen> {
  int selectedGroupIndex = 0;
  bool onShowTodo = false;
  void _addTodo() {
    showDialog(
      context: context,
      builder: (context) {
        String newTodoTitle = '';
        return AlertDialog(
          title: const Text('Add Todo'),
          content: TextField(
            autofocus: true,
            onChanged: (value) {
              newTodoTitle = value;
            },
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  widget.todoGroups[selectedGroupIndex].todos
                      .add(Todo(title: newTodoTitle));
                });
                Navigator.of(context).pop();
              },
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
  }

  void _addTodoGroup() {
    showDialog(
      context: context,
      builder: (context) {
        String newTodoGroupTitle = '';
        return AlertDialog(
          title: const Text('Add Todo Group'),
          content: TextField(
            autofocus: true,
            onChanged: (value) {
              newTodoGroupTitle = value;
            },
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: (){
                setState(() {
                  widget.todoGroups
                      .add(TodoGroup(title: newTodoGroupTitle, todos: []));
                });
                Navigator.of(context).pop();
              },
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
  }

  void _deleteTodoGroup(int index) {
    setState(() {
      widget.todoGroups.removeAt(index);
      if (selectedGroupIndex >= widget.todoGroups.length) {
        selectedGroupIndex = widget.todoGroups.length - 1;
      }
    });
  }

  void _deleteTodoItem(int index) {
    setState(() {
      widget.todoGroups[selectedGroupIndex].todos.removeAt(index);
    });
  }

  Widget _buildTodoGroupItem(TodoGroup todoGroup, int index) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 11),
          child: GestureDetector(
            onTap: () {
              setState(() {
                onShowTodo = !onShowTodo;
                selectedGroupIndex = index;
              });
            },
            child: Container(
                height: 50.h,
                decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: const [
                      BoxShadow(
                          color: Color.fromARGB(83, 13, 13, 13),
                          offset: Offset(2, 2))
                    ],
                    borderRadius: BorderRadius.circular(10)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Padding(
                      padding: EdgeInsets.only(left: 10.w),
                      child: Text(todoGroup.title,
                          style: const TextStyle(
                              color: Colors.cyan, fontWeight: FontWeight.bold)),
                    ),
                    
                    Row(
                      children: [
                        IconButton(
                      onPressed: () {
                        _deleteTodoGroup(index);
                      },
                      icon: Icon(
                       Icons.delete,
                        size: 18.sp,
                        color: Colors.grey,
                      ),
                      splashRadius: 1,
                    ),
                        IconButton(
                          onPressed: () {},
                          icon: Icon(
                            index == selectedGroupIndex
                                ? Icons.arrow_drop_up_sharp
                                : Icons.arrow_drop_down_sharp,
                            size: 30.sp,
                            color: Colors.grey,
                          ),
                          splashRadius: 1,
                        ),
                      ],
                    ),
                  ],
                )),
          ),
        ),
        index == selectedGroupIndex
            ? ListView.builder(
                shrinkWrap: true,
                itemCount: widget.todoGroups[selectedGroupIndex].todos.length,
                itemBuilder: (context, index) {
                  log(widget.todoGroups[selectedGroupIndex].todos.isEmpty
                      .toString());
                  if (index == 0) {
                    return Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            ElevatedButton.icon(
                                onPressed: () {
                                  _addTodo();
                                },
                                icon: const Icon(Icons.add),
                                label: const Text("Add To do"),
                                style: ElevatedButton.styleFrom(
                                    foregroundColor: Colors.white),
                              ),
                              11.w.horizontalSpace
                          ],
                        ),
                        ListTile(
                          leading: Checkbox(
                            value: widget.todoGroups[selectedGroupIndex]
                                .todos[index].isDone,
                            onChanged: (value) {
                              setState(() {
                                widget.todoGroups[selectedGroupIndex]
                                    .todos[index].isDone = value!;
                              });
                            },
                          ),
                          title: Text(
                            widget.todoGroups[selectedGroupIndex].todos[index]
                                .title,
                            style: const TextStyle(color: Colors.cyan),
                          ),
                          trailing: IconButton(
                            onPressed: () {
                              _deleteTodoItem(index);
                            },
                            icon: Icon(
                              Icons.delete,
                              color: Colors.grey,
                              size: 16.sp,
                            ),
                          ),
                        ),
                      ],
                    );
                  }
                  return _buildTodoItem(
                      widget.todoGroups[selectedGroupIndex].todos[index],
                      index);
                },
              )
            : const SizedBox.shrink()
      ],
    );
  }

  Widget _buildTodoItem(Todo todo, int index) {
    return ListTile(
      leading: Checkbox(
        value: todo.isDone,
        onChanged: (value) {
          setState(() {
            todo.isDone = value!;
          });
        },
      ),
      title: Text(
        todo.title,
        style: const TextStyle(color: Colors.cyan),
      ),
      trailing: IconButton(
        onPressed: () {
          _deleteTodoItem(index);
        },
        icon: Icon(
          Icons.delete,
          color: Colors.grey,
          size: 16.sp,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.cyan,
        foregroundColor: Colors.white,
        title: Text(widget.todoGroups[selectedGroupIndex].title),
        actions: [
          ElevatedButton.icon(
            onPressed: () {
              _addTodoGroup();
            },
            icon: const Icon(Icons.add),
            label: const Text("Add to do Group"),
            style: ElevatedButton.styleFrom(
              foregroundColor: Colors.white,
                backgroundColor: Colors.cyan, elevation: 10),
          ),
          10.w.horizontalSpace
        ],
      ),
      body: ListView(
        children: [
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Todo Groups',
              style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
            ),
          ),
          widget.todoGroups.isNotEmpty ?
          ListView.builder(
            physics: const BouncingScrollPhysics(),
            shrinkWrap: true,
            itemCount: widget.todoGroups.length,
            itemBuilder: (context, index) {
              if (widget.todoGroups[index].todos.isEmpty) {
                return Column(
                  children: [
                    _buildTodoGroupItem(widget.todoGroups[index], index),
                    index == selectedGroupIndex
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              ElevatedButton.icon(
                                onPressed: () {
                                  _addTodo();
                                },
                                icon: const Icon(Icons.add),
                                label: const Text("Add To do"),
                                style: ElevatedButton.styleFrom(
                                    foregroundColor: Colors.white),
                              )
                              ,  11.w.horizontalSpace
                            ],
                          )
                        : const SizedBox.shrink()
                  ],
                );
              }
              return _buildTodoGroupItem(widget.todoGroups[index], index);
            },
          ) : const Center(
            child: Text("Empty"),
          )
        ],
      ),
    );
  }
}
