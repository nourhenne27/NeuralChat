import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { StatisticsComponent }     from './statistics/statistics.component';
import { UserListComponent }       from './user-list/user-list.component';

const routes: Routes = [
  { path: '',           component: AdminDashboardComponent },   // ← route principale
  { path: 'statistics', component: StatisticsComponent },
  { path: 'users',      component: UserListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}