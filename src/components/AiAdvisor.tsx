import React, { useState } from 'react';
import { SG_HDB_TOWNS, FLAT_TYPES } from '../data/towns';
import {
  Sparkles,
  Send,
  Calculator,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Lightbulb,
  Building,
  DollarSign
} from 'lucide-react';

interface AiAdvisorProps {
  selectedTown: string;
  setSelectedTown: (town: string) => void;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({
  selectedTown,
  setSelectedTown
}) => {
  const [selectedFlatType, setSelectedFlatType] = useState<string>('4 ROOM');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Financial Affordability Calculator State
  const [householdIncome, setHouseholdIncome] = useState<number>(8000);
  const [firstTimeBuyer, setFirstTimeBuyer] = useState<boolean>(true);
  const [liveNearParents, setLiveNearParents] = useState<boolean>(true);
  const [loanTenureYears, setLoanTenureYears] = useState<number>(25);

  // Singapore HDB Housing Grants Estimation Logic:
  // 1. Enhanced CPF Housing Grant (EHG): Scaled according to household income (up to $80,000 for couples earning <= $9,000)
  const calculateEHG = (income: number): number => {
    if (income <= 1500) return 80000;
    if (income <= 2000) return 75000;
    if (income <= 2500) return 70000;
    if (income <= 3000) return 65000;
    if (income <= 3500) return 60000;
    if (income <= 4000) return 55000;
    if (income <= 4500) return 50000;
    if (income <= 5000) return 45000;
    if (income <= 6000) return 35000;
    if (income <= 7000) return 25000;
    if (income <= 8000) return 15000;
    if (income <= 9000) return 5000;
    return 0;
  };

  const estimatedEHG = firstTimeBuyer ? calculateEHG(householdIncome) : 0;
  const estimatedFamilyGrant = firstTimeBuyer ? (selectedFlatType === '2 ROOM' ? 40000 : 50000) : 0;
  const estimatedPHG = liveNearParents ? 30000 : 0;
  const totalGrants = estimatedEHG + estimatedFamilyGrant + estimatedPHG;

  // Mortgage Servicing Ratio (MSR) cap: 30% of gross monthly income for HDB flats
  const maxMonthlyMSR = Math.round(householdIncome * 0.3);

  // HDB Concessionary Loan rate: 2.6% p.a.
  // Loan amount formula: PV = PMT * [(1 - (1+r)^-n) / r]
  const r = 0.026 / 12;
  const n = loanTenureYears * 12;
  const maxHdbLoan = Math.round(
    maxMonthlyMSR * ((1 - Math.pow(1 + r, -n)) / r)
  );
  const estimatedAffordableBudget = maxHdbLoan + totalGrants + 60000; // adding typical CPF Ordinary Account savings

  const handleAskAI = async (customText?: string) => {
    const questionToAsk = customText || userPrompt;
    if (!questionToAsk.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: questionToAsk,
          town: selectedTown !== 'ALL' ? selectedTown : undefined,
          flatType: selectedFlatType,
          budget: estimatedAffordableBudget,
          scenario: `Household Income: $${householdIncome}/mo, First-timer: ${firstTimeBuyer}, Grants: $${totalGrants}`
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate AI insights');
      }

      setAiResponse(data.insight);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with AI Advisor.');
    } finally {
      setIsGenerating(false);
    }
  };

