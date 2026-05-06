import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfidenceBadgeComponent } from './confidence-badge.component';

describe('ConfidenceBadgeComponent', () => {
  let component: ConfidenceBadgeComponent;
  let fixture: ComponentFixture<ConfidenceBadgeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfidenceBadgeComponent]
    });
    fixture = TestBed.createComponent(ConfidenceBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
