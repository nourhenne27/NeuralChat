import { NgModule }           from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule }       from '../../shared/shared.module';
import { AuthRoutingModule }  from './auth-routing.module';

import { LoginComponent }     from './login/login.component';
// ✅ RegisterComponent supprimé — inscription via Admin panel uniquement

@NgModule({
  declarations: [
    LoginComponent,
  ],
  imports: [
    SharedModule,
    ReactiveFormsModule,
    AuthRoutingModule,
  ],
})
export class AuthModule { } 
