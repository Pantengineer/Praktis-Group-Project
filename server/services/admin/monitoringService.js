import ApiRequestLog from '../../models/nosql/ApiRequestLog.js';

const getApiLogs = async ({ ip, method, statusCode, page = 1, limit = 25 }) => {
    const filter = {};

    if (ip) filter.ip_address = ip;
    if (method) filter.method = method.toUpperCase();
    if (statusCode) filter.status_code = parseInt(statusCode, 10);

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, totalLogs] = await Promise.all([
      ApiRequestLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ApiRequestLog.countDocuments(filter)
    ]);

    return {
      logs,
      totalLogs,
      page: pageNum,
      totalPages: Math.ceil(totalLogs / limitNum) || 1
    };
};

const getApiTrafficStats = async (hours = 1) => {
    const hoursNum = parseFloat(hours) || 1;
    const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000);

    const logs = await ApiRequestLog.find({ timestamp: { $gte: since } }).lean();

    // Adapt bucket size based on time window
    let bucketSizeMs = 5 * 60 * 1000; // 5 mins default
    if (hoursNum <= 0.5) bucketSizeMs = 1 * 60 * 1000; // 1 min for 30m window
    else if (hoursNum > 6) bucketSizeMs = 30 * 60 * 1000; // 30 mins for long windows

    const bucketsMap = new Map();
    const now = Date.now();

    // Build timeline buckets with ISO timestamps
    for (let t = Math.floor(since.getTime() / bucketSizeMs) * bucketSizeMs; t <= now; t += bucketSizeMs) {
      const isoKey = new Date(t).toISOString();
      bucketsMap.set(t, {
        timestampIso: isoKey,
        requests: 0,
        bandwidthKB: 0,
        totalLatency: 0,
        errors: 0
      });
    }

    let totalBytes = 0;
    let totalLatencyMs = 0;
    let totalErrors = 0;
    const ipCounts = {};

    logs.forEach(log => {
      totalBytes += log.content_length_bytes || 0;
      totalLatencyMs += log.response_time_ms || 0;
      if (log.status_code >= 400) totalErrors++;

      ipCounts[log.ip_address] = (ipCounts[log.ip_address] || 0) + 1;

      // Round to nearest bucket start timestamp
      const logTimeMs = new Date(log.timestamp).getTime();
      const bucketMs = Math.floor(logTimeMs / bucketSizeMs) * bucketSizeMs;

      if (bucketsMap.has(bucketMs)) {
        const b = bucketsMap.get(bucketMs);
        b.requests += 1;
        b.bandwidthKB += (log.content_length_bytes || 0) / 1024;
        b.totalLatency += log.response_time_ms || 0;
        if (log.status_code >= 400) b.errors += 1;
      }
    });

    const timeSeries = Array.from(bucketsMap.values()).map(b => ({
      timestampIso: b.timestampIso,
      requests: b.requests,
      bandwidthKB: parseFloat(b.bandwidthKB.toFixed(2)),
      avgLatencyMs: b.requests > 0 ? Math.round(b.totalLatency / b.requests) : 0,
      errors: b.errors
    }));

    // Top IPs by volume
    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      summary: {
        totalRequests: logs.length,
        totalBandwidthMB: parseFloat((totalBytes / (1024 * 1024)).toFixed(2)),
        avgLatencyMs: logs.length > 0 ? Math.round(totalLatencyMs / logs.length) : 0,
        errorRatePct: logs.length > 0 ? parseFloat(((totalErrors / logs.length) * 100).toFixed(1)) : 0
      },
      timeSeries,
      topIPs
    };
};

export default {
  getApiLogs,
  getApiTrafficStats,
};