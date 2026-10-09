export const DEPARTMENTS = [
  'Finance',
  'HR',
  'Engineering',
  'Administration',
  'Operation',
  'Marketing'
] as const;

export const DEPARTMENT_PATTERN = new RegExp(`^(?:${DEPARTMENTS.join('|')})$`);
