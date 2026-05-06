import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HttpClient }    from '@angular/common/http';

import { AppRoutingModule }  from './app-routing.module';
import { AppComponent }      from './app.component';
import { MarkdownModule }    from 'ngx-markdown';
import { SharedModule }      from './shared/shared.module';
import { SidebarComponent }  from './shared/components/sidebar/sidebar.component';
import { JwtInterceptor }    from './core/interceptors/jwt.interceptor';
import { ErrorInterceptor }  from './core/interceptors/error.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    MarkdownModule.forRoot({ loader: HttpClient }),
    SharedModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor,   multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
