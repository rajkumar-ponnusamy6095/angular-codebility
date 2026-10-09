export type ApiAccountRole = 'Admin' | 'User';
export type AccountStatus = 'active' | 'inactive';

export interface Account {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  gender: string;
  phone: string;
  department: string;
  status: AccountStatus;
  role: ApiAccountRole;
  createdAt: string;
  isVerified: boolean;
}

export interface CurrentAccount extends Omit<Account, 'role'> {
  role: 'ADMIN' | 'USER';
}

export function parseAccountResponse(value: unknown): Account {
  const candidate = unwrapData(value);
  if (!isRecord(candidate)) {
    throw new Error('The API returned an invalid account.');
  }

  const id = readString(candidate, 'id');
  const email = readString(candidate, 'email');
  const firstName = readString(candidate, 'firstName');
  const lastName = readString(candidate, 'lastName');
  const gender = readString(candidate, 'gender');
  const phone = readString(candidate, 'phone');
  const department = readString(candidate, 'department');
  const status = readString(candidate, 'status');
  const rawRole = readString(candidate, 'role');
  const createdAt = readString(candidate, 'createdAt');
  const isVerified = candidate['isVerified'];

  if (typeof isVerified !== 'boolean') {
    throw new Error('The API account is missing a valid "isVerified" value.');
  }

  const role = rawRole.toLowerCase();
  if (role !== 'admin' && role !== 'user') {
    throw new Error('The API account has an unsupported role.');
  }

  if (status !== 'active' && status !== 'inactive') {
    throw new Error('The API account has an unsupported status.');
  }

  return {
    id,
    email,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    gender,
    phone,
    department,
    status,
    role: role === 'admin' ? 'Admin' : 'User',
    createdAt,
    isVerified
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapData(value: unknown): unknown {
  return isRecord(value) && 'data' in value ? value['data'] : value;
}

function readString(candidate: Record<string, unknown>, field: string): string {
  const value = candidate[field];
  if (typeof value !== 'string') {
    throw new Error(`The API account is missing a valid "${field}" value.`);
  }
  return value;
}
