type TransformArrayInput = { value: string | string[] };

export const transformToArray = ({
  value,
}: TransformArrayInput): string[] | string =>
  typeof value === 'string' ? value.split(',').map((v) => v.trim()) : value;
