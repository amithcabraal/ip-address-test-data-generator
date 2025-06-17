# Changelog

All notable changes to this project will be documented in this file.

## [1.5.1] - 2025-01-27

### Fixed
- **Batched IP Lookup Processing**: Resolved browser hanging issue during large IP address lookups
  - Implemented batched processing with configurable batch size (default: 500 IPs per batch)
  - Added real-time progress tracking showing "Looking up (X/Y)..." during processing
  - Used `window.setTimeout` with 10ms delays between batches to prevent UI blocking
  - Progressive results display - UI updates after each batch completion
  - Added progress indicators in lookup results header showing current processing status

### Enhanced
- **Lookup Performance**: Dramatically improved responsiveness for large IP datasets
  - Non-blocking batch processing prevents browser freezing
  - Real-time progress feedback keeps users informed during long operations
  - Maintains full functionality while processing thousands of IP addresses
  - Graceful handling of processing interruption and error states

### Technical Improvements
- **State Management**: Added new state variables for batch processing control
  - `processedCount`: Tracks number of IP addresses processed so far
  - `totalIPsToLookup`: Stores total number of IP addresses to be processed
  - Enhanced loading states with detailed progress information
- **Batch Processing Algorithm**: Efficient chunked processing implementation
  - Configurable batch size for optimal performance tuning
  - Automatic batch scheduling using `window.setTimeout`
  - Progressive result accumulation with real-time UI updates
  - Proper cleanup and state reset on completion or cancellation

### User Experience
- **Progress Visibility**: Clear indication of lookup progress and status
  - Dynamic button text showing current progress (e.g., "Looking up (150/1000)...")
  - Results header displays processing status during batch operations
  - Immediate feedback when processing starts and completes
  - Responsive interface maintained throughout large lookup operations

## [1.5.0] - 2025-01-27

### Added
- **Sophisticated IP Generation Profiles**: Advanced country distribution system for precise IP generation control
  - Toggle between simple country selection and advanced profile-based generation
  - Multiple country profiles with custom percentage allocation (e.g., 90% UK, 5% Ireland, 5% anywhere else)
  - Automatic "Anywhere else" calculation to ensure total equals 100%
  - Real-time percentage validation with visual feedback
  - +/- buttons for easy percentage adjustment with smart limits
  - Profile management with add/remove country functionality
  - Visual indicators for total distribution status (green for 100%, red for over 100%)

### Enhanced
- **Generation Mode Interface**: Improved user experience for IP generation
  - Profile toggle checkbox with descriptive help text
  - Dynamic country dropdown selection for each profile
  - Intuitive percentage controls with increment/decrement buttons
  - Real-time validation preventing totals over 100%
  - Clear visual separation between profile and simple modes
  - Enhanced status messages showing current generation mode
- **Smart File Naming**: Generated files now reflect the generation method
  - Profile-based generations: `generated_ips_profile.txt`
  - Country-specific generations: `generated_ips_[country].txt`
  - Default generations: `generated_ips.txt`

### Technical Improvements
- **Profile-Based Generation Algorithm**: Sophisticated IP distribution system
  - Percentage-based allocation ensuring accurate country representation
  - Fallback to "anywhere else" for remaining percentage allocation
  - Duplicate prevention across all country profiles
  - Efficient random selection from country-specific IP ranges
- **State Management**: Enhanced component state handling
  - Profile state management with unique IDs
  - Automatic profile reset when switching file types
  - Validation state tracking for percentage totals
  - Smart enabling/disabling of controls based on data availability
- **User Interface Logic**: Improved control flow and validation
  - Dynamic button states based on percentage limits
  - Real-time total calculation and display
  - Conditional rendering based on file type and mode selection
  - Enhanced error handling for profile validation

### User Experience
- **Intuitive Profile Creation**: Streamlined workflow for creating distribution profiles
  - First profile defaults to 100% for immediate usability
  - Easy country selection from available geographic data
  - Visual feedback for percentage adjustments
  - Clear indication of remaining percentage allocation
- **Professional Validation**: Comprehensive input validation and feedback
  - Real-time percentage total calculation with color-coded status
  - Prevention of invalid configurations (over 100% total)
  - Clear error messages and guidance for corrections
  - Disabled states for invalid operations

## [1.4.1] - 2025-01-27

### Performance Improvements
- **Optimized IP Lookup Performance**: Dramatically improved IP lookup speed and eliminated browser hanging
  - Implemented binary search algorithm for IP range lookups (O(log N) vs O(N) complexity)
  - Added automatic sorting of IP ranges on data load for binary search compatibility
  - Cached long integer representations of IP addresses to avoid repeated conversions
  - Added setTimeout wrapper for large lookup operations to prevent UI blocking
  - Optimized memory usage with efficient data structures

