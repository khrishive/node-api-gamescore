export function resolveDateRangeToUnix(fromDate, toDate) {
  if (fromDate && toDate) {
    return {
      from: new Date(`${fromDate}T00:00:00Z`).getTime(),
      to: new Date(`${toDate}T23:59:59Z`).getTime()
    };
  }

  const now = new Date();

  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 1);
  end.setUTCHours(23, 59, 59, 999);

  return {
    from: start.getTime(),
    to: end.getTime()
  };
}
