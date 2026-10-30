const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}
