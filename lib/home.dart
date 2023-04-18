import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import 'package:todo_app/provider/home_provider.dart';
import 'package:todo_app/todo_model.dart';
import 'package:tuple/tuple.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.cyan,
        foregroundColor: Colors.white,
        title: const Text(""),
        actions: [
          ElevatedButton.icon(
            onPressed: () {
              _addTodoGroup(context);
            },
            icon: const Icon(Icons.add),
            label: const Text("Add to do Group"),
            style: ElevatedButton.styleFrom(
                foregroundColor: Colors.white,
                backgroundColor: Colors.cyan,
                elevation: 10),
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
          Selector<Homeprovider, Tuple2<int, List<TodoGroup>>>(
              selector: (_, provider) =>
                  Tuple2(provider.selectedIndex, provider.toDoGroupList ?? []),
              builder: (context, value, child) {
                return ListView.builder(
                  physics: const BouncingScrollPhysics(),
                  shrinkWrap: true,
                  itemCount: value.item2.length,
                  itemBuilder: (context, index) {
                    if (true) {
                      return Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                vertical: 5, horizontal: 11),
                            child: GestureDetector(
                              onTap: () {
                                context
                                    .read<Homeprovider>()
                                    .updateCurrentIndex(index);
                              },
                              child: Container(
                                decoration: BoxDecoration(
                                    color: Colors.white,
                                    boxShadow: const [
                                      BoxShadow(
                                          color: Color.fromARGB(83, 13, 13, 13),
                                          offset: Offset(2, 2))
                                    ],
                                    borderRadius: BorderRadius.circular(10)),
                                child:  ExpansionTile(
                                  trailing: IconButton(onPressed: (){}, icon: const Icon(Icons.delete)),
                                  title:  Text(value.item2[index].title),
                                  subtitle:
                                      const Text('Todos'),
                                  controlAffinity:
                                      ListTileControlAffinity.leading,
                                  children: 
                                  List.generate(value.item2[value.item1].todos.length, (index){
                                    return
                                      ListTile(
                                            leading: Checkbox(
                                              value: value
                                                  .item2[value.item1]
                                                  .todos[index]
                                                  .isDone,
                                              onChanged: (v) {
                                                // setState(() {
                                                //   widget.todoGroups[selectedGroupIndex]
                                                //       .todos[index].isDone = value!;
                                                // });
                                                value
                                                    .item2[value.item1]
                                                    .todos[index]
                                                    .isDone = v!;
                                              },
                                            ),
                                            title: Text(
                                              value.item2[value.item1]
                                                  .todos[index].title,
                                              style: const TextStyle(
                                                  color: Colors.black),
                                            ),
                                            trailing: IconButton(
                                              onPressed: () {
                                                // _deleteTodoItem(index);
                                              },
                                              icon: Icon(
                                                Icons.delete,
                                                color: Colors.grey,
                                                size: 16.sp,
                                              ),
                                            ),
                                           );

                                  })
                                  // const <Widget>[
                                  //   ListTile(
                                  //       title: Text('This is tile number 3')),
                                  // ],
                                ),
                               
                              ),
                            ),
                          ),

                          ///==============================///
                        ],
                      );
                    }
                  },
                );
              })
          // : const Center(
          //     child: Text("Empty"),
          //   )
        ],
      ),
    );
  }

  void _addTodoGroup(BuildContext context) {
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
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
  }

//=======todo==list===add===//
  void _addTodo(BuildContext context) {
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
                // setState(() {
                //   widget.todoGroups[selectedGroupIndex].todos
                //       .add(Todo(title: newTodoTitle));
                // });
                Navigator.of(context).pop();
              },
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
  }
}




// index == value.item1
                          //     ? ListView.builder(
                          //         shrinkWrap: true,
                          //         itemCount:
                          //             value.item2[value.item1].todos.length,
                          //         itemBuilder: (context, index) {
                          //           if (index == 0) {
                          //             return Column(
                          //               children: [
                          //                 Row(
                          //                   mainAxisAlignment:
                          //                       MainAxisAlignment.end,
                          //                   children: [
                          //                     ElevatedButton.icon(
                          //                       onPressed: () {
                          //                         _addTodo(context);
                          //                       },
                          //                       icon: const Icon(Icons.add),
                          //                       label:
                          //                           const Text("Add To do"),
                          //                       style: ElevatedButton
                          //                           .styleFrom(
                          //                               foregroundColor:
                          //                                   Colors.white),
                          //                     ),
                          //                     11.w.horizontalSpace
                          //                   ],
                          //                 ),
                                          // ListTile(
                                          //   leading: Checkbox(
                                          //     value: value
                                          //         .item2[value.item1]
                                          //         .todos[index]
                                          //         .isDone,
                                          //     onChanged: (v) {
                                          //       // setState(() {
                                          //       //   widget.todoGroups[selectedGroupIndex]
                                          //       //       .todos[index].isDone = value!;
                                          //       // });
                                          //       value
                                          //           .item2[value.item1]
                                          //           .todos[index]
                                          //           .isDone = v!;
                                          //     },
                                          //   ),
                                          //   title: Text(
                                          //     value.item2[value.item1]
                                          //         .todos[index].title,
                                          //     style: const TextStyle(
                                          //         color: Colors.cyan),
                                          //   ),
                                          //   trailing: IconButton(
                                          //     onPressed: () {
                                          //       // _deleteTodoItem(index);
                                          //     },
                                          //     icon: Icon(
                                          //       Icons.delete,
                                          //       color: Colors.grey,
                                          //       size: 16.sp,
                                          //     ),
                                          //   ),
                                          //  ),
                          //               ],
                          //             );
                          //           }
                          //           return const SizedBox();
                          //           //  _buildTodoItem(
                          //           //     widget.todoGroups[selectedGroupIndex].todos[index],
                          //           //     index);
                          //         },
                          //       )
                          //     : const SizedBox.shrink()