import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminOnlyGuard }        from '../../core/guards/admin-only.guard';

import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { StatisticsComponent }     from './statistics/statistics.component';
import { UserListComponent }       from './user-list/user-list.component';

const routes: Routes = [
  { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'statistics', component: StatisticsComponent },
  { path: 'users',      component: UserListComponent, canActivate: [AdminOnlyGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}