### Technical Enhancements
- **Binary Search Implementation**: Fast logarithmic-time IP range matching
  - Sorted IP ranges by start address for optimal search performance
  - Pre-computed and cached long integer values for all IP ranges
  - Efficient range boundary checking with minimal computational overhead
- **Data Structure Optimization**: Enhanced IPRange interface with cached values
  - Added startLong and endLong properties for performance caching
  - Implemented sortAndCacheRanges helper function for consistent data preparation
  - Optimized country filtering with pre-sorted ranges

### User Experience
- **Responsive Interface**: Eliminated browser freezing during large IP lookups
  - Non-blocking lookup operations for better user experience
  - Maintained real-time feedback and loading states
  - Improved performance for datasets with thousands of IP ranges
- **Scalability**: Enhanced support for large geographic databases
  - Efficient handling of MaxMind GeoLite2 databases with millions of IP ranges
  - Optimized CSV processing for large country-based IP datasets
  - Reduced memory footprint and improved processing speed

## [1.4.0] - 2025-01-27

### Added
- **Country Summary Visualization**: Comprehensive analytics for IP lookup results
  - Summary statistics showing total countries found, IPs located, and IPs not found
  - Detailed country distribution table with IP counts and percentages
  - Interactive bar chart visualization using Recharts library
  - Color-coded country indicators for easy identification
  - Separate CSV download for country summary data
- **Enhanced Data Visualization**: Professional charts and graphs
  - Responsive bar chart with hover tooltips showing detailed country information
  - Custom color palette for up to 15 different countries
  - Rotated country code labels for better readability
  - Dark mode compatible chart styling

### Enhanced
- **Lookup Results Display**: Improved presentation of IP lookup data
  - Country summary section appears below detailed lookup results
  - Visual separation between individual results and aggregate statistics
  - Consistent styling with existing application theme
- **Export Functionality**: Extended download capabilities
  - Individual lookup results CSV export
  - Separate country summary CSV export with aggregated statistics
  - Properly formatted CSV files with headers and percentage calculations

### Technical Improvements
- **Chart Integration**: Added Recharts library for data visualization
  - Responsive container for mobile-friendly charts
  - Custom tooltip formatting with country names and codes
  - Optimized rendering for large datasets
- **Data Processing**: Enhanced analytics calculations
  - Efficient country grouping and counting algorithms
  - Percentage calculations with proper rounding
  - Memory-efficient processing of large lookup result sets
- **Component Architecture**: Modular design for maintainability
  - Separate CountrySummary component for reusability
  - Clean separation of concerns between lookup and visualization
  - TypeScript interfaces for type safety

### User Experience
- **Visual Analytics**: Clear presentation of country distribution data
  - At-a-glance statistics cards showing key metrics
  - Sortable table with country rankings by IP count
  - Interactive chart with hover states for detailed information
- **Professional Styling**: Consistent design language throughout
  - Matching color schemes with application theme
  - Proper spacing and typography hierarchy
  - Responsive design for all screen sizes

## [1.3.0] - 2025-01-27

### Added
- **IP Address Lookup Feature**: New mode to lookup country information for existing IP addresses
  - Toggle between "Generate IP Addresses" and "Lookup IP Countries" modes
  - Text area input supporting multiple IP address formats (newline, space, or comma separated)
  - Support for quoted IP addresses (e.g., "192.168.1.1")
  - Real-time validation of IP address format
  - Comprehensive lookup results table showing IP, country code, country name, and found status
  - CSV export functionality for lookup results with download button
  - Visual indicators for found vs not found IP addresses
  - Summary statistics showing found/not found counts

### Enhanced
- **Mode Selection Interface**: Clean toggle interface to switch between generation and lookup modes
- **Country Data Validation**: Lookup mode only available when country data (CSV or MaxMind) is uploaded
- **Results Display**: Professional table layout with sticky headers and scrollable results
- **Status Indicators**: Color-coded badges showing lookup success/failure status
- **Error Handling**: Robust validation for IP address format and empty inputs

### Technical Improvements
- **IP Range Matching**: Efficient algorithm to match IP addresses against loaded geographic ranges
- **Input Parsing**: Flexible parser handling various IP address input formats and separators
- **Performance Optimization**: Fast lookup using long integer comparison for IP range matching
- **Memory Management**: Efficient handling of large lookup result sets
- **Type Safety**: Added comprehensive TypeScript interfaces for lookup results

### User Experience
- **Intuitive Interface**: Clear mode selection with disabled states when prerequisites aren't met
- **Real-time Feedback**: Loading states and progress indicators during lookup operations
- **Export Functionality**: One-click CSV download of lookup results for further analysis
- **Visual Hierarchy**: Clear distinction between found and not found results with color coding

