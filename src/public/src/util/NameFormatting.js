export const splitOnDashes = (name) =>
    name.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.substring(1))
    .join(' ');