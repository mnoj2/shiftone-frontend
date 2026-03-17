import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

import * as Highcharts from 'highcharts';
import { provideHighcharts } from 'highcharts-angular';

import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { LicenseManager } from 'ag-grid-enterprise';
import { ExcelExportModule } from 'ag-grid-enterprise';

LicenseManager.setLicenseKey('');
ModuleRegistry.registerModules([ExcelExportModule]);

ModuleRegistry.registerModules([AllCommunityModule]);

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideHighcharts({
      instance: () => Promise.resolve(Highcharts)
    })
  ]
}).catch(err => { });