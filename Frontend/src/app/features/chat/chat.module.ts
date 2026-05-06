import { NgModule } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { SharedModule }      from '../../shared/shared.module';
import { ChatRoutingModule } from './chat-routing.module';
import { ConfidenceBadgeComponent } from '../../shared/components/confidence-badge/confidence-badge.component';
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
    ChatInputComponent,
    SessionListComponent,
    SourcePanelComponent,
    ConfidenceBadgeComponent,
    FeedbackModalComponent,
  ],
  imports: [
    SharedModule,
    ChatRoutingModule,
    CommonModule,
    FormsModule,
    MarkdownModule.forChild()
  ],
})
export class ChatModule { }


