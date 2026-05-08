import { NgModule }          from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule }      from '@angular/router';
import { FormsModule }       from '@angular/forms';
import { NavbarComponent }   from './components/navbar/navbar.component';
import { SidebarComponent }  from './components/sidebar/sidebar.component';
import { ModalHostComponent } from './components/modal-host/modal-host.component';

@NgModule({
  declarations: [
    NavbarComponent,
    SidebarComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ModalHostComponent,
  ],
  exports: [
    NavbarComponent,
    SidebarComponent,
    ModalHostComponent,
    CommonModule,
    RouterModule,
    FormsModule,
  ]
})
export class SharedModule {}