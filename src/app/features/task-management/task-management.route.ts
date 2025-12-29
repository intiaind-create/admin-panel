import { Component } from "@angular/core";
import { TaskFormComponent } from "./tasks/tasks-create/task-form.component";
import { Routes } from "@angular/router";
import { TaskListComponent } from "./tasks/task-list/tasks-list.component";
import { TaskApproveComponent } from "./tasks/tasks-approve/task-approve";


export const TASK_MANAGEMENT_ROUTE: Routes =[
    {path:'tasks-add',component:TaskFormComponent},
    {path:'tasks-edit/:id',component:TaskFormComponent},
    {path:'tasks-list',component:TaskListComponent},
    {path:'tasks-approve',component:TaskApproveComponent}
    

]