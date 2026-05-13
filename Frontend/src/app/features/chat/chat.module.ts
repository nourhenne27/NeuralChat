import { NgModule } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { SharedModule }      from '../../shared/shared.module';
import { ChatRoutingModule } from './chat-routing.module';
import { ChatWindowComponent }   from './chat-window/chat-window.component';
import { MessageBubbleComponent } from './message-bubble/message-bubble.component';
import { ChatInputComponent }    from './chat-input/chat-input.component';
import { SessionListComponent }  from './session-list/session-list.component';
import { SourcePanelComponent }  from './source-panel/source-panel.component';
import { FeedbackModalComponent } from './feedback-modal/feedback-modal.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    ChatWindowComponent,
    MessageBubbleComponent,
    SessionListComponent,
    SourcePanelComponent,
    FeedbackModalComponent,
  ],
  imports: [
    SharedModule,
    ChatRoutingModule,
    CommonModule,
    FormsModule,
    MarkdownModule.forChild(),
    ChatInputComponent,
  ],
})
export class ChatModule { }