  const promptSuggestions = [
    {
      title: 'Tampines vs Punggol 4-Room Comparison',
      prompt: 'Compare buying a 4-room resale flat in Tampines vs Punggol. Evaluate recent price trends, amenities, rental yield, and resale liquidity.'
    },
    {
      title: 'Highest Cashflow Towns Under $600k',
      prompt: 'Which Singapore HDB towns currently offer the best gross rental yield and cashflow for flats under $600,000?'
    },
    {
      title: 'First-Timer Grants & Budget Strategy',
      prompt: `We are first-time buyers with a household income of $${householdIncome}/mo looking for a ${selectedFlatType} in ${selectedTown !== 'ALL' ? selectedTown : 'Singapore'}. What is our optimal grant strategy, estimated monthly installment, and recommended mature vs non-mature estates?`
    },
    {
      title: 'HDB MOP & Plus/Prime Model Rules',
      prompt: 'Explain the new Standard vs Plus vs Prime HDB classification framework, the 10-year MOP restrictions, and how it impacts resale values over the next decade.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 2.5 Flash Engine · Grounded in Live Singapore Data</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          HDB Smart Copilot &amp; Affordability Engine
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Get personalized housing valuation advice, CPF grant estimations, and comparative town analysis tailored for Singapore citizens, PRs, and homebuyers.
        </p>
      </div>

      {/* 2-Column Split: Financial Grant Estimator & AI Copilot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Affordability & CPF Grant Estimator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  CPF Grant &amp; Affordability Calculator
                </h2>
                <p className="text-xs text-slate-500">Official Singapore HDB grant rules (2026/2027)</p>
              </div>
            </div>

            {/* Income Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Gross Household Monthly Income:</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">
                  ${householdIncome.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={2000}
                max={16000}
                step={250}
                value={householdIncome}
                onChange={(e) => setHouseholdIncome(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>$2,000</span>
                <span>$9,000 (EHG ceiling)</span>
                <span>$16,000</span>
              </div>
            </div>

            {/* Eligibility Checkboxes */}
            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={firstTimeBuyer}
                  onChange={(e) => setFirstTimeBuyer(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500 accent-red-600 cursor-pointer"
                />
                <span>First-Timer Couple / Family Applicant</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={liveNearParents}
                  onChange={(e) => setLiveNearParents(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500 accent-red-600 cursor-pointer"
                />
                <span>Living with / within 4km of Parents (PHG)</span>
              </label>
            </div>

            {/* Flat Type selection for Calculator */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Target Flat Type
              </label>
              <select
                value={selectedFlatType}
                onChange={(e) => setSelectedFlatType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="2 ROOM">2-ROOM</option>
                <option value="3 ROOM">3-ROOM</option>
                <option value="4 ROOM">4-ROOM</option>
                <option value="5 ROOM">5-ROOM</option>
                <option value="EXECUTIVE">EXECUTIVE</option>
              </select>
            </div>

            {/* Computed Breakdown Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span>Estimated Housing Grants</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  +${totalGrants.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Enhanced CPF Housing Grant (EHG):</span>
                <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                  ${estimatedEHG.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>CPF Family Grant (Resale):</span>
                <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                  ${estimatedFamilyGrant.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Proximity Housing Grant (PHG):</span>
                <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                  ${estimatedPHG.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Max Monthly MSR (30% cap):</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                    ${maxMonthlyMSR.toLocaleString()}/mo
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Max Estimated HDB Loan (2.6%):</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                    ${maxHdbLoan.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-slate-100 font-bold pt-1">
                  <span>Est. Total Purchase Budget:</span>
                  <span className="font-mono text-red-600 dark:text-red-400 text-sm">
                    ~${estimatedAffordableBudget.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const prompt = `Based on our household income of $${householdIncome}/mo, estimated grants of $${totalGrants.toLocaleString()}, and affordable flat budget of ~$${estimatedAffordableBudget.toLocaleString()}: What are the best towns in Singapore to buy a ${selectedFlatType} resale flat? Provide estimated monthly cash/CPF outlay and compare 3 matching estates.`;
                handleAskAI(prompt);
              }}
              className="w-full py-2.5 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Ask AI to Recommend Estates for this Budget</span>
            </button>
          </div>
        </div>

        {/* Right Column: AI Interactive Copilot Q&A (7 cols) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          {/* Quick Preset Prompts */}
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
              Popular Market Questions &amp; Strategies
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {promptSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUserPrompt(item.prompt);
                    handleAskAI(item.prompt);
                  }}
                  className="p-3 text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-400 transition-colors cursor-pointer group"
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-red-600">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {item.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ask AI Input Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Ask HDB Smart Copilot</span>
              <span>Grounded in official Singapore data</span>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                placeholder="Ask anything e.g. 'Compare buying in Clementi vs Jurong East for young families', 'Is Queenstown worth the $1M price tag?', or 'Explain the BTO to Resale upgrade timeline'..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-400">
                Focus Town: <span className="font-semibold">{selectedTown}</span>
              </div>
              <button
                onClick={() => handleAskAI()}
                disabled={isGenerating || !userPrompt.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Analyzing Market...' : 'Generate Guidance'}</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
              {errorMsg}
            </div>
          )}

          {/* AI Response Display */}
          {aiResponse ? (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex-1">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    HDB Market Advisor Assessment
                  </span>
                </div>
                <button
                  onClick={() => setAiResponse(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed whitespace-pre-line">
                {aiResponse}
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500 space-y-2">
              <Building className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Ready to analyze Singapore public housing data
              </div>
              <p className="max-w-md mx-auto text-slate-400">
                Select one of the quick questions above or input your specific housing situation to generate detailed data-driven insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