## [1.2.1] - 2025-01-27

### Added
- **File Processing Indicators**: Added comprehensive visual feedback during file upload and processing
  - Animated spinner and progress messages while files are being processed
  - Real-time status updates showing which file is currently being processed
  - Visual state changes in upload area (pulsing animation during processing)
  - Processing state prevents user interaction until files are fully loaded

### Enhanced
- **Upload Area Visual States**: Improved upload area with distinct visual states
  - Default state with upload icon and instructions
  - Processing state with blue border and pulsing animation
  - Success state with green border and checkmark indicators
  - Drag-active state with blue highlighting
- **User Experience**: Enhanced feedback and interaction design
  - Disabled form controls during file processing to prevent conflicts
  - Sequential file processing with visual feedback for each step
  - Smooth transitions and hover effects on interactive elements
  - Better error handling with specific file names in error messages

### Technical Improvements
- **Async File Processing**: Implemented proper async/await pattern for file processing
- **State Management**: Added processing and processingFile state variables for better UX control
- **Animation Classes**: Added Tailwind CSS animations for loading states and transitions
- **Accessibility**: Improved accessibility with proper disabled states and visual feedback

## [1.2.0] - 2025-01-27

### Added
- **MaxMind GeoLite2 Format Support**: Added comprehensive support for MaxMind GeoLite2 database format
  - Support for `GeoLite2-Country-Locations-en.csv` file containing geographic location data
  - Support for `GeoLite2-Country-Blocks-IPv4.csv` file containing IP network blocks
  - Automatic joining of location and block data using geoname_id relationships
- **CIDR Notation Processing**: Automatic conversion from CIDR notation (e.g., 1.186.0.0/17) to IP ranges
- **Multi-File Upload**: Enhanced file upload to handle multiple files simultaneously for MaxMind format
- **Advanced CSV Parsing**: Improved CSV parsing to handle quoted fields and complex data structures
- **Geographic Data Integration**: Seamless integration of geographic metadata with IP ranges

### Enhanced
- **File Type Detection**: Intelligent detection of MaxMind format files based on filename patterns
- **Upload Status Feedback**: Enhanced status messages showing which MaxMind files are uploaded and missing
- **Country Selection**: Extended country filtering to work with MaxMind's comprehensive geographic database
- **Error Handling**: Improved error handling for complex multi-file uploads and data processing

### Technical Improvements
- **Data Structure Optimization**: Enhanced data structures to handle MaxMind's geoname_id relationships
- **Memory Efficiency**: Optimized processing of large MaxMind database files
- **Type Safety**: Added comprehensive TypeScript interfaces for MaxMind data structures
- **Parsing Robustness**: Improved CSV parsing to handle various quote and delimiter scenarios

## [1.1.0] - 2025-01-27

### Added
- **CSV File Format Support**: Added support for uploading CSV files containing IP ranges with country information
- **Country Filtering**: When using CSV files, users can now select specific countries from a dropdown to filter IP ranges
- **Long Integer to IP Conversion**: Automatic conversion from 32-bit long integers to standard dotted decimal IP format
- **Enhanced File Detection**: Application now automatically detects and handles both JSON and CSV file formats
- **Country-Specific Downloads**: Generated IP files are automatically named based on the selected country (e.g., `generated_ips_au.txt`)

### Enhanced
- **Improved Instructions**: Updated help documentation to include detailed information about both JSON and CSV file formats
- **Better User Feedback**: Enhanced status messages to clearly indicate file type, loaded ranges, and country selection status
- **Responsive Country Selection**: Dynamic dropdown population based on countries available in the uploaded CSV file

### Technical Improvements
- **Type Safety**: Added proper TypeScript interfaces for CSV data handling
- **Error Handling**: Improved file parsing with better error messages for invalid formats
- **Memory Efficiency**: Optimized handling of large CSV files with country-based filtering

## [1.0.0] - 2025-01-27

### Initial Release
- **Core Functionality**: IP address generation from JSON-formatted IP ranges
- **Modern UI**: Clean, responsive interface with dark/light theme support
- **File Upload**: Drag-and-drop file upload with visual feedback
- **Customizable Generation**: User-configurable number of IP addresses to generate
- **Duplicate Prevention**: Automatic removal of duplicate IP addresses
- **Download Feature**: One-click download of generated IP addresses as text file
- **Welcome Modal**: Dismissible welcome modal with instructions
- **Theme Support**: Light, dark, and system theme options
- **Responsive Design**: Mobile-friendly interface
- **Settings Menu**: Burger menu with help, share, and privacy policy options