import { Component } from '@angular/core';
import { ErrorPage } from '../error-page/error-page';

@Component({
  selector: 'app-bad-request',
  imports: [ErrorPage],
  templateUrl: './bad-request.html',
  styleUrl: './bad-request.css',
})
export class BadRequest {

}
