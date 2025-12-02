import { useEffect, useState } from "react";
import { useKeycloak } from "../context/keycloakHooks";
import { API_ENDPOINTS } from "../config/api.config";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CarrierMetrics {
  carrier_id: string;
  name: string;
  avg_cost: number;
  on_time_rate: number;
  success_rate: number;
  cost_history: Record<string, number>;
  successful_deliveries: number;
  failed_deliveries: number;
  delayed_deliveries: number;
  total_deliveries: number;
}

interface OptimizationSuggestion {
  type: "cost" | "reliability" | "performance" | "warning";
  title: string;
  description: string;
  carrier?: string;
  impact: "high" | "medium" | "low";
}

const CARRIER_COLORS: Record<string, string> = {
  'FedEx': '#8a17eeff',
  'UPS': '#ebbe0aff',
  'DPD': '#D32F2F',
  'DHL': '#ff9d00ff'
};

export default function CarrierOptimization() {
  const { keycloak } = useKeycloak();
  const [carriers, setCarriers] = useState<CarrierMetrics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCarriers, setVisibleCarriers] = useState<Set<string>>(new Set());
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!keycloak || !keycloak.token || !keycloak.authenticated) {
      setLoading(true);
      return;
    }

    const fetchCarriers = async () => {
      try {
        const resp = await fetch(API_ENDPOINTS.CARRIERS, {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!resp.ok) throw new Error(`Failed to fetch carriers: ${resp.status}`);
        const data = await resp.json();
        const carriersData = Array.isArray(data) ? data : [];
        
        // Parse cost_history - backend sends it as JSON string
        const parsedCarriers = carriersData.map((carrier: any) => {
          // Parse cost_history string to object
          if (carrier.cost_history && typeof carrier.cost_history === 'string') {
            try {
              carrier.cost_history = JSON.parse(carrier.cost_history);
            } catch (e) {
              console.warn(`Failed to parse cost_history for ${carrier.name}:`, e);
              carrier.cost_history = {};
            }
          }
          
          // Ensure cost_history is an object with proper structure
          if (!carrier.cost_history || typeof carrier.cost_history !== 'object') {
            carrier.cost_history = {};
          }
          
          return carrier;
        });
        
        console.log('Carriers data:', parsedCarriers);
        console.log('First carrier cost_history:', parsedCarriers[0]?.cost_history);
        
        setCarriers(parsedCarriers);
        
        // Initialize all carriers as visible
        setVisibleCarriers(new Set(parsedCarriers.map((c: CarrierMetrics) => c.name)));
      } catch (e) {
        console.error("Carriers fetch failed:", e);
        setError(String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchCarriers();
  }, [keycloak]);

  const generateOptimizationSuggestions = (): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    if (carriers.length === 0) return suggestions;

    // Find best cost carrier
    const bestCost = carriers.reduce((min, c) => 
      c.avg_cost < min.avg_cost ? c : min
    );

    // Find most reliable carrier (highest overall rate)
    const mostReliable = carriers.reduce((max, c) => {
      const cOverallRate = calculateOverallRate(c);
      const maxOverallRate = calculateOverallRate(max);
      return cOverallRate > maxOverallRate ? c : max;
    });

    // Find carriers with poor performance (overall rate < 85%)
    const poorPerformance = carriers.filter(c => calculateOverallRate(c) < 0.85);

    // Cost optimization suggestion
    suggestions.push({
      type: "cost",
      title: "Redução de Custos",
      description: `${bestCost.name} oferece o menor custo médio (€${bestCost.avg_cost.toFixed(2)}). Considere aumentar a utilização desta transportadora para envios de baixo risco.`,
      carrier: bestCost.name,
      impact: "high"
    });

    // Reliability suggestion
    const reliableRate = calculateOverallRate(mostReliable);
    if (reliableRate > 0.90) {
      suggestions.push({
        type: "reliability",
        title: "Alta Fiabilidade",
        description: `${mostReliable.name} tem taxa global de ${(reliableRate * 100).toFixed(1)}%. Ideal para envios críticos ou de alto valor.`,
        carrier: mostReliable.name,
        impact: "medium"
      });
    }

    // Performance warnings
    poorPerformance.forEach(carrier => {
      const overallRate = calculateOverallRate(carrier);
      suggestions.push({
        type: "warning",
        title: "Desempenho Abaixo do Esperado",
        description: `${carrier.name} tem taxa global de apenas ${(overallRate * 100).toFixed(1)}%. Considere rever o contrato ou reduzir a dependência desta transportadora.`,
        carrier: carrier.name,
        impact: "high"
      });
    });

    // Cost trend analysis
    carriers.forEach(carrier => {
      if (carrier.cost_history) {
        const months = Object.keys(carrier.cost_history).sort();
        if (months.length >= 2) {
          const firstCost = carrier.cost_history[months[0]];
          const lastCost = carrier.cost_history[months[months.length - 1]];
          const increase = ((lastCost - firstCost) / firstCost) * 100;
          
          if (increase > 5) {
            suggestions.push({
              type: "cost",
              title: "Tendência de Aumento de Custos",
              description: `${carrier.name} aumentou custos em ${increase.toFixed(1)}% nos últimos 6 meses. Considere renegociar tarifas ou explorar alternativas.`,
              carrier: carrier.name,
              impact: "medium"
            });
          }
        }
      }
    });

    return suggestions;
  };

  const calculateOverallRate = (carrier: CarrierMetrics): number => {
    if (carrier.total_deliveries === 0) return 0;
    // Overall rate = (successful + delayed) / total
    // Delayed deliveries chegaram mas atrasadas, então também contam como "entregues"
    return (carrier.successful_deliveries + carrier.delayed_deliveries) / carrier.total_deliveries;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending (larger to smaller)
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortedCarriers = (): CarrierMetrics[] => {
    if (!sortColumn) return carriers;

    const sorted = [...carriers].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortColumn) {
        case 'name':
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'avg_cost':
          aValue = a.avg_cost;
          bValue = b.avg_cost;
          break;
        case 'overall_rate':
          aValue = calculateOverallRate(a);
          bValue = calculateOverallRate(b);
          break;
        case 'total_deliveries':
          aValue = a.total_deliveries;
          bValue = b.total_deliveries;
          break;
        case 'successful_deliveries':
          aValue = a.successful_deliveries;
          bValue = b.successful_deliveries;
          break;
        case 'failed_deliveries':
          aValue = a.failed_deliveries;
          bValue = b.failed_deliveries;
          break;
        case 'delayed_deliveries':
          aValue = a.delayed_deliveries;
          bValue = b.delayed_deliveries;
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <i className="bi bi-arrow-down-up ms-1 opacity-25"></i>;
    }
    return sortDirection === 'asc' 
      ? <i className="bi bi-arrow-up ms-1"></i>
      : <i className="bi bi-arrow-down ms-1"></i>;
  };

  const getImpactBadge = (impact: string) => {
    const badges = {
      high: "danger",
      medium: "warning",
      low: "info"
    };
    return `badge bg-${badges[impact as keyof typeof badges] || "secondary"}`;
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      cost: "success",
      reliability: "primary",
      performance: "info",
      warning: "danger"
    };
    return `badge bg-${badges[type as keyof typeof badges] || "secondary"}`;
  };

  const toggleCarrierVisibility = (carrierName: string) => {
    setVisibleCarriers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(carrierName)) {
        newSet.delete(carrierName);
      } else {
        newSet.add(carrierName);
      }
      return newSet;
    });
  };

  const prepareChartData = () => {
    if (carriers.length === 0) return [];
    
    // Get all unique months from all carriers
    const allMonths = new Set<string>();
    carriers.forEach(carrier => {
      if (carrier.cost_history) {
        Object.keys(carrier.cost_history).forEach(month => allMonths.add(month));
      }
    });
    
    console.log('All unique months:', Array.from(allMonths));
    
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const [monthA, yearA] = a.split('/').map(Number);
      const [monthB, yearB] = b.split('/').map(Number);
      return (yearA * 12 + monthA) - (yearB * 12 + monthB);
    });
    
    // Convert month format from "06/25" to "Junho 2025"
    const monthNames = [
      '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const chartData = sortedMonths.map(month => {
      const [monthNum, yearShort] = month.split('/').map(Number);
      const year = 2000 + yearShort;
      const monthLabel = `${monthNames[monthNum]} ${year}`;
      
      const dataPoint: Record<string, string | number> = { month: monthLabel };
      carriers.forEach(carrier => {
        if (carrier.cost_history && carrier.cost_history[month] !== undefined) {
          dataPoint[carrier.name] = carrier.cost_history[month];
        }
      });
      return dataPoint;
    });
    
    console.log('Chart data prepared:', chartData);
    return chartData;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Erro:</strong> {error}
      </div>
    );
  }

  const suggestions = generateOptimizationSuggestions();
  const chartData = prepareChartData();
  const sortedCarriers = getSortedCarriers();

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-3">
            <i className="bi bi-graph-up-arrow me-2"></i>
            Otimização Logística
          </h2>
          <p className="text-muted">
            Análise de desempenho das transportadoras e sugestões para reduzir custos e aumentar eficiência.
          </p>
        </div>
      </div>

      {/* Carrier Metrics Overview - MOVED TO FIRST */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">
                <i className="bi bi-bar-chart me-2"></i>
                Métricas Detalhadas das Transportadoras
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                    <tr>
                      <th 
                        className="ps-4 py-3" 
                        style={{ borderBottom: '2px solid #34495e', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('name')}
                      >
                        <i className="bi bi-building me-2"></i>Transportadora
                        {getSortIcon('name')}
                      </th>
                      <th 
                        className="py-3" 
                        style={{ borderBottom: '2px solid #34495e', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('avg_cost')}
                      >
                        <i className="bi bi-currency-euro me-2"></i>Custo Médio
                        {getSortIcon('avg_cost')}
                      </th>
                      <th 
                        className="py-3" 
                        style={{ borderBottom: '2px solid #34495e', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('overall_rate')}
                      >
                        <i className="bi bi-check-circle me-2"></i>Overall Rate
                        {getSortIcon('overall_rate')}
                      </th>
                      <th 
                        className="py-3" 
                        style={{ borderBottom: '2px solid #34495e', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('total_deliveries')}
                      >
                        <i className="bi bi-box-seam me-2"></i>Total
                        {getSortIcon('total_deliveries')}
                      </th>
                      <th 
                        className="py-3" 
                        style={{ borderBottom: '2px solid #34495e', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('successful_deliveries')}
                      >
                        <i className="bi bi-check2-circle me-2"></i>Sucesso
                        {getSortIcon('successful_deliveries')}
                      </th>
                      <th 
                        className="py-3" 
                        style={{ borderBottom: '2px solid #34495e', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('failed_deliveries')}
                      >
                        <i className="bi bi-x-circle me-2"></i>Falhas
                        {getSortIcon('failed_deliveries')}
                      </th>
                      <th 
                        className="pe-4 py-3" 
                        style={{ borderBottom: '2px solid #34495e', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('delayed_deliveries')}
                      >
                        <i className="bi bi-clock-history me-2"></i>Atrasos
                        {getSortIcon('delayed_deliveries')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCarriers.map((carrier, index) => {
                      const overallRate = calculateOverallRate(carrier);
                      const successPercentage = ((carrier.successful_deliveries / carrier.total_deliveries) * 100).toFixed(1);
                      const failurePercentage = ((carrier.failed_deliveries / carrier.total_deliveries) * 100).toFixed(1);
                      const delayedPercentage = ((carrier.delayed_deliveries / carrier.total_deliveries) * 100).toFixed(1);
                      
                      return (
                        <tr 
                          key={carrier.carrier_id}
                          style={{ 
                            backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                            borderLeft: `4px solid ${CARRIER_COLORS[carrier.name] || '#666'}`
                          }}
                        >
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center">
                              <div 
                                className="rounded-circle me-3"
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: CARRIER_COLORS[carrier.name] || '#666'
                                }}
                              ></div>
                              <strong style={{ fontSize: '1.05rem', color: '#2c3e50' }}>{carrier.name}</strong>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="badge" style={{ 
                              backgroundColor: '#e8f5e9', 
                              color: '#2e7d32',
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              padding: '0.5rem 0.75rem'
                            }}>
                              €{carrier.avg_cost.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <div 
                                className="progress" 
                                style={{ width: '80px', height: '8px', marginRight: '0.75rem' }}
                              >
                                <div 
                                  className="progress-bar" 
                                  role="progressbar"
                                  style={{ 
                                    width: `${overallRate * 100}%`,
                                    backgroundColor: overallRate >= 0.90 ? '#28a745' : overallRate >= 0.75 ? '#ffc107' : '#dc3545'
                                  }}
                                  aria-valuenow={overallRate * 100}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <span 
                                className="badge"
                                style={{
                                  backgroundColor: overallRate >= 0.90 ? '#d4edda' : overallRate >= 0.75 ? '#fff3cd' : '#f8d7da',
                                  color: overallRate >= 0.90 ? '#155724' : overallRate >= 0.75 ? '#856404' : '#721c24',
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  padding: '0.4rem 0.6rem'
                                }}
                              >
                                {(overallRate * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#495057' }}>
                              {carrier.total_deliveries}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-check-circle-fill text-success me-2"></i>
                              <span style={{ fontWeight: '500' }}>
                                {carrier.successful_deliveries}
                                <small className="text-muted ms-1">({successPercentage}%)</small>
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-x-circle-fill text-danger me-2"></i>
                              <span style={{ fontWeight: '500' }}>
                                {carrier.failed_deliveries}
                                <small className="text-muted ms-1">({failurePercentage}%)</small>
                              </span>
                            </div>
                          </td>
                          <td className="pe-4 py-3">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-clock-fill text-warning me-2"></i>
                              <span style={{ fontWeight: '500' }}>
                                {carrier.delayed_deliveries}
                                <small className="text-muted ms-1">({delayedPercentage}%)</small>
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Suggestions - WITH COLLAPSE BUTTON */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-lightbulb me-2"></i>
                Sugestões de Otimização ({suggestions.length})
              </h5>
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                {showSuggestions ? (
                  <>
                    <i className="bi bi-chevron-up me-1"></i>
                    Ocultar
                  </>
                ) : (
                  <>
                    <i className="bi bi-chevron-down me-1"></i>
                    Expandir
                  </>
                )}
              </button>
            </div>
            {showSuggestions && (
              <div className="card-body">
                {suggestions.length === 0 ? (
                  <p className="text-muted mb-0">Nenhuma sugestão disponível no momento.</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {suggestions.map((suggestion, idx) => (
                      <div key={idx} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              <span className={`${getTypeBadge(suggestion.type)} me-2`}>
                                {suggestion.type.toUpperCase()}
                              </span>
                              {suggestion.title}
                            </h6>
                            <p className="mb-2">{suggestion.description}</p>
                            {suggestion.carrier && (
                              <small className="text-muted">
                                <i className="bi bi-truck me-1"></i>
                                {suggestion.carrier}
                              </small>
                            )}
                          </div>
                          <span className={getImpactBadge(suggestion.impact)}>
                            {suggestion.impact}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost History Line Chart */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Histórico de Custos por Transportadora
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <p className="text-muted mb-2">Clique nas transportadoras para mostrar/ocultar:</p>
                <div className="d-flex flex-wrap gap-2">
                  {carriers.map(carrier => (
                    <button
                      key={carrier.carrier_id}
                      className={`btn btn-sm ${visibleCarriers.has(carrier.name) ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => toggleCarrierVisibility(carrier.name)}
                      style={{
                        borderColor: CARRIER_COLORS[carrier.name] || '#666',
                        backgroundColor: visibleCarriers.has(carrier.name) ? CARRIER_COLORS[carrier.name] : 'transparent',
                        color: visibleCarriers.has(carrier.name) ? 'white' : CARRIER_COLORS[carrier.name]
                      }}
                    >
                      {carrier.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    label={{ value: 'Custo (€)', angle: -90, position: 'insideLeft' }}
                    domain={[8, 16]}
                    tickFormatter={(value: number) => `€${value.toFixed(2)}`}
                  />
                  <Tooltip formatter={(value: number | string) => `€${Number(value).toFixed(2)}`} />
                  <Legend />
                  {carriers.map(carrier => (
                    visibleCarriers.has(carrier.name) && (
                      <Line
                        key={carrier.carrier_id}
                        type="monotone"
                        dataKey={carrier.name}
                        stroke={CARRIER_COLORS[carrier.name] || '#666'}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
