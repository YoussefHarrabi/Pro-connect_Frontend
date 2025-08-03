import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDiscovery } from './project-discovery';

describe('ProjectDiscovery', () => {
  let component: ProjectDiscovery;
  let fixture: ComponentFixture<ProjectDiscovery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDiscovery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDiscovery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
