import { type FC } from 'react';

export const Instructions: FC = () => {
  return (
    <div className="max-w-2xl mx-auto mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Instructions</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Supported File Formats</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The application accepts three file formats:
          </p>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">1. JSON Format</h4>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-x-auto text-gray-800 dark:text-gray-100 text-sm">
{`{
  "data": [
    ["1.186.0.0", "1.186.255.255", "65,536"],
    ["2.16.34.0", "2.16.34.255", "256"]
  ]
}`}
              </pre>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
                Each array contains: Start IP, End IP, Number of IPs (as string with optional commas)
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">2. CSV Format (with Country Filtering)</h4>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-x-auto text-gray-800 dark:text-gray-100 text-sm">
{`"16777216","16777471","AU","Australia"
"16777472","16778239","CN","China"
"16778240","16779263","AU","Australia"`}
              </pre>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
                Each line contains: Start IP (as long), End IP (as long), Country Code, Country Name
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">3. MaxMind GeoLite2 Format</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">
                Upload both files for complete geographic IP filtering:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 text-sm space-y-1 ml-4">
                <li><strong>GeoLite2-Country-Locations-en.csv</strong> - Contains country information</li>
                <li><strong>GeoLite2-Country-Blocks-IPv4.csv</strong> - Contains IP network blocks</li>
              </ul>
              <div className="mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Locations file format:</p>
                <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto">
{`geoname_id,locale_code,continent_code,continent_name,country_iso_code,country_name
49518,en,AF,Africa,RW,Rwanda
51537,en,AF,Africa,SO,Somalia`}
                </pre>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Blocks file format:</p>
                <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto">
{`network,geoname_id,registered_country_geoname_id,represented_country_geoname_id
1.186.0.0/17,2635167,2635167,
1.186.128.0/20,2635167,2635167,`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">How to Use</h3>
          <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>Drag and drop your file(s) containing IP ranges onto the upload area, or click to select files</li>
            <li><strong>For CSV/MaxMind files:</strong> Select a country from the dropdown menu to filter IP ranges</li>
            <li><strong>For MaxMind format:</strong> Upload both the Locations and Blocks CSV files</li>
            <li>Enter the number of IP addresses you want to generate</li>
            <li>Click the "Generate and Download IPs" button</li>
            <li>A text file containing the generated IP addresses will be downloaded automatically</li>
          </ol>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Features</h3>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
            <li><strong>Multiple Formats:</strong> Support for JSON, CSV, and MaxMind GeoLite2 formats</li>
            <li><strong>Country Filtering:</strong> CSV and MaxMind files allow you to generate IPs from specific countries</li>
            <li><strong>Geographic Precision:</strong> MaxMind format provides the most accurate geographic IP data</li>
            <li><strong>Smart Distribution:</strong> IP addresses are distributed across different ranges</li>
            <li><strong>Random Generation:</strong> Each IP address is randomly generated within the specified ranges</li>
            <li><strong>Duplicate Removal:</strong> Duplicate IP addresses are automatically removed</li>
            <li><strong>CIDR Support:</strong> MaxMind format automatically handles CIDR notation conversion</li>
            <li><strong>Custom Naming:</strong> Downloaded files are named based on the selected country</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">File Format Details</h3>
          <div className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
            <p><strong>JSON files:</strong> Use when you have pre-defined IP ranges in CIDR or range format</p>
            <p><strong>CSV files:</strong> Use when you have IP ranges organized by country with long integer format</p>
            <p><strong>MaxMind GeoLite2:</strong> Use for the most accurate and comprehensive geographic IP data</p>
            <p><strong>CIDR conversion:</strong> MaxMind format automatically converts CIDR blocks to IP ranges</p>
            <p><strong>Multi-file support:</strong> MaxMind format requires both location and block files for complete functionality</p>
          </div>
        </section>
      </div>
    </div>
  );
};