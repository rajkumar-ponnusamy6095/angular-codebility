import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Account, isRecord, parseAccountResponse } from '../../core/models/account';
import { ApiService } from '../../core/services/api.service';
import {
  User,
  UserFormData,
  UserListParams,
  UserListResponse,
  UserProfileUpdateData
} from './user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly api = inject(ApiService);

  getUsers(params: UserListParams): Observable<UserListResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('limit', params.limit);

    httpParams = this.setIfPresent(httpParams, 'search', params.search);
    httpParams = this.setIfPresent(
      httpParams,
      'sortBy',
      params.sortBy === 'name' ? 'firstName' : params.sortBy
    );
    httpParams = this.setIfPresent(httpParams, 'sortOrder', params.sortOrder);
    const apiRole = params.role === undefined
      ? undefined
      : params.role === 'admin'
        ? 'Admin'
        : 'User';
    httpParams = this.setIfPresent(
      httpParams,
      'role',
      apiRole
    );
    httpParams = this.setIfPresent(httpParams, 'status', params.status);
    httpParams = this.setIfPresent(httpParams, 'department', params.department);

    return this.api.get(`/v1/accounts?${httpParams.toString()}`).pipe(
      map(value => this.parseUserList(value))
    );
  }

  getUser(id: string): Observable<User> {
    return this.api.get(`/v1/accounts/${encodeURIComponent(id)}`).pipe(
      map(value => this.toUser(parseAccountResponse(value)))
    );
  }

  createUser(data: UserFormData): Observable<User> {
    return this.api.post('/v1/accounts', this.toRequest(data)).pipe(
      map(value => this.toUser(parseAccountResponse(value)))
    );
  }

  updateUser(id: string, data: UserFormData): Observable<User> {
    return this.api.put(
      `/v1/accounts/${encodeURIComponent(id)}`,
      this.toRequest(data)
    ).pipe(
      map(value => this.toUser(parseAccountResponse(value)))
    );
  }

  updateMyProfile(id: string, data: UserProfileUpdateData): Observable<User> {
    return this.api.put(
      `/v1/accounts/${encodeURIComponent(id)}`,
      {
        ...data,
        role: data.role === 'admin' ? 'Admin' : 'User'
      }
    ).pipe(
      map(value => this.toUser(parseAccountResponse(value)))
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.api.delete(`/v1/accounts/${encodeURIComponent(id)}`).pipe(
      map(() => undefined)
    );
  }

  private setIfPresent(
    params: HttpParams,
    key: string,
    value: string | undefined
  ): HttpParams {
    return value === undefined || value === ''
      ? params
      : params.set(key, value);
  }

  private parseUserList(value: unknown): UserListResponse {
    if (
      !isRecord(value) ||
      !Array.isArray(value['data']) ||
      !isRecord(value['pagination'])
    ) {
      throw new Error('The API returned an invalid account list.');
    }

    const pagination = value['pagination'];
    const page = pagination['page'];
    const limit = pagination['limit'];
    const total = pagination['total'];
    const totalPages = pagination['totalPages'];

    if (
      typeof page !== 'number' ||
      typeof limit !== 'number' ||
      typeof total !== 'number' ||
      typeof totalPages !== 'number'
    ) {
      throw new Error('The API returned invalid pagination details.');
    }

    return {
      data: value['data'].map(item => this.toUser(parseAccountResponse(item))),
      pagination: { page, limit, total, totalPages }
    };
  }

  private toUser(account: Account): User {
    return {
      ...account,
      role: account.role === 'Admin' ? 'admin' : 'user',
      gender: account.gender.toLowerCase()
    };
  }

  private toRequest(data: UserFormData): Omit<UserFormData, 'role'> & {
    role: 'Admin' | 'User';
  } {
    return {
      ...data,
      role: data.role === 'admin' ? 'Admin' : 'User'
    };
  }
}