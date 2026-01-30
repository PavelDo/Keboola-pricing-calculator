import { useState, useMemo } from 'react';

const PPU_RATES = {
  extractor: { rate: 2, unit: 'hour', label: 'Data Source (Extractor)' },
  writer: { rate: 0.2, unit: 'GB', label: 'Data Destination (Writer)' },
  sql: { small: 6, medium: 12, large: 26, unit: 'hour', label: 'SQL Job/Workspace' },
  python: { xsmall: 0.2, small: 0.4, medium: 0.6, large: 2, unit: 'hour', label: 'Python/R Job' },
  dbt: { small: 4, remote: 2, unit: 'hour', label: 'dbt Job' },
  dwh: { small: 8, medium: 16, large: 32, unit: 'hour', label: 'DWH Direct Query' },
  dataApps: { xsmall: 0.1, small: 0.2, medium: 0.5, large: 1, unit: 'hour', label: 'Data Apps' },
  appStore: { rate: 1, unit: 'hour', label: 'AppStore Apps' },
};

const INDUSTRY_BENCHMARKS = {
  retail: { name: 'Retail & E-commerce', data: {
    small: { extractor: null, python: null, sql: null, writer: null },
    medium: { extractor: 0.037, python: 0.10, sql: 0.227, writer: 0.005 },
    large: { extractor: 0.067, python: 0.01, sql: 0.209, writer: 0.033 },
    xlarge: { extractor: 0.039, python: 0.01, sql: 0.429, writer: 0.048 },
  }},
  finance: { name: 'Finance & Banking', data: {
    small: { extractor: 0.020, python: 0.05, sql: 0.121, writer: 0.000 },
    medium: { extractor: 0.058, python: 0.02, sql: 0.233, writer: 0.011 },
    large: { extractor: 0.086, python: 0.02, sql: 0.168, writer: 0.030 },
    xlarge: { extractor: 0.057, python: 0.02, sql: 0.100, writer: 0.023 },
  }},
  technology: { name: 'Technology', data: {
    small: { extractor: 0.112, python: 0.006, sql: 0.090, writer: 0.004 },
    medium: { extractor: 0.047, python: 0.11, sql: 0.307, writer: 0.054 },
    large: { extractor: 0.035, python: 0.05, sql: 0.132, writer: 0.049 },
    xlarge: { extractor: 0.054, python: 0.05, sql: 0.327, writer: 0.087 },
  }},
  manufacturing: { name: 'Manufacturing', data: {
    small: { extractor: 0.040, python: 0.02, sql: 0.136, writer: 0.013 },
    medium: { extractor: 0.029, python: 0.02, sql: 0.121, writer: 0.004 },
    large: { extractor: 0.129, python: 0.02, sql: 0.163, writer: 0.057 },
    xlarge: { extractor: 0.176, python: 0.01, sql: 0.326, writer: 0.059 },
  }},
  healthcare: { name: 'Healthcare', data: {
    small: { extractor: 0.068, python: null, sql: null, writer: null },
    medium: { extractor: 0.000, python: 0.008, sql: 0.143, writer: 0.107 },
    large: { extractor: 0.081, python: 0.04, sql: 0.170, writer: 0.013 },
    xlarge: { extractor: 0.042, python: 0.04, sql: 0.248, writer: 0.037 },
  }},
  media: { name: 'Media & Entertainment', data: {
    small: { extractor: 0.046, python: null, sql: 0.067, writer: 0.000 },
    medium: { extractor: 0.077, python: 0.08, sql: 0.157, writer: 0.047 },
    large: { extractor: 0.090, python: 0.02, sql: 0.215, writer: 0.027 },
    xlarge: { extractor: 0.117, python: 0.14, sql: 0.364, writer: 0.054 },
  }},
};

const COMPANY_SIZES = { small: 'Small', medium: 'Medium', large: 'Large', xlarge: 'Extra Large' };

