import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RegisterModalComponent } from './register-modal.component';
 
import { SharedModule }       from '../../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
 
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { StatisticsComponent }     from './statistics/statistics.component';
import { UserListComponent }       from './user-list/user-list.component';
 
@NgModule({
  declarations: [
    AdminDashboardComponent,   // ← ajouté
    StatisticsComponent,
    UserListComponent,
  ],
  imports: [
    CommonModule,              // ← ajouté explicitement (date, number, ngClass pipes)
    SharedModule,
    AdminRoutingModule,
    FormsModule,
    RegisterModalComponent,
  ],
})
export class AdminModule {}
 

