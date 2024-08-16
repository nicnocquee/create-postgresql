const timescaledb = require('./timescaledb');

async function getDatabaseStats() {
  const result = await timescaledb.query(`
    SELECT
      COUNT(*) FILTER (WHERE time >= DATE_TRUNC('day', NOW())) AS today,
      COUNT(*) FILTER (WHERE time >= DATE_TRUNC('day', NOW() - INTERVAL '1 day') AND time < DATE_TRUNC('day', NOW())) AS yesterday,
      COUNT(*) FILTER (WHERE time >= DATE_TRUNC('week', NOW())) AS this_week,
      COUNT(*) FILTER (WHERE time >= DATE_TRUNC('month', NOW())) AS this_month,
      COUNT(*) FILTER (WHERE time >= DATE_TRUNC('year', NOW())) AS this_year,
      COUNT(*) FILTER (WHERE time >= NOW() - INTERVAL '7 days') AS last_7_days,
      COUNT(*) FILTER (WHERE time >= NOW() - INTERVAL '30 days') AS last_30_days
    FROM database_creation_logs;
  `);

  // Convert string values to numbers
  const stats = result.rows[0];
  Object.keys(stats).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(stats, key)) {
      stats[key] = parseInt(stats[key], 10);
    }
  });

  return stats;
}

module.exports = { getDatabaseStats };
