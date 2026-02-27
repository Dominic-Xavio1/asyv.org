{/* Alumni Overview section for CRC / Superuser */}
{isCrcOrSuperuser && (
  <div className="space-y-6 mb-8">
    {/* Header Section */}
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
            Alumni Analytics Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive overview of graduate outcomes, education, and employment statistics
          </p>
        </div>
    
      </div>

      {/* Grade Filter Section - Compact and organized */}
      
    </div>

    {/* Key Metrics Cards - Grid Layout */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {overviewLoading ? (
        // Skeleton loading state
        [...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))
      ) : (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Graduates</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {overviewStats.totalGraduates.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              {overviewStats.filteredByGrade ? "Filtered by grade" : "All time"}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-emerald-200 dark:border-emerald-900 p-6 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-gray-900">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-2">Continued Education</p>
            <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">
              {overviewStats.continuedEducation.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              {overviewStats.continuedEducationPct}% of graduates
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-sky-200 dark:border-sky-900 p-6 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/30 dark:to-gray-900">
            <p className="text-sm text-sky-700 dark:text-sky-400 mb-2">Employed</p>
            <p className="text-3xl font-bold text-sky-800 dark:text-sky-300">
              {overviewStats.employed.toLocaleString()}
            </p>
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-sky-500"></span>
              {overviewStats.employedPct}% of graduates
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">With Outcome Recorded</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {(overviewStats.withEitherOutcome ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
              {overviewStats.withEitherOutcomePct ?? 0}% have education or employment
            </p>
          </div>
        </>
      )}
    </div>

    {/* Employment Overview Card */}
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Employment & Education Overview
        </h3>
        <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
          Based on selected grades
        </span>
      </div>
      
      {overviewStats.totalGraduates === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No graduates in the selected scope.
        </p>
      ) : (
        <>
          {(() => {
            const total = overviewStats.totalGraduates || 1;
            const employed = overviewStats.employed || 0;
            const withEither = overviewStats.withEitherOutcome || 0;
            const noOutcome = Math.max(total - withEither, 0);
            const feOnly = Math.max(withEither - employed, 0);

            const employedPct = Math.round((employed / total) * 100);
            const noOutcomePct = Math.round((noOutcome / total) * 100);
            const feOnlyPct = Math.max(0, 100 - employedPct - noOutcomePct);

            return (
              <>
                <div className="h-6 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex mb-4">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${employedPct}%` }}
                    title={`Employed: ${employedPct}%`}
                  />
                  <div
                    className="h-full bg-sky-400 transition-all duration-500"
                    style={{ width: `${feOnlyPct}%` }}
                    title={`Further Education Only: ${feOnlyPct}%`}
                  />
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${noOutcomePct}%` }}
                    title={`No Outcome: ${noOutcomePct}%`}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Employed</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{employed.toLocaleString()} <span className="text-sm font-normal text-gray-500">({employedPct}%)</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg">
                    <span className="w-3 h-3 rounded-full bg-sky-400"></span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Further Education Only</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{feOnly.toLocaleString()} <span className="text-sm font-normal text-gray-500">({feOnlyPct}%)</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No Outcome Recorded</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{noOutcome.toLocaleString()} <span className="text-sm font-normal text-gray-500">({noOutcomePct}%)</span></p>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>

    {/* Statistics Grid - 2x2 Layout for main charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Degree Level Distribution */}
      {sortedDegreeData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              Degree Level Distribution
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {sortedDegreeData.length} levels
            </span>
          </div>
          
          <div className="space-y-4">
            {sortedDegreeData.map((item) => {
              const count = parseInt(item.count ?? 0, 10) || 0;
              const pct = overviewStats.totalGraduates
                ? Math.round((count / overviewStats.totalGraduates) * 100)
                : 0;
              const levelLabel = item.level_label || "Unknown Level";
              
              return (
                <div key={levelLabel} className="group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {levelLabel}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {count.toLocaleString()} <span className="text-xs text-gray-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500 group-hover:bg-blue-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Areas of Study */}
      {overviewStats.areasOfStudy.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Top Areas of Study
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Top 10 fields
            </span>
          </div>
          
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {overviewStats.areasOfStudy.slice(0, 10).map((item) => {
              const count = parseInt(item.count ?? 0, 10) || 0;
              const pct = overviewStats.totalGraduates
                ? Math.round((count / overviewStats.totalGraduates) * 100)
                : 0;
              const degreeName = item.degree || "Unknown Field";
              
              return (
                <div key={degreeName} className="group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" title={degreeName}>
                      {degreeName}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {count.toLocaleString()} <span className="text-xs text-gray-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-500 group-hover:bg-purple-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* Second Row - 2x2 Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Colleges by Country */}
      {overviewStats.collegesByCountry.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
              Colleges by Country
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {overviewStats.collegesByCountry.length} countries
            </span>
          </div>
          
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {overviewStats.collegesByCountry.map((item) => {
              const count = parseInt(item.count ?? 0, 10) || 0;
              const pct = overviewStats.totalGraduates
                ? Math.round((count / overviewStats.totalGraduates) * 100)
                : 0;
              const country = item.country || "Unknown Country";
              
              return (
                <div key={country} className="group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {country}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {count.toLocaleString()} <span className="text-xs text-gray-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500 group-hover:bg-indigo-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Industry Distribution */}
      {overviewStats.industryDistribution.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
              Industry Distribution
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Top 10 industries
            </span>
          </div>
          
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {overviewStats.industryDistribution.slice(0, 10).map((item) => {
              const count = parseInt(item.count ?? 0, 10) || 0;
              const pct = overviewStats.totalGraduates
                ? Math.round((count / overviewStats.totalGraduates) * 100)
                : 0;
              const industry = item.industry || "Not specified";
              
              return (
                <div key={industry} className="group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" title={industry}>
                      {industry}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {count.toLocaleString()} <span className="text-xs text-gray-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500 group-hover:bg-amber-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* Third Row - Side by Side Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Employers */}
      {overviewStats.topEmployers.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
              Top Employers
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {overviewStats.topEmployers.length} companies
            </span>
          </div>
          
          <div className="space-y-3">
            {overviewStats.topEmployers.map((item, index) => {
              const count = parseInt(item.count ?? 0, 10) || 0;
              const company = item.company || "Not specified";
              
              return (
                <div key={company} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {company}
                    </span>
                  </div>
                  <span className="text-sm font-semibold px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Further Education Toggle Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <span className="w-1 h-6 bg-green-500 rounded-full"></span>
            Further Education Analysis
          </h3>
          <Button
            onClick={() => setOpeningFurtherEducation(!openingFurtherEducation)}
            variant={openingFurtherEducation ? "default" : "outline"}
            className={`text-sm ${
              openingFurtherEducation 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
          >
            {openingFurtherEducation ? "Hide Details" : "View Details"}
          </Button>
        </div>
        
        {openingFurtherEducation && overviewStats.degreeStats?.length > 0 && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-300">
            {overviewStats.degreeStats.map((row) => {
              const count = parseInt(row.count ?? 0, 10) || 0;
              const pct = overviewStats.totalGraduates
                ? Math.round((count / overviewStats.totalGraduates) * 100)
                : 0;
              const degreeLabel = row.degree || "Unspecified degree";
              
              return (
                <div key={degreeLabel} className="group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {degreeLabel}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {count.toLocaleString()} <span className="text-xs text-gray-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-500 group-hover:bg-green-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {openingFurtherEducation && (!overviewStats.degreeStats || overviewStats.degreeStats.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No further education records for the selected scope.
          </p>
        )}
      </div>
    </div>

    {/* Outcomes by Year - Full Width Section */}
    {overviewStats.outcomesByYear.length > 0 && (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Outcomes by Graduation Year
          </h3>
          <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
            {overviewStats.outcomesByYear.length} years
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overviewStats.outcomesByYear.map((yearData) => {
            const total = parseInt(yearData.total ?? 0, 10) || 0;
            const employed = parseInt(yearData.employment_only ?? 0, 10) || 0;
            const feOnly = parseInt(yearData.fe_only ?? 0, 10) || 0;
            const both = parseInt(yearData.both ?? 0, 10) || 0;
            const neither = parseInt(yearData.neither ?? 0, 10) || 0;
            const gradYear = yearData.grad_year || "Unknown Year";
            
            const employedPct = total > 0 ? Math.round(((employed + both) / total) * 100) : 0;
            const fePct = total > 0 ? Math.round(((feOnly + both) / total) * 100) : 0;
            const neitherPct = total > 0 ? Math.round((neither / total) * 100) : 0;
            
            return (
              <div key={gradYear} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Class of {gradYear}</h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{total} graduates</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Employed</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{employed + both} ({employedPct}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${employedPct}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Further Education</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{feOnly + both} ({fePct}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full bg-sky-500" style={{ width: `${fePct}%` }} />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Both: {both}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Neither: {neither} ({neitherPct}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
)}