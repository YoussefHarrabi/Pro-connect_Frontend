import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPosting } from './project-posting';

describe('ProjectPosting', () => {
  let component: ProjectPosting;
  let fixture: ComponentFixture<ProjectPosting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPosting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPosting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
