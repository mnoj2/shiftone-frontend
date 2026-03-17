import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import * as Highcharts from 'highcharts';
import { provideHighcharts } from 'highcharts-angular';
import { provideHotToastConfig } from '@ngneat/hot-toast';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHighcharts({
      instance: () => Promise.resolve(Highcharts)
    }),
    provideHotToastConfig({
      position: 'top-right',
      duration: 2000
    })
  ]
};
