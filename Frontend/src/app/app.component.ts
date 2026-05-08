import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  isAuthPage = false;

  private routerSub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.isAuthPage = this.router.url.includes('/auth');

    this.routerSub = this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAuthPage = event.urlAfterRedirects.includes('/auth');
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}