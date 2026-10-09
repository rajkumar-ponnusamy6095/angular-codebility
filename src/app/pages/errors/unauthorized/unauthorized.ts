import { Component } from '@angular/core';
import { ErrorPage } from '../error-page/error-page';

@Component({
  selector: 'app-unauthorized',
  imports: [ErrorPage],
  templateUrl: './unauthorized.html',
  styleUrl: './unauthorized.css',
})
export class Unauthorized {

}
