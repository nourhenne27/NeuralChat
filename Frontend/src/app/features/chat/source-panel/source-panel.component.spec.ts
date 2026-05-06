import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourcePanelComponent } from './source-panel.component';

describe('SourcePanelComponent', () => {
  let component: SourcePanelComponent;
  let fixture: ComponentFixture<SourcePanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SourcePanelComponent]
    });
    fixture = TestBed.createComponent(SourcePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
