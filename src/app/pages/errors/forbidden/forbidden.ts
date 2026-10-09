import { Component } from '@angular/core';
import { ErrorPage } from '../error-page/error-page';

@Component({
  selector: 'app-forbidden',
  imports: [ErrorPage],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
})
export class Forbidden {

}
