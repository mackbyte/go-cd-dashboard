export const splitOnDashes = (name) =>
    name
    .split('-')
    .join(' ')
    .replace('_', ' ');