const MONTHLY_BENCHMARKS = {
  retail: { name: 'Retail & E-commerce', data: {
    small: { jobs: 6, extractor: 0.0, python: 0.0, sql: 0.0, writer: 0.0, monthly: 0, yearly: 3 },
    medium: { jobs: 959, extractor: 8.9, python: 1.0, sql: 34, writer: 0.4, monthly: 371, yearly: 4449 },
    large: { jobs: 5959, extractor: 67, python: 2.0, sql: 154, writer: 15, monthly: 2001, yearly: 24013 },
    xlarge: { jobs: 49050, extractor: 549, python: 21, sql: 2016, writer: 234, monthly: 23666, yearly: 283996 },
  }},
  finance: { name: 'Finance & Banking', data: {
    small: { jobs: 394, extractor: 3.7, python: 0.8, sql: 0.9, writer: 0.0, monthly: 45, yearly: 542 },
    medium: { jobs: 1176, extractor: 24, python: 0.0, sql: 32, writer: 2.3, monthly: 483, yearly: 5795 },
    large: { jobs: 10212, extractor: 80, python: 7.0, sql: 93, writer: 19, monthly: 1669, yearly: 20022 },
    xlarge: { jobs: 123228, extractor: 538, python: 29, sql: 891, writer: 67, monthly: 12800, yearly: 153600 },
  }},
  technology: { name: 'Technology', data: {
    small: { jobs: 268, extractor: 3.7, python: 0.0, sql: 1.9, writer: 0.1, monthly: 48, yearly: 570 },
    medium: { jobs: 2431, extractor: 12, python: 2.7, sql: 12, writer: 0.9, monthly: 234, yearly: 2805 },
    large: { jobs: 15159, extractor: 46, python: 3.5, sql: 94, writer: 33, monthly: 1477, yearly: 17721 },
    xlarge: { jobs: 23240, extractor: 394, python: 28, sql: 946, writer: 103, monthly: 12334, yearly: 148011 },
  }},
  manufacturing: { name: 'Manufacturing', data: {
    small: { jobs: 108, extractor: 0.6, python: 0.0, sql: 2.8, writer: 0.3, monthly: 31, yearly: 374 },
    medium: { jobs: 2185, extractor: 14, python: 0.9, sql: 16, writer: 0.4, monthly: 267, yearly: 3201 },
    large: { jobs: 16990, extractor: 91, python: 1.4, sql: 112, writer: 18, monthly: 1866, yearly: 22392 },
    xlarge: { jobs: 27505, extractor: 282, python: 6.2, sql: 177, writer: 27, monthly: 4123, yearly: 49475 },
  }},
  healthcare: { name: 'Healthcare', data: {
    small: { jobs: 10, extractor: 0.3, python: 0.0, sql: 0.9, writer: 0.0, monthly: 10, yearly: 122 },
    medium: { jobs: 3103, extractor: 0.0, python: 0.7, sql: 53, writer: 3.7, monthly: 483, yearly: 5800 },
    large: { jobs: 8805, extractor: 68, python: 7.8, sql: 111, writer: 9.3, monthly: 1642, yearly: 19701 },
    xlarge: { jobs: 27084, extractor: 510, python: 114, sql: 610, writer: 63, monthly: 10881, yearly: 130577 },
  }},
  media: { name: 'Media & Entertainment', data: {
    small: { jobs: 361, extractor: 6.5, python: 0.0, sql: 3.4, writer: 0.0, monthly: 83, yearly: 992 },
    medium: { jobs: 755, extractor: 23, python: 0.7, sql: 37, writer: 7.8, monthly: 573, yearly: 6880 },
    large: { jobs: 4035, extractor: 56, python: 3.0, sql: 172, writer: 11, monthly: 2028, yearly: 24338 },
    xlarge: { jobs: 23907, extractor: 235, python: 21, sql: 397, writer: 79, monthly: 6144, yearly: 73729 },
  }},
};

