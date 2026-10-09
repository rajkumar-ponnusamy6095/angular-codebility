import { Component } from '@angular/core';
import { ErrorPage } from '../error-page/error-page';
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [ErrorPage],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {}
