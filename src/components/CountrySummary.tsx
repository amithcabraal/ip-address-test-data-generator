import { type FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CountrySummaryData {
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
}

interface CountrySummaryProps {
  lookupResults: Array<{
    ip: string;
    countryCode: string;
    countryName: string;
    found: boolean;
  }>;
}

export const CountrySummary: FC<CountrySummaryProps> = ({ lookupResults }) => {
  // Filter only found results and group by country
  const foundResults = lookupResults.filter(result => result.found);
  
  if (foundResults.length === 0) {
    return null;
  }

  // Count IPs per country
  const countryMap = new Map<string, { name: string; count: number }>();
  
  foundResults.forEach(result => {
    const key = result.countryCode;
    if (countryMap.has(key)) {
      countryMap.get(key)!.count++;
    } else {
      countryMap.set(key, {
        name: result.countryName,
        count: 1
      });
    }
  });

  // Convert to array and calculate percentages
  const summaryData: CountrySummaryData[] = Array.from(countryMap.entries())
    .map(([code, data]) => ({
      country: data.name,
      countryCode: code,
      count: data.count,
      percentage: (data.count / foundResults.length) * 100
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  // Generate colors for the bar chart
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#8B5A2B', '#059669', '#DC2626'
  ];

  const downloadSummaryCSV = () => {
    const csvContent = [
      'Country,Country Code,IP Count,Percentage',
      ...summaryData.map(item => 
        `${item.country},${item.countryCode},${item.count},${item.percentage.toFixed(2)}%`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'country_summary.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Country Distribution Summary
        </h3>
        <button
          onClick={downloadSummaryCSV}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors duration-200"
        >
          Download Summary CSV
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summaryData.length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Countries Found
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {foundResults.length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            IPs Located
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {lookupResults.filter(r => !r.found).length}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            IPs Not Found
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            IP Count by Country
          </h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {summaryData.map((item, index) => (
                <tr key={item.countryCode} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></div>
                      {item.country}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                    {item.countryCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-medium">
                    {item.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                    {item.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          IP Distribution by Country
        </h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={summaryData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="countryCode"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
                className="fill-gray-600 dark:fill-gray-300"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="fill-gray-600 dark:fill-gray-300"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: number, _name: string) => [
                  `${value} IPs`,
                  'Count'
                ]}
                labelFormatter={(label: string) => {
                  const item = summaryData.find(d => d.countryCode === label);
                  return item ? `${item.country} (${label})` : label;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {summaryData.map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Hover over bars for detailed information
        </div>
      </div>
    </div>
  );
};