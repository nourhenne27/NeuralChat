import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { DocumentsRoutingModule } from './documents-routing.module';
import { DocumentListComponent } from './document-list/document-list.component';

@NgModule({
  declarations: [
    DocumentListComponent,
  ],
  imports: [
    SharedModule,
    DocumentsRoutingModule,
  ],
})
export class DocumentsModule {}