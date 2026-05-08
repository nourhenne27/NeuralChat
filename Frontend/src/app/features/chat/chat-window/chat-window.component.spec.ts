/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { ChatWindowComponent } from './chat-window.component';
import { ChatService } from '../../../core/services/chat.service';
import { ChatStateService } from '../../../core/services/chat-state.service';
import { DocumentService } from '../../../core/services/document.service';
import { FeedbackService } from '../../../core/services/feedback.service';
import { of } from 'rxjs';

describe('ChatWindowComponent', () => {
  let component: ChatWindowComponent;
  let fixture: ComponentFixture<ChatWindowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChatWindowComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ChatService,     useValue: { getUserSessions: () => of([]), getDocuments: () => of([]) } },
        { provide: ChatStateService, useValue: { sessions$: of([]), sessionId$: of(null), setSessions: () => {}, setSessionId: () => {}, getSessions: () => [] } },
        { provide: DocumentService,  useValue: { getDocuments: () => of([]) } },
        { provide: FeedbackService,  useValue: { submitFeedback: () => of({}) } },
        ChangeDetectorRef,
      ]
    });
    fixture = TestBed.createComponent(ChatWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});