const PACKAGES = {
  noBrainer: { name: 'No Brainer', price: 69000, ppu: 6000, overageRate: 2.5, snowflake: 'Included', projects: 3, users: 5 },
  byodb: { name: 'BYODB', price: 60000, ppu: 6000, overageRate: 1.0, snowflake: 'Bring Your Own', projects: 3, users: 5 },
  singleTenant: { name: 'Single Tenant', price: 120000, ppu: 12000, overageRate: 2.5, snowflake: 'Included', projects: '∞', users: '∞' },
};

const FIDOO_DEFAULTS = {
  clients: 100, systemsPerClient: 2, syncsPerDay: 4, avgJobTimeSec: 30, dataPerSyncKB: 100,
  sqlWorkflows: 4, sqlRunsPerDay: 2, sqlJobTimeMin: 10, sqlBackend: 'small',
  pythonBackend: 'small', pythonTimeRatio: 0.25, extractorTimeRatio: 0.5
};

export default function Calculator() {
  const [config, setConfig] = useState(FIDOO_DEFAULTS);
  const [industry, setIndustry] = useState('technology');
  const [companySize, setCompanySize] = useState('medium');
  const update = (k, v) => setConfig(p => ({ ...p, [k]: v }));
  const resetToFidoo = () => setConfig(FIDOO_DEFAULTS);

  const calc = useMemo(() => {
    const totalConnections = config.clients * config.systemsPerClient;
    const dailySyncs = totalConnections * config.syncsPerDay;
    const monthlySyncs = dailySyncs * 30;
    const monthlyJobHours = (monthlySyncs * config.avgJobTimeSec) / 3600;
    const monthlyDataGB = (monthlySyncs * config.dataPerSyncKB) / (1024 * 1024);

    const extractorPPU = monthlyJobHours * config.extractorTimeRatio * PPU_RATES.extractor.rate;
    const pythonPPU = monthlyJobHours * config.pythonTimeRatio * PPU_RATES.python[config.pythonBackend];
    const writerPPU = monthlyDataGB * PPU_RATES.writer.rate;
    const integrationTotal = extractorPPU + pythonPPU + writerPPU;

    const dailySqlRuns = config.sqlWorkflows * config.sqlRunsPerDay;
    const monthlySqlHours = (dailySqlRuns * 30 * config.sqlJobTimeMin) / 60;
    const sqlPPU = monthlySqlHours * PPU_RATES.sql[config.sqlBackend];
    const analyticsTotal = sqlPPU;

    const monthlyPPU = integrationTotal + analyticsTotal;
    const annualPPU = monthlyPPU * 12;

    const ppuPerExtractorJob = (config.avgJobTimeSec / 3600) * config.extractorTimeRatio * PPU_RATES.extractor.rate;
    const ppuPerPythonJob = (config.avgJobTimeSec / 3600) * config.pythonTimeRatio * PPU_RATES.python[config.pythonBackend];
    const ppuPerWriterJob = (config.dataPerSyncKB / (1024 * 1024)) * PPU_RATES.writer.rate;

    const packageFit = Object.entries(PACKAGES).map(([key, pkg]) => {
      const overage = Math.max(0, annualPPU - pkg.ppu);
      const overageCost = overage * pkg.overageRate;
      const totalCost = pkg.price + overageCost;
      const utilization = (annualPPU / pkg.ppu) * 100;
      return { key, ...pkg, overage, overageCost, totalCost, utilization };
    });

    return { totalConnections, dailySyncs, monthlySyncs, monthlyJobHours, monthlyDataGB, extractorPPU, pythonPPU, writerPPU, integrationTotal, dailySqlRuns, monthlySqlHours, sqlPPU, analyticsTotal, monthlyPPU, annualPPU, ppuPerExtractorJob, ppuPerPythonJob, ppuPerWriterJob, packageFit };
  }, [config]);

  const fmt = (n, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d });
  const fmtC = (n) => '$' + fmt(n);

  const recommended = useMemo(() => calc.packageFit.filter(p => p.key !== 'byodb').reduce((best, p) => p.totalCost < best.totalCost && p.utilization <= 120 ? p : best), [calc.packageFit]);

  const benchmarkComparison = useMemo(() => {
    const b = INDUSTRY_BENCHMARKS[industry].data[companySize];
    const compare = (val, bench) => {
      if (bench === null) return 'n/a';
      if (val <= bench * 0.5) return 'low';
      if (val <= bench * 1.2) return 'typical';
      return 'high';
    };
    return {
      extractor: compare(calc.ppuPerExtractorJob, b.extractor),
      python: compare(calc.ppuPerPythonJob, b.python),
      writer: compare(calc.ppuPerWriterJob, b.writer),
      benchmarks: b,
    };
  }, [calc, industry, companySize]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-emerald-400">Keboola Pricing Calculator</h1>
          <p className="text-slate-400 text-sm">Calculator for scenarios data integration + analytics + data activation</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Config Panel */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h2 className="font-semibold mb-4 text-emerald-400">Integration Setup</h2>
            <div className="space-y-3">
              {[
                { k: 'clients', label: 'Clients', min: 1, max: 500 },
                { k: 'systemsPerClient', label: 'Systems per Client', min: 1, max: 10 },
                { k: 'syncsPerDay', label: 'Syncs per Day', min: 1, max: 24 },
                { k: 'avgJobTimeSec', label: 'Avg Job Time', min: 10, max: 300, step: 10, suffix: 's' },
              ].map(({ k, label, min, max, step, suffix }) => (
                <div key={k}>
                  <label className="text-xs text-slate-400 flex justify-between">
                    <span>{label}</span><span className="text-white">{config[k]}{suffix || ''}</span>
                  </label>
                  <input type="range" min={min} max={max} step={step || 1} value={config[k]}
                    onChange={e => update(k, Number(e.target.value))} className="w-full accent-emerald-500"/>
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 flex justify-between">
                  <span>Data per Sync (KB)</span><span className="text-white">{fmt(config.dataPerSyncKB)} KB</span>
                </label>
                <input type="range" min="1" max="10000" step="10" value={config.dataPerSyncKB}
                  onChange={e => update('dataPerSyncKB', Number(e.target.value))} className="w-full accent-emerald-500"/>
                <div className="text-xs text-slate-500 mt-1">Monthly: {fmt(calc.monthlyDataGB, 2)} GB → {fmt(calc.writerPPU, 2)} PPU</div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Python Backend</label>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {['xsmall', 'small', 'medium', 'large'].map(s => (
                    <button key={s} onClick={() => update('pythonBackend', s)}
                      className={`py-1 text-xs rounded ${config.pythonBackend === s ? 'bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'}`}>{s}</button>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-1">{PPU_RATES.python[config.pythonBackend]} PPU/hr</div>
              </div>
            </div>

            <h2 className="font-semibold mt-6 mb-4 text-cyan-400">Analytics Setup</h2>
            <div className="space-y-3">
              {[
                { k: 'sqlWorkflows', label: 'SQL Workflows', min: 0, max: 20 },
                { k: 'sqlRunsPerDay', label: 'SQL Runs per Day', min: 1, max: 12 },
                { k: 'sqlJobTimeMin', label: 'SQL Job Time', min: 1, max: 60, suffix: ' min' },
              ].map(({ k, label, min, max, suffix }) => (
                <div key={k}>
                  <label className="text-xs text-slate-400 flex justify-between">
                    <span>{label}</span><span className="text-white">{config[k]}{suffix || ''}</span>
                  </label>
                  <input type="range" min={min} max={max} value={config[k]}
                    onChange={e => update(k, Number(e.target.value))} className="w-full accent-cyan-500"/>
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400">SQL Backend Size</label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {['small', 'medium', 'large'].map(s => (
                    <button key={s} onClick={() => update('sqlBackend', s)}
                      className={`py-2 text-xs rounded ${config.sqlBackend === s ? 'bg-cyan-500 font-medium' : 'bg-slate-700 hover:bg-slate-600'}`}>
                      <div>{s}</div><div className="opacity-75">{PPU_RATES.sql[s]} PPU/hr</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h2 className="font-semibold mb-4 text-amber-400">Credit Calculation</h2>

            <div className="bg-slate-700/50 rounded-lg p-3 mb-4 text-sm font-mono">
              <div className="text-slate-400 mb-2">INTEGRATION:</div>
              <div className="flex justify-between"><span>Connections:</span><span>{fmt(calc.totalConnections)}</span></div>
              <div className="flex justify-between"><span>Daily syncs:</span><span>{fmt(calc.dailySyncs)}</span></div>
              <div className="flex justify-between"><span>Monthly syncs:</span><span>{fmt(calc.monthlySyncs)}</span></div>
              <div className="flex justify-between"><span>Monthly job hours:</span><span>{fmt(calc.monthlyJobHours, 1)}</span></div>
              <div className="flex justify-between"><span>Monthly data:</span><span>{fmt(calc.monthlyDataGB, 2)} GB</span></div>
              <div className="border-t border-slate-600 mt-2 pt-2">
                <div className="flex justify-between"><span>Extractor PPU:</span><span className="text-emerald-400">{fmt(calc.extractorPPU, 1)}</span></div>
                <div className="flex justify-between"><span>Python PPU ({config.pythonBackend}):</span><span className="text-emerald-400">{fmt(calc.pythonPPU, 1)}</span></div>
                <div className="flex justify-between"><span>Writer PPU:</span><span className="text-emerald-400">{fmt(calc.writerPPU, 2)}</span></div>
                <div className="flex justify-between font-bold mt-1"><span>Integration Total:</span><span>{fmt(calc.integrationTotal, 1)}</span></div>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3 mb-4 text-sm font-mono">
              <div className="text-slate-400 mb-2">ANALYTICS:</div>
              <div className="flex justify-between"><span>Daily SQL runs:</span><span>{fmt(calc.dailySqlRuns)}</span></div>
              <div className="flex justify-between"><span>Monthly SQL hours:</span><span>{fmt(calc.monthlySqlHours, 1)}</span></div>
              <div className="border-t border-slate-600 mt-2 pt-2">
                <div className="flex justify-between"><span>SQL PPU ({config.sqlBackend} @ {PPU_RATES.sql[config.sqlBackend]}/hr):</span><span className="text-cyan-400">{fmt(calc.sqlPPU, 1)}</span></div>
                <div className="flex justify-between font-bold mt-1"><span>Analytics Total:</span><span>{fmt(calc.analyticsTotal, 1)}</span></div>
              </div>
            </div>

            <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div><div className="text-2xl font-bold">{fmt(calc.monthlyPPU, 0)}</div><div className="text-xs text-slate-400">PPU/month</div></div>
                <div><div className="text-2xl font-bold">{fmt(calc.annualPPU, 0)}</div><div className="text-xs text-slate-400">PPU/year</div></div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg text-xs">
              <div className="text-slate-400 mb-2">Per-Job PPU vs {INDUSTRY_BENCHMARKS[industry].name} ({COMPANY_SIZES[companySize]}):</div>
              <div className="space-y-1">
                {[
                  { label: 'Extractor', value: calc.ppuPerExtractorJob, bench: benchmarkComparison.benchmarks.extractor, cmp: benchmarkComparison.extractor, dec: 4 },
                  { label: 'Python', value: calc.ppuPerPythonJob, bench: benchmarkComparison.benchmarks.python, cmp: benchmarkComparison.python, dec: 4 },
                  { label: 'Writer', value: calc.ppuPerWriterJob, bench: benchmarkComparison.benchmarks.writer, cmp: benchmarkComparison.writer, dec: 6 },
                ].map(({ label, value, bench, cmp, dec }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span>{label}:</span>
                    <span className={`px-2 py-0.5 rounded ${cmp === 'n/a' ? 'bg-slate-500/30 text-slate-400' : cmp === 'low' ? 'bg-emerald-500/30 text-emerald-400' : cmp === 'typical' ? 'bg-amber-500/30 text-amber-400' : 'bg-red-500/30 text-red-400'}`}>
                      {value.toFixed(dec)} vs {bench !== null ? bench.toFixed(3) : '--'} ({cmp})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Recommendations */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h2 className="font-semibold mb-4 text-emerald-400">Enterprise Packages</h2>
            <div className="space-y-3">
              {calc.packageFit.map(pkg => (
                <div key={pkg.key} className={`p-3 rounded-lg border transition-all ${pkg.key === recommended.key ? 'bg-emerald-500/20 border-emerald-500' : pkg.key === 'byodb' ? 'bg-slate-700/20 border-slate-600 opacity-75' : 'bg-slate-700/30 border-slate-600'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{pkg.name}</span>
                      {pkg.key === recommended.key && <span className="ml-2 text-xs bg-emerald-500 px-2 py-0.5 rounded">Best Fit</span>}
                      <div className="text-xs text-slate-400">{pkg.ppu.toLocaleString()} PPU/yr • {pkg.snowflake}</div>
                      {pkg.key === 'byodb' && <div className="text-xs text-amber-400 mt-1">+ Snowflake costs not included</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{fmtC(pkg.totalCost)}/yr</div>
                      {pkg.key === 'byodb' && <div className="text-xs text-amber-400">+ Snowflake</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 bg-slate-600 rounded-full h-2">
                      <div className={`h-2 rounded-full ${pkg.utilization > 100 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'}`} style={{ width: `${Math.min(100, pkg.utilization)}%` }}/>
                    </div>
                    <span className={pkg.utilization > 100 ? 'text-amber-400' : 'text-slate-400'}>{fmt(pkg.utilization, 0)}%</span>
                  </div>
                  {pkg.overage > 0 && <div className="text-xs text-amber-400 mt-1">+{fmt(pkg.overage, 0)} overage PPU × ${pkg.overageRate} = {fmtC(pkg.overageCost)}</div>}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-amber-400">Fidoo Benchmark</span>
                <button onClick={resetToFidoo} className="text-slate-400 hover:text-white px-2 py-1 bg-slate-600 rounded">Reset</button>
              </div>
              <div className="text-slate-400">Expected: ~461 PPU/mo, 5,532 PPU/yr</div>
              <div className="text-white">Calculated: {fmt(calc.monthlyPPU, 0)} PPU/mo, {fmt(calc.annualPPU, 0)} PPU/yr</div>
              {Math.abs(calc.monthlyPPU - 461) < 50 && <div className="text-emerald-400 mt-1">✓ Within expected range</div>}
            </div>
          </div>
        </div>

        {/* Industry Benchmark Data */}
        <div className="mt-6 bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="font-semibold text-amber-400">Real Client Benchmarks</h3>
            <div className="flex gap-2">
              <select value={industry} onChange={e => setIndustry(e.target.value)}
                className="bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600">
                {Object.entries(INDUSTRY_BENCHMARKS).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
              <select value={companySize} onChange={e => setCompanySize(e.target.value)}
                className="bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600">
                {Object.entries(COMPANY_SIZES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-2">{MONTHLY_BENCHMARKS[industry].name} - Monthly PPU per Client</div>
              <table className="w-full text-xs">
                <thead><tr className="text-slate-400 border-b border-slate-600">
                  <th className="text-left py-1">Size</th><th className="text-right py-1">Jobs/Mo</th><th className="text-right py-1">Extractor</th><th className="text-right py-1">Python</th><th className="text-right py-1">SQL</th><th className="text-right py-1">Writer</th><th className="text-right py-1">$/Mo</th><th className="text-right py-1">$/Year</th>
                </tr></thead>
                <tbody>
                  {Object.entries(MONTHLY_BENCHMARKS[industry].data).map(([size, data]) => (
                    <tr key={size} className={`border-b border-slate-700 ${size === companySize ? 'bg-emerald-500/10' : ''}`}>
                      <td className={`py-1 ${size === companySize ? 'text-emerald-400 font-medium' : ''}`}>{COMPANY_SIZES[size]}</td>
                      <td className="text-right">{data.jobs.toLocaleString()}</td>
                      <td className="text-right">{data.extractor.toLocaleString()}</td>
                      <td className="text-right">{data.python.toLocaleString()}</td>
                      <td className="text-right">{data.sql.toLocaleString()}</td>
                      <td className="text-right">{data.writer.toLocaleString()}</td>
                      <td className="text-right">${data.monthly.toLocaleString()}</td>
                      <td className="text-right">${data.yearly.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-2">Cross-Industry Comparison per Job ({COMPANY_SIZES[companySize]})</div>
              <table className="w-full text-xs">
                <thead><tr className="text-slate-400 border-b border-slate-600">
                  <th className="text-left py-1">Industry</th><th className="text-right py-1">Extractor</th><th className="text-right py-1">Python</th><th className="text-right py-1">SQL</th><th className="text-right py-1">Writer</th>
                </tr></thead>
                <tbody>
                  {Object.entries(INDUSTRY_BENCHMARKS).map(([ind, { name, data }]) => (
                    <tr key={ind} className={`border-b border-slate-700 ${ind === industry ? 'bg-emerald-500/10' : ''}`}>
                      <td className={`py-1 ${ind === industry ? 'text-emerald-400 font-medium' : ''}`}>{name}</td>
                      <td className="text-right">{data[companySize].extractor !== null ? data[companySize].extractor.toFixed(3) : '--'}</td>
                      <td className="text-right">{data[companySize].python !== null ? data[companySize].python.toFixed(3) : '--'}</td>
                      <td className="text-right">{data[companySize].sql !== null ? data[companySize].sql.toFixed(3) : '--'}</td>
                      <td className="text-right">{data[companySize].writer !== null ? data[companySize].writer.toFixed(3) : '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Note: All PPU values (Extractor, Python, SQL, Writers) are monthly PPU per average client in that segment. Data based on 13 months (Jan 2025 - Jan 2026).
          </div>
        </div>

        {/* PPU Rate Reference */}
        <div className="mt-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="font-semibold mb-3 text-slate-300">
            Official PPU Rates (<a href="https://help.keboola.com/management/project/limits/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">help.keboola.com</a>)
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-xs">
            <div><div className="text-slate-400 mb-1">Data Movement</div><div>Extractor: 2 PPU/hr</div><div>Writer: 0.2 PPU/GB</div></div>
            <div><div className="text-slate-400 mb-1">SQL Backend</div>
              <div className={config.sqlBackend === 'small' ? 'text-cyan-400' : ''}>Small: 6 PPU/hr</div>
              <div className={config.sqlBackend === 'medium' ? 'text-cyan-400' : ''}>Medium: 12 PPU/hr</div>
              <div className={config.sqlBackend === 'large' ? 'text-cyan-400' : ''}>Large: 26 PPU/hr</div>
            </div>
            <div><div className="text-slate-400 mb-1">Python/R Backend</div>
              <div className={config.pythonBackend === 'xsmall' ? 'text-emerald-400' : ''}>XSmall: 0.2 PPU/hr</div>
              <div className={config.pythonBackend === 'small' ? 'text-emerald-400' : ''}>Small: 0.4 PPU/hr</div>
              <div className={config.pythonBackend === 'medium' ? 'text-emerald-400' : ''}>Medium: 0.6 PPU/hr</div>
              <div className={config.pythonBackend === 'large' ? 'text-emerald-400' : ''}>Large: 2 PPU/hr</div>
            </div>
            <div><div className="text-slate-400 mb-1">Other</div><div>DWH Direct: 8-32 PPU/hr</div><div>dbt: 2-4 PPU/hr</div><div>Data Apps: 0.1-1 PPU/hr</div></div>
          </div>
        </div>

      </div>
    </div>
  );
}
