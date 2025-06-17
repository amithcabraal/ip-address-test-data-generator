import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CountrySummary } from './CountrySummary';

interface IPRange {
  start: string;
  end: string;
  count: number;
  country?: string;
  countryCode?: string;
  geonameId?: string;
  startLong?: number; // Add cached long values for performance
  endLong?: number;
}

interface CSVRow {
  startLong: string;
  endLong: string;
  countryCode: string;
  countryName: string;
}

interface MaxMindLocation {
  geonameId: string;
  localeCode: string;
  continentCode: string;
  continentName: string;
  countryIsoCode: string;
  countryName: string;
  isInEuropeanUnion: string;
}

interface MaxMindBlock {
  network: string;
  geonameId: string;
  registeredCountryGeonameId: string;
  representedCountryGeonameId: string;
  isAnonymousProxy: string;
  isSatelliteProvider: string;
  isAnycast: string;
}

interface IPLookupResult {
  ip: string;
  countryCode: string;
  countryName: string;
  found: boolean;
}

interface CountryProfile {
  id: string;
  countryCode: string;
  countryName: string;
  percentage: number;
}

export const IPRangeProcessor = () => {
  const [ipRanges, setIpRanges] = useState<IPRange[]>([]);
  const [allRanges, setAllRanges] = useState<IPRange[]>([]);
  const [numAddresses, setNumAddresses] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string>('');
  const [fileType, setFileType] = useState<'json' | 'csv' | 'maxmind' | null>(null);
  const [availableCountries, setAvailableCountries] = useState<Array<{code: string, name: string}>>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [maxmindLocations, setMaxmindLocations] = useState<Map<string, MaxMindLocation>>(new Map());
  const [maxmindBlocks, setMaxmindBlocks] = useState<MaxMindBlock[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{locations?: boolean, blocks?: boolean}>({});
  
  // New state for IP lookup feature
  const [mode, setMode] = useState<'generate' | 'lookup'>('generate');
  const [ipLookupText, setIpLookupText] = useState<string>('');
  const [lookupResults, setLookupResults] = useState<IPLookupResult[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  // New state for batched lookup progress
  const [processedCount, setProcessedCount] = useState(0);
  const [totalIPsToLookup, setTotalIPsToLookup] = useState(0);

  // New state for generation profiles
  const [useProfiles, setUseProfiles] = useState(false);
  const [countryProfiles, setCountryProfiles] = useState<CountryProfile[]>([]);
  const [nextProfileId, setNextProfileId] = useState(1);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setProcessing(true);
    
    const processFile = async (file: File, _index: number) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        const fileName = file.name.toLowerCase();
        
        setProcessingFile(`Processing ${file.name}...`);

        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            
            if (fileName.endsWith('.json')) {
              handleJSONFile(content);
            } else if (fileName.includes('geolite2-country-locations') || fileName.includes('locations')) {
              handleMaxMindLocationsFile(content, fileName);
            } else if (fileName.includes('geolite2-country-blocks') || fileName.includes('blocks')) {
              handleMaxMindBlocksFile(content, fileName);
            } else if (fileName.endsWith('.csv')) {
              handleCSVFile(content);
            }
            resolve();
          } catch (error) {
            reject(new Error(`Error parsing file ${file.name}. Please ensure it's a valid file format.`));
          }
        };

        reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
        reader.readAsText(file);
      });
    };

    // Process files sequentially
    const processAllFiles = async () => {
      try {
        for (let i = 0; i < acceptedFiles.length; i++) {
          await processFile(acceptedFiles[i], i);
          // Small delay to show processing state
          await new Promise(resolve => window.setTimeout(resolve, 300));
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : 'An error occurred while processing files');
      } finally {
        setProcessing(false);
        setProcessingFile('');
      }
    };

    processAllFiles();
  }, [maxmindLocations, maxmindBlocks]);

  // Helper function to sort and cache IP ranges for performance
  const sortAndCacheRanges = (ranges: IPRange[]): IPRange[] => {
    const rangesWithCache = ranges.map(range => ({
      ...range,
      startLong: ipToLong(range.start),
      endLong: ipToLong(range.end)
    }));
    
    // Sort by start IP address (as long integer) for binary search
    return rangesWithCache.sort((a, b) => a.startLong! - b.startLong!);
  };

  const handleJSONFile = (content: string) => {
    const data = JSON.parse(content);
    const ranges = data.data.map((range: string[]) => ({
      start: range[0],
      end: range[1],
      count: parseInt(range[2].replace(/,/g, ''), 10)
    }));
    
    const sortedRanges = sortAndCacheRanges(ranges);
    setIpRanges(sortedRanges);
    setAllRanges(sortedRanges);
    setFileType('json');
    setAvailableCountries([]);
    setSelectedCountry('');
    resetMaxMindData();
    resetProfiles();
  };

  const handleCSVFile = (content: string) => {
    const lines = content.trim().split('\n');
    const csvData: CSVRow[] = [];
    const countriesMap = new Map<string, string>();

    lines.forEach(line => {
      const cleanLine = line.replace(/"/g, '');
      const parts = cleanLine.split(',');
      
      if (parts.length >= 4) {
        const [startLong, endLong, countryCode, countryName] = parts;
        csvData.push({
          startLong: startLong.trim(),
          endLong: endLong.trim(),
          countryCode: countryCode.trim(),
          countryName: countryName.trim()
        });
        countriesMap.set(countryCode.trim(), countryName.trim());
      }
    });

    const ranges = csvData.map(row => {
      const startIP = longToIp(parseInt(row.startLong));
      const endIP = longToIp(parseInt(row.endLong));
      const count = parseInt(row.endLong) - parseInt(row.startLong) + 1;
      
      return {
        start: startIP,
        end: endIP,
        count: count,
        country: row.countryName,
        countryCode: row.countryCode
      };
    });

    const countries = Array.from(countriesMap.entries()).map(([code, name]) => ({
      code,
      name
    })).sort((a, b) => a.name.localeCompare(b.name));

    const sortedRanges = sortAndCacheRanges(ranges);
    setAllRanges(sortedRanges);
    setAvailableCountries(countries);
    setFileType('csv');
    setSelectedCountry('');
    setIpRanges([]);
    resetMaxMindData();
    resetProfiles();
  };

  const handleMaxMindLocationsFile = (content: string, _fileName: string) => {
    const lines = content.trim().split('\n');
    const locationsMap = new Map<string, MaxMindLocation>();
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    dataLines.forEach(line => {
      const parts = parseCSVLine(line);
      if (parts.length >= 6) {
        const location: MaxMindLocation = {
          geonameId: parts[0],
          localeCode: parts[1],
          continentCode: parts[2],
          continentName: parts[3],
          countryIsoCode: parts[4],
          countryName: parts[5],
          isInEuropeanUnion: parts[6] || '0'
        };
        locationsMap.set(location.geonameId, location);
      }
    });

    setMaxmindLocations(locationsMap);
    setUploadedFiles(prev => ({ ...prev, locations: true }));
    
    // If we already have blocks, process the combined data
    if (maxmindBlocks.length > 0) {
      processMaxMindData(locationsMap, maxmindBlocks);
    }
  };

  const handleMaxMindBlocksFile = (content: string, _fileName: string) => {
    const lines = content.trim().split('\n');
    const blocks: MaxMindBlock[] = [];
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    dataLines.forEach(line => {
      const parts = parseCSVLine(line);
      if (parts.length >= 3) {
        const block: MaxMindBlock = {
          network: parts[0],
          geonameId: parts[1],
          registeredCountryGeonameId: parts[2],
          representedCountryGeonameId: parts[3] || '',
          isAnonymousProxy: parts[4] || '0',
          isSatelliteProvider: parts[5] || '0',
          isAnycast: parts[6] || '0'
        };
        blocks.push(block);
      }
    });

    setMaxmindBlocks(blocks);
    setUploadedFiles(prev => ({ ...prev, blocks: true }));
    
    // If we already have locations, process the combined data
    if (maxmindLocations.size > 0) {
      processMaxMindData(maxmindLocations, blocks);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const processMaxMindData = (locations: Map<string, MaxMindLocation>, blocks: MaxMindBlock[]) => {
    const ranges: IPRange[] = [];
    const countriesMap = new Map<string, string>();

    blocks.forEach(block => {
      // Use geonameId first, then fall back to registeredCountryGeonameId
      const geonameId = block.geonameId || block.registeredCountryGeonameId;
      const location = locations.get(geonameId);
      
      if (location && location.countryIsoCode) {
        const [network, cidr] = block.network.split('/');
        const cidrNum = parseInt(cidr);
        const networkLong = ipToLong(network);
        const hostBits = 32 - cidrNum;
        const numHosts = Math.pow(2, hostBits);
        const startLong = networkLong;
        const endLong = startLong + numHosts - 1;
        
        const range: IPRange = {
          start: longToIp(startLong),
          end: longToIp(endLong),
          count: numHosts,
          country: location.countryName,
          countryCode: location.countryIsoCode,
          geonameId: geonameId
        };
        
        ranges.push(range);
        countriesMap.set(location.countryIsoCode, location.countryName);
      }
    });

    const countries = Array.from(countriesMap.entries()).map(([code, name]) => ({
      code,
      name
    })).sort((a, b) => a.name.localeCompare(b.name));

    const sortedRanges = sortAndCacheRanges(ranges);
    setAllRanges(sortedRanges);
    setAvailableCountries(countries);
    setFileType('maxmind');
    setSelectedCountry('');
    setIpRanges([]);
    resetProfiles();
  };

  const resetMaxMindData = () => {
    setMaxmindLocations(new Map());
    setMaxmindBlocks([]);
    setUploadedFiles({});
  };

  const resetProfiles = () => {
    setUseProfiles(false);
    setCountryProfiles([]);
    setNextProfileId(1);
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    if (countryCode === '') {
      setIpRanges([]);
    } else {
      const filteredRanges = allRanges.filter(range => range.countryCode === countryCode);
      // Sort and cache the filtered ranges as well
      const sortedFilteredRanges = sortAndCacheRanges(filteredRanges);
      setIpRanges(sortedFilteredRanges);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv']
    },
    multiple: true
  });

  const ipToLong = (ip: string): number => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  };

  const longToIp = (long: number): string => {
    return [
      (long >>> 24) & 255,
      (long >>> 16) & 255,
      (long >>> 8) & 255,
      long & 255
    ].join('.');
  };

  // Optimized binary search lookup function
  const lookupIPCountry = (ip: string): IPLookupResult => {
    const ipLong = ipToLong(ip);
    
    // Binary search through sorted ranges
    let left = 0;
    let right = allRanges.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const range = allRanges[mid];
      const startLong = range.startLong || ipToLong(range.start);
      const endLong = range.endLong || ipToLong(range.end);
      
      if (ipLong >= startLong && ipLong <= endLong) {
        // Found the range containing this IP
        return {
          ip,
          countryCode: range.countryCode || 'Unknown',
          countryName: range.country || 'Unknown',
          found: true
        };
      } else if (ipLong < startLong) {
        // IP is before this range, search left half
        right = mid - 1;
      } else {
        // IP is after this range, search right half
        left = mid + 1;
      }
    }
    
    // IP not found in any range
    return {
      ip,
      countryCode: 'Not Found',
      countryName: 'Not Found',
      found: false
    };
  };

  const parseIPAddresses = (text: string): string[] => {
    // Remove quotes and split by newlines, spaces, or commas
    const cleaned = text.replace(/"/g, '');
    const ips = cleaned.split(/[\n\s,]+/).filter(ip => ip.trim() !== '');
    
    // Validate IP addresses
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ips.filter(ip => ipRegex.test(ip.trim())).map(ip => ip.trim());
  };

  // Batched IP lookup function
  const performBatchedLookup = (ips: string[], batchSize: number = 500) => {
    const results: IPLookupResult[] = [];
    let currentIndex = 0;

    const processBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, ips.length);
      const batch = ips.slice(currentIndex, endIndex);
      
      // Process current batch
      const batchResults = batch.map(ip => lookupIPCountry(ip));
      results.push(...batchResults);
      
      // Update progress
      setProcessedCount(results.length);
      setLookupResults([...results]); // Update UI with current results
      
      currentIndex = endIndex;
      
      if (currentIndex < ips.length) {
        // Schedule next batch
        window.setTimeout(processBatch, 10);
      } else {
        // All done
        setLookupLoading(false);
        setProcessedCount(0);
        setTotalIPsToLookup(0);
      }
    };

    // Start processing
    processBatch();
  };

  const performIPLookup = () => {
    if (!ipLookupText.trim()) {
      alert('Please enter IP addresses to lookup');
      return;
    }

    if (allRanges.length === 0) {
      alert('Please upload country data first');
      return;
    }

    setLookupLoading(true);
    
    const ips = parseIPAddresses(ipLookupText);
    if (ips.length === 0) {
      alert('No valid IP addresses found. Please check your input format.');
      setLookupLoading(false);
      return;
    }

    // Initialize progress tracking
    setTotalIPsToLookup(ips.length);
    setProcessedCount(0);
    setLookupResults([]);

    // Start batched processing
    performBatchedLookup(ips);
  };

  const downloadLookupResults = () => {
    if (lookupResults.length === 0) return;

    const csvContent = [
      'IP Address,Country Code,Country Name,Found',
      ...lookupResults.map(result => 
        `${result.ip},${result.countryCode},${result.countryName},${result.found ? 'Yes' : 'No'}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ip_lookup_results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Profile management functions
  const addCountryProfile = () => {
    if (availableCountries.length === 0) return;
    
    const newProfile: CountryProfile = {
      id: nextProfileId.toString(),
      countryCode: availableCountries[0].code,
      countryName: availableCountries[0].name,
      percentage: countryProfiles.length === 0 ? 100 : 0
    };
    
    setCountryProfiles([...countryProfiles, newProfile]);
    setNextProfileId(nextProfileId + 1);
  };

  const removeCountryProfile = (id: string) => {
    setCountryProfiles(countryProfiles.filter(profile => profile.id !== id));
  };

  const updateProfileCountry = (id: string, countryCode: string) => {
    const country = availableCountries.find(c => c.code === countryCode);
    if (!country) return;

    setCountryProfiles(countryProfiles.map(profile => 
      profile.id === id 
        ? { ...profile, countryCode, countryName: country.name }
        : profile
    ));
  };

  const updateProfilePercentage = (id: string, percentage: number) => {
    setCountryProfiles(countryProfiles.map(profile => 
      profile.id === id 
        ? { ...profile, percentage: Math.max(0, Math.min(100, percentage)) }
        : profile
    ));
  };

  const getTotalPercentage = () => {
    return countryProfiles.reduce((sum, profile) => sum + profile.percentage, 0);
  };

  const getAnywhereElsePercentage = () => {
    const total = getTotalPercentage();
    return Math.max(0, 100 - total);
  };

  const canIncreasePercentage = () => {
    return getTotalPercentage() < 100;
  };

  const canDecreasePercentage = (currentPercentage: number) => {
    return currentPercentage > 0;
  };

  const generateRandomIP = (start: string, end: string): string => {
    const startLong = ipToLong(start);
    const endLong = ipToLong(end);
    const randomLong = Math.floor(Math.random() * (endLong - startLong + 1)) + startLong;
    return longToIp(randomLong);
  };

  const generateIPsWithProfiles = (): string[] => {
    const generatedSet = new Set<string>();
    const anywhereElsePercentage = getAnywhereElsePercentage();
    
    // Generate IPs for each country profile
    countryProfiles.forEach(profile => {
      const targetCount = Math.floor((profile.percentage / 100) * numAddresses);
      const countryRanges = allRanges.filter(range => range.countryCode === profile.countryCode);
      
      if (countryRanges.length === 0) return;
      
      let attempts = 0;
      const maxAttempts = targetCount * 10; // Prevent infinite loops
      
      while (generatedSet.size < (generatedSet.size + targetCount) && attempts < maxAttempts) {
        const rangeIndex = Math.floor(Math.random() * countryRanges.length);
        const range = countryRanges[rangeIndex];
        const ip = generateRandomIP(range.start, range.end);
        
        generatedSet.add(ip);
        attempts++;
      }
    });
    
    // Generate remaining IPs from anywhere else
    if (anywhereElsePercentage > 0 && allRanges.length > 0) {
      const remainingCount = numAddresses - generatedSet.size;
      let attempts = 0;
      const maxAttempts = remainingCount * 10; // Prevent infinite loops
      
      while (generatedSet.size < numAddresses && attempts < maxAttempts) {
        const rangeIndex = Math.floor(Math.random() * allRanges.length);
        const range = allRanges[rangeIndex];
        const ip = generateRandomIP(range.start, range.end);
        
        generatedSet.add(ip);
        attempts++;
      }
    }
    
    return Array.from(generatedSet);
  };

  const generateAndDownloadIPs = () => {
    let rangesToUse: IPRange[] = [];
    
    if (useProfiles && (fileType === 'csv' || fileType === 'maxmind')) {
      if (countryProfiles.length === 0) {
        alert('Please add at least one country profile');
        return;
      }
      
      const totalPercentage = getTotalPercentage();
      if (totalPercentage > 100) {
        alert('Total percentage cannot exceed 100%');
        return;
      }
      
      rangesToUse = allRanges;
    } else {
      rangesToUse = ipRanges;
    }
    
    if (rangesToUse.length === 0) {
      if ((fileType === 'csv' || fileType === 'maxmind') && selectedCountry === '' && !useProfiles) {
        alert('Please select a country first or use profiles');
      } else {
        alert('Please upload IP ranges first');
      }
      return;
    }

    setLoading(true);
    
    // Use setTimeout to prevent UI blocking
    window.setTimeout(() => {
      try {
        let generatedIPs: string[];
        
        if (useProfiles && (fileType === 'csv' || fileType === 'maxmind')) {
          generatedIPs = generateIPsWithProfiles();
        } else {
          // Original generation logic with safety measures
          const generatedSet = new Set<string>();
          const totalRanges = rangesToUse.length;
          let attempts = 0;
          const maxAttempts = numAddresses * 10; // Prevent infinite loops
          
          while (generatedSet.size < numAddresses && attempts < maxAttempts) {
            const rangeIndex = Math.floor(Math.random() * totalRanges);
            const range = rangesToUse[rangeIndex];
            const ip = generateRandomIP(range.start, range.end);
            generatedSet.add(ip);
            attempts++;
          }
          
          generatedIPs = Array.from(generatedSet);
        }

        const content = generatedIPs.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let filename = 'generated_ips.txt';
        if (useProfiles) {
          filename = 'generated_ips_profile.txt';
        } else if ((fileType === 'csv' || fileType === 'maxmind') && selectedCountry) {
          filename = `generated_ips_${selectedCountry.toLowerCase()}.txt`;
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } catch (error) {
        alert('An error occurred while generating IP addresses. Please try again.');
        console.error('IP generation error:', error);
      } finally {
        setLoading(false);
      }
    }, 10);
  };

  const getStatusMessage = () => {
    if (processing) {
      return `🔄 ${processingFile}`;
    }
    
    if (fileType === 'json' && ipRanges.length > 0) {
      return `✅ Loaded ${ipRanges.length} IP ranges from JSON file`;
    } else if (fileType === 'csv') {
      if (selectedCountry === '' && !useProfiles) {
        return `✅ Loaded CSV file with ${availableCountries.length} countries. Please select a country or use profiles.`;
      } else if (useProfiles) {
        return `✅ Loaded CSV file with ${availableCountries.length} countries. Using generation profiles.`;
      } else {
        const selectedCountryName = availableCountries.find(c => c.code === selectedCountry)?.name || selectedCountry;
        return `✅ Loaded ${ipRanges.length} IP ranges for ${selectedCountryName}`;
      }
    } else if (fileType === 'maxmind') {
      const { locations, blocks } = uploadedFiles;
      if (!locations || !blocks) {
        const missing = [];
        if (!locations) missing.push('GeoLite2-Country-Locations-en.csv');
        if (!blocks) missing.push('GeoLite2-Country-Blocks-IPv4.csv');
        return `⚠️ MaxMind format detected. Please upload: ${missing.join(' and ')}`;
      } else if (selectedCountry === '' && !useProfiles) {
        return `✅ Loaded MaxMind data with ${availableCountries.length} countries. Please select a country or use profiles.`;
      } else if (useProfiles) {
        return `✅ Loaded MaxMind data with ${availableCountries.length} countries. Using generation profiles.`;
      } else {
        const selectedCountryName = availableCountries.find(c => c.code === selectedCountry)?.name || selectedCountry;
        return `✅ Loaded ${ipRanges.length} IP ranges for ${selectedCountryName} (MaxMind)`;
      }
    }
    return null;
  };

  const getUploadInstructions = () => {
    if (processing) {
      return processingFile;
    }
    
    if (fileType === 'maxmind') {
      const { locations, blocks } = uploadedFiles;
      if (!locations && !blocks) {
        return 'Drop MaxMind GeoLite2 files here (Locations and Blocks CSV files)';
      } else if (!locations) {
        return 'Drop GeoLite2-Country-Locations-en.csv file here';
      } else if (!blocks) {
        return 'Drop GeoLite2-Country-Blocks-IPv4.csv file here';
      }
    }
    return isDragActive
      ? 'Drop the IP ranges file(s) here'
      : 'Drag and drop IP ranges file(s) here, or click to select';
  };

  const getUploadAreaClasses = () => {
    let classes = `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 `;
    
    if (processing) {
      classes += 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse ';
    } else if (isDragActive) {
      classes += 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ';
    } else if (fileType) {
      classes += 'border-green-500 bg-green-50 dark:bg-green-900/20 ';
    } else {
      classes += 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 ';
    }
    
    return classes;
  };

  const hasCountryData = () => {
    return (fileType === 'csv' || fileType === 'maxmind') && allRanges.length > 0;
  };

  const canUseProfiles = () => {
    return hasCountryData() && availableCountries.length > 0;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Mode Selection */}
      <div className="mb-6">
        <div className="flex space-x-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            onClick={() => setMode('generate')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === 'generate'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Generate IP Addresses
          </button>
          <button
            onClick={() => setMode('lookup')}
            disabled={!hasCountryData()}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === 'lookup' && hasCountryData()
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : hasCountryData()
                ? 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            Lookup IP Countries
            {!hasCountryData() && (
              <span className="ml-1 text-xs">(requires country data)</span>
            )}
          </button>
        </div>
      </div>

      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={getUploadAreaClasses()}
      >
        <input {...getInputProps()} />
        {fileType || processing ? (
          <div>
            {processing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  {getStatusMessage()}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-green-600 dark:text-green-400 font-medium">
                  {getStatusMessage()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {fileType === 'maxmind' && (!uploadedFiles.locations || !uploadedFiles.blocks)
                    ? getUploadInstructions()
                    : 'Drop new file(s) to replace'
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {getUploadInstructions()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supports: JSON, CSV, or MaxMind GeoLite2 format
            </p>
          </div>
        )}
      </div>

      {mode === 'generate' ? (
        <>
          {/* Profile Toggle */}
          {canUseProfiles() && (
            <div className="mt-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="useProfiles"
                  checked={useProfiles}
                  onChange={(e) => {
                    setUseProfiles(e.target.checked);
                    if (e.target.checked && countryProfiles.length === 0) {
                      // Add first profile with 100%
                      addCountryProfile();
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={processing}
                />
                <label htmlFor="useProfiles" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use country distribution profiles
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Create sophisticated IP generation profiles with custom country percentages
              </p>
            </div>
          )}

          {/* Country Profiles */}
          {useProfiles && canUseProfiles() && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Country Distribution Profiles
                </h3>
                <button
                  onClick={addCountryProfile}
                  disabled={processing}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors duration-200 disabled:bg-gray-400"
                >
                  Add Country
                </button>
              </div>

              {countryProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <select
                    value={profile.countryCode}
                    onChange={(e) => updateProfileCountry(profile.id, e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    disabled={processing}
                  >
                    {availableCountries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateProfilePercentage(profile.id, profile.percentage - 1)}
                      disabled={processing || !canDecreasePercentage(profile.percentage)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={profile.percentage}
                      onChange={(e) => updateProfilePercentage(profile.id, parseInt(e.target.value) || 0)}
                      className="w-16 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      disabled={processing}
                    />
                    
                    <button
                      onClick={() => updateProfilePercentage(profile.id, profile.percentage + 1)}
                      disabled={processing || !canIncreasePercentage()}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                    
                    <span className="text-sm text-gray-600 dark:text-gray-300 w-6">%</span>
                  </div>
                  
                  <button
                    onClick={() => removeCountryProfile(profile.id)}
                    disabled={processing}
                    className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium disabled:bg-gray-400"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Anywhere Else Profile */}
              {getAnywhereElsePercentage() > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex-1 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Anywhere else in the world
                  </div>
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {getAnywhereElsePercentage()}%
                  </div>
                </div>
              )}

              {/* Total Percentage Display */}
              <div className={`p-3 rounded-lg border ${
                getTotalPercentage() === 100 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : getTotalPercentage() > 100
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    getTotalPercentage() === 100 
                      ? 'text-green-800 dark:text-green-200' 
                      : getTotalPercentage() > 100
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-blue-800 dark:text-blue-200'
                  }`}>
                    Total Distribution
                  </span>
                  <span className={`text-sm font-bold ${
                    getTotalPercentage() === 100 
                      ? 'text-green-800 dark:text-green-200' 
                      : getTotalPercentage() > 100
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-blue-800 dark:text-blue-200'
                  }`}>
                    {getTotalPercentage()}% + {getAnywhereElsePercentage()}% = 100%
                  </span>
                </div>
                {getTotalPercentage() > 100 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Total percentage cannot exceed 100%. Please adjust the values.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Country Selection for Generate Mode (when not using profiles) */}
          {!useProfiles && (fileType === 'csv' || fileType === 'maxmind') && availableCountries.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={processing}
              >
                <option value="">-- Select a country --</option>
                {availableCountries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Number of Addresses Input */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Number of IP addresses to generate
            </label>
            <input
              type="number"
              min="1"
              value={numAddresses}
              onChange={(e) => setNumAddresses(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={processing}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateAndDownloadIPs}
            disabled={loading || processing || (useProfiles ? countryProfiles.length === 0 || getTotalPercentage() > 100 : ipRanges.length === 0)}
            className={`mt-4 w-full px-4 py-2 rounded-md text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2
              ${loading || processing || (useProfiles ? countryProfiles.length === 0 || getTotalPercentage() > 100 : ipRanges.length === 0)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg transform hover:scale-[1.02]'
              }
            `}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <span>Generate and Download IPs</span>
            )}
          </button>
        </>
      ) : (
        <>
          {/* IP Lookup Mode */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              IP Addresses to Lookup
            </label>
            <textarea
              value={ipLookupText}
              onChange={(e) => setIpLookupText(e.target.value)}
              placeholder={`Enter IP addresses separated by newlines, spaces, or commas.\nExamples:\n192.168.1.1\n10.0.0.1, 172.16.0.1\n\"8.8.8.8\" \"8.8.4.4\"`}
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical"
              disabled={processing || !hasCountryData()}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Supports newline, space, or comma separated IP addresses with optional quotes
            </p>
          </div>

          {/* Lookup Button */}
          <button
            onClick={performIPLookup}
            disabled={lookupLoading || processing || !hasCountryData() || !ipLookupText.trim()}
            className={`mt-4 w-full px-4 py-2 rounded-md text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2
              ${lookupLoading || processing || !hasCountryData() || !ipLookupText.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 hover:shadow-lg transform hover:scale-[1.02]'
              }
            `}
          >
            {lookupLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>
                  {totalIPsToLookup > 0 
                    ? `Looking up (${processedCount}/${totalIPsToLookup})...`
                    : 'Looking up...'
                  }
                </span>
              </>
            ) : (
              <span>Lookup IP Countries</span>
            )}
          </button>

          {/* Lookup Results */}
          {lookupResults.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Lookup Results ({lookupResults.length} IPs)
                  {lookupLoading && totalIPsToLookup > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      Processing: {processedCount}/{totalIPsToLookup}
                    </span>
                  )}
                </h3>
                <button
                  onClick={downloadLookupResults}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Download CSV
                </button>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Country Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Country Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {lookupResults.map((result, index) => (
                        <tr key={index} className={result.found ? '' : 'bg-red-50 dark:bg-red-900/20'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                            {result.ip}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {result.countryCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {result.countryName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {result.found ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Found
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Not Found
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Found: {lookupResults.filter(r => r.found).length} | 
                  Not Found: {lookupResults.filter(r => !r.found).length}
                </p>
              </div>

              {/* Country Summary Component */}
              <CountrySummary lookupResults={lookupResults} />
            </div>
          )}
        </>
      )}
    </div>
  );
};