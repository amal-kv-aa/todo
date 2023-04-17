import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/container.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import 'package:todo_app/hive_function.dart';
import 'package:todo_app/provider/home_provider.dart';
import 'package:todo_app/todo_model.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.cyan,
        foregroundColor: Colors.white,
        title: Text(""),
        actions: [
          ElevatedButton.icon(
            onPressed: () {
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
          Selector<Homeprovider,List<TodoGroup>>(
            selector: (_,provider)=>provider.toDoGroupList??[],
            builder: (context, value, child) {
              return 
               ListView.builder(
                        physics: const BouncingScrollPhysics(),
                        shrinkWrap: true,
                        itemCount: value.length,
                        itemBuilder: (context, index) {
                          if (value[index].todos.isEmpty) {
                            return Column(
                              children: [
                                _buildTodoGroupItem(value[index], index),
                                index == selectedGroupIndex
                                    ? Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          ElevatedButton.icon(
                                            onPressed: () {
                                              _addTodo(index);
                                            },
                                            icon: const Icon(Icons.add),
                                            label: const Text("Add To do"),
                                            style: ElevatedButton.styleFrom(
                                                foregroundColor: Colors.white),
                                          ),
                                          11.w.horizontalSpace
                                        ],
                                      )
                                    : const SizedBox.shrink()
                              ],
                            );
                          }
                          
                          return _buildTodoGroupItem(
                              widget.todoGroups[index], index);
                        },
                      ),
            },
          );
              : const Center(
                  child: Text("Empty"),
                )
        ],
      ),
    );
  }
}