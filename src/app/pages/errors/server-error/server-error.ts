import { Component } from '@angular/core';
import { ErrorPage } from '../error-page/error-page';

@Component({
  selector: 'app-server-error',
  imports: [ErrorPage],
  templateUrl: './server-error.html',
  styleUrl: './server-error.css',
})
export class ServerError {

}
