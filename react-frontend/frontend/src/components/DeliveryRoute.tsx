import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface OrderDetails {
  orderId: string;
  destinationAddress: string;
  customerName?: string;
  customerId?: string;
  orderDate: string;
  weight: number;
}

interface RouteInfo {
  distance: string;
  duration: string;
  remainingDistance?: string;
  remainingTime?: string;
}

interface NavigationStep {
  instruction: string;
  distance: string;
  maneuver?: string;
  location: google.maps.LatLng;
}

// Função auxiliar para obter ícone de manobra
const getManeuverIcon = (maneuver?: string): string => {
  const icons: Record<string, string> = {
    'turn-left': '⬅️',
    'turn-right': '➡️',
    'turn-slight-left': '↖️',
    'turn-slight-right': '↗️',
    'turn-sharp-left': '⬅️',
    'turn-sharp-right': '➡️',
    'uturn-left': '↩️',
    'uturn-right': '↪️',
    'merge': '🔀',
    'fork-left': '↖️',
    'fork-right': '↗️',
    'roundabout-left': '🔄',
    'roundabout-right': '🔄',
    'ramp-left': '↖️',
    'ramp-right': '↗️',
    'straight': '⬆️',
    'keep-left': '⬅️',
    'keep-right': '➡️',
  };
  return icons[maneuver || ''] || '🧭';
};

const DeliveryRoute: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const currentMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const markerContentRef = useRef<HTMLElement | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const mapInitializedRef = useRef<boolean>(false); // Flag para evitar múltiplas inicializações
  const prevPositionRef = useRef<google.maps.LatLngLiteral | null>(null);
  const lastRouteTimeRef = useRef<number>(0);
  const lastRoutePositionRef = useRef<google.maps.LatLngLiteral | null>(null);
  const navigationStartedRef = useRef<boolean>(false);
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [currentPosition, setCurrentPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navigationActive, setNavigationActive] = useState(false); // Controla se navegação está ativa

  useEffect(() => {
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    if (window.google && window.google.maps) {
      console.log('Google Maps já está carregado');
      setMapLoaded(true);
      return;
    }

    if (existingScript) {
      console.log('Script do Google Maps já existe, aguardando carregamento...');
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          setMapLoaded(true);
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }

    console.log('Carregando Google Maps pela primeira vez...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps carregado com sucesso');
      setMapLoaded(true);
    };
    script.onerror = () => {
      console.error('Erro ao carregar Google Maps');
      setError('Erro ao carregar Google Maps. Verifique a API key e o billing.');
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!keycloak?.token || !orderId) return;

      try {
        setLoading(true);
        const keycloakId = keycloak.tokenParsed?.sub;

        const shipmentsResponse = await fetch(
          `http://localhost:8081/api/shipments/my-shipments/${keycloakId}`,
          {
            headers: {
              'Authorization': `Bearer ${keycloak.token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!shipmentsResponse.ok) {
          throw new Error('Erro ao carregar encomendas');
        }

        const shipments = await shipmentsResponse.json();

        let foundOrder = null;
        for (const shipment of shipments) {
          const order = shipment.orders?.find((o: any) => o.orderId === orderId);
          if (order) {
            foundOrder = order;
            break;
          }
        }

        if (!foundOrder) {
          throw new Error('Encomenda não encontrada');
        }

        setOrderDetails({
          orderId: foundOrder.orderId,
          destinationAddress: foundOrder.destinationAddress,
          customerName: 'Cliente',
          customerId: foundOrder.customerId,
          orderDate: foundOrder.orderDate,
          weight: foundOrder.weight,
        });
        setLoading(false);

      } catch (err) {
        console.error('Error loading order details:', err);
        setError('Erro ao carregar detalhes da encomenda');
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [keycloak?.token, orderId]);

  useEffect(() => {
    console.log('🗺️ useEffect do mapa executado:', {
      mapLoaded,
      orderDetails: !!orderDetails,
      mapRefCurrent: !!mapRef.current,
      mapInstanceRef: !!mapInstanceRef.current,
      mapInitialized: mapInitializedRef.current
    });

    if (!mapLoaded || !orderDetails || !mapRef.current || mapInstanceRef.current || mapInitializedRef.current) {
      console.log('🚫 Condições não atendidas para inicializar mapa');
      return;
    }

    // Marcar como inicializado para evitar múltiplas execuções
    mapInitializedRef.current = true;
    console.log('✅ Iniciando inicialização do mapa...');

    const initializeMap = async () => {
      try {
        let currentPos: google.maps.LatLngLiteral;

        try {
          console.log('Obtendo localização GPS...');
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: 60000
              }
            );
          });

          currentPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('Localização GPS obtida:', currentPos);
        } catch (gpsError) {
          console.warn('GPS não disponível, usando localização padrão (Aveiro)');
          currentPos = {
            lat: 40.6333,
            lng: -8.6667,
          };
        }

        setCurrentPosition(currentPos);

        console.log('🗺️ Criando instância do Google Maps...');
        const map = new google.maps.Map(mapRef.current!, {
          zoom: 14,
          center: currentPos,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER,
          },
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          mapId: 'DELIVERY_MAP',
        });

        mapInstanceRef.current = map;

        const markerIcon = document.createElement('div');
        markerIcon.innerHTML = `
          <div style="
            width: 20px;
            height: 20px;
            background-color: #4285F4;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        `;
        // badge para exibir a manobra seguinte (emoji)
        const maneuverBadge = document.createElement('div');
        maneuverBadge.style.position = 'absolute';
        maneuverBadge.style.top = '-10px';
        maneuverBadge.style.right = '-10px';
        maneuverBadge.style.width = '28px';
        maneuverBadge.style.height = '28px';
        maneuverBadge.style.borderRadius = '50%';
        maneuverBadge.style.background = 'white';
        maneuverBadge.style.display = 'flex';
        maneuverBadge.style.alignItems = 'center';
        maneuverBadge.style.justifyContent = 'center';
        maneuverBadge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        maneuverBadge.style.fontSize = '14px';

        // envolver o markerIcon para posicionar badge
        const markerWrapper = document.createElement('div');
        markerWrapper.style.position = 'relative';
        markerWrapper.appendChild(markerIcon.firstElementChild!);
        markerWrapper.appendChild(maneuverBadge);

        // armazenar referência para atualizações posteriores
        markerContentRef.current = markerWrapper;

        const currentMarker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: currentPos,
          title: 'Sua Localização',
          content: markerContentRef.current!,
        });

        currentMarkerRef.current = currentMarker;

        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#4285F4',
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });

        directionsRendererRef.current = directionsRenderer;

        const directionsService = new google.maps.DirectionsService();

        directionsService.route(
          {
            origin: currentPos,
            destination: orderDetails.destinationAddress,
            travelMode: google.maps.TravelMode.DRIVING,
            drivingOptions: {
              departureTime: new Date(),
              trafficModel: google.maps.TrafficModel.BEST_GUESS,
            },
            provideRouteAlternatives: false,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              directionsRenderer.setDirections(result);

              const route = result.routes[0];
              const leg = route.legs[0];

              // Extrair passos de navegação (turn-by-turn)
              const steps: NavigationStep[] = leg.steps.map(step => ({
                instruction: step.instructions,
                distance: step.distance?.text || '',
                maneuver: step.maneuver,
                location: step.start_location
              }));

              setNavigationSteps(steps);
              console.log('🧭 Passos de navegação:', steps);

              setRouteInfo({
                distance: leg.distance?.text || 'N/A',
                duration: leg.duration?.text || 'N/A',
                remainingDistance: leg.distance?.text,
                remainingTime: leg.duration?.text,
              });
            } else {
              console.error('Erro ao calcular rota:', status);
              setError('Não foi possível calcular a rota. Verifique se as APIs estão ativadas.');
            }
          }
        );

        // Mapa inicializado - rota estática mostrada
        // GPS dinâmico será ativado quando utilizador clicar em "Iniciar Navegação"

      } catch (err) {
        console.error('Erro ao inicializar mapa:', err);
        setError('Não foi possível carregar o mapa. Verifique se as APIs estão ativadas.');
      }
    };

    initializeMap();

    return () => {
      // Reset da flag para permitir reinicialização se necessário
      mapInitializedRef.current = false;
    };
  }, [mapLoaded, orderDetails]);

  // UseEffect separado para navegação dinâmica (GPS ativo)
  useEffect(() => {
    if (!navigationActive || !mapInstanceRef.current || !currentMarkerRef.current || !directionsRendererRef.current || !orderDetails) {
      return;
    }

    // Evitar múltiplas execuções
    if (navigationStartedRef.current) {
      console.log('⚠️ Navegação já está ativa, ignorando nova execução');
      return;
    }

    navigationStartedRef.current = true;
    console.log('🚀 Iniciando navegação GPS dinâmica...');

    const map = mapInstanceRef.current;
    const currentMarker = currentMarkerRef.current;
    const directionsRenderer = directionsRendererRef.current;
    const directionsService = new google.maps.DirectionsService();

    // Helpers locais
    const toRad = (v: number) => v * Math.PI / 180;
    const distanceMeters = (a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) => {
      const R = 6371000; // metres
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const sinDLat = Math.sin(dLat/2);
      const sinDLon = Math.sin(dLon/2);
      const aHarv = sinDLat*sinDLat + sinDLon*sinDLon * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1-aHarv));
      return R * c;
    };

    const computeHeading = (from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral) => {
      const y = Math.sin((to.lng - from.lng) * Math.PI/180) * Math.cos(to.lat * Math.PI/180);
      const x = Math.cos(from.lat * Math.PI/180) * Math.sin(to.lat * Math.PI/180) -
        Math.sin(from.lat * Math.PI/180) * Math.cos(to.lat * Math.PI/180) * Math.cos((to.lng - from.lng) * Math.PI/180);
      const brng = Math.atan2(y, x) * 180 / Math.PI;
      return (brng + 360) % 360;
    };

    const updateMarkerVisual = (prevPos: google.maps.LatLngLiteral | null, newPos: google.maps.LatLngLiteral, upcomingManeuver?: string) => {
      try {
        if (!markerContentRef.current) return;
        // rotacionar conforme heading
        if (prevPos) {
          const heading = computeHeading(prevPos, newPos);
          const markerDiv = markerContentRef.current.querySelector('div:first-child') as HTMLElement | null;
          if (markerDiv) {
            markerDiv.style.transform = `rotate(${heading}deg)`;
          }
        }
        // atualizar badge de manobra
        const badge = markerContentRef.current.querySelector('div:nth-child(2)') as HTMLElement | null;
        if (badge) {
          badge.innerText = getManeuverIcon(upcomingManeuver);
        }
      } catch (e) {
        console.warn('Erro ao atualizar visual do marcador:', e);
      }
    };

    const shouldRecalculateRoute = (newPos: google.maps.LatLngLiteral) => {
      const now = Date.now();
      const lastTime = lastRouteTimeRef.current || 0;
      if (now - lastTime < 4000) return false; // no mínimo 4s entre requisições
      const lastPos = lastRoutePositionRef.current;
      if (!lastPos) return true;
      const moved = distanceMeters(lastPos, newPos);
      return moved > 15; // recalc se mover mais de 15m
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        console.log('📍 Nova posição GPS:', newPos);
        setCurrentPosition(newPos);
        currentMarker.position = newPos;
        map.panTo(newPos);

        // Atualizar visual do marcador (heading e badge)
        const currentSteps = navigationSteps;
        const currentIdx = currentStepIndex;
        updateMarkerVisual(prevPositionRef.current, newPos, currentSteps[currentIdx + 1]?.maneuver);

        // Decide se recalcular rota (rate limiting + distância mínima)
        if (!shouldRecalculateRoute(newPos)) {
          prevPositionRef.current = newPos;
          return;
        }

        console.log('🔄 Recalculando rota...');
        lastRouteTimeRef.current = Date.now();
        lastRoutePositionRef.current = newPos;

        directionsService.route(
          {
            origin: newPos,
            destination: orderDetails.destinationAddress,
            travelMode: google.maps.TravelMode.DRIVING,
            drivingOptions: {
              departureTime: new Date(),
              trafficModel: google.maps.TrafficModel.BEST_GUESS,
            },
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              directionsRenderer.setDirections(result);
              const leg = result.routes[0].legs[0];

              // Atualizar passos de navegação
              const updatedSteps: NavigationStep[] = leg.steps.map(step => ({
                instruction: step.instructions,
                distance: step.distance?.text || '',
                maneuver: step.maneuver,
                location: step.start_location
              }));
              setNavigationSteps(updatedSteps);

              // Calcular qual passo atual baseado na distância
              let closestStepIndex = 0;
              let minDistance = Infinity;
              updatedSteps.forEach((step, index) => {
                const stepLat = step.location.lat();
                const stepLng = step.location.lng();
                const distance = Math.sqrt(
                  Math.pow(stepLat - newPos.lat, 2) + 
                  Math.pow(stepLng - newPos.lng, 2)
                );
                if (distance < minDistance) {
                  minDistance = distance;
                  closestStepIndex = index;
                }
              });

              setCurrentStepIndex(closestStepIndex);

              // Atualiza badge com a próxima manobra
              const upcoming = updatedSteps[closestStepIndex + 1]?.maneuver;
              if (markerContentRef.current) {
                const badge = markerContentRef.current.querySelector('div:nth-child(2)') as HTMLElement | null;
                if (badge) badge.innerText = getManeuverIcon(upcoming);
              }

              setRouteInfo(prev => ({
                ...prev!,
                remainingDistance: leg.distance?.text || 'N/A',
                remainingTime: leg.duration?.text || 'N/A',
              }));

              console.log('✅ Rota recalculada, passo atual:', closestStepIndex);
            } else {
              console.error('❌ Erro ao recalcular rota:', status);
            }
          }
        );

        prevPositionRef.current = newPos;
      },
      (error) => {
        console.error('❌ Erro GPS contínuo:', error);
        alert(`Erro GPS: ${error.message}. Código: ${error.code}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 3000,
      }
    );

    watchIdRef.current = watchId;
    console.log('✅ WatchPosition iniciado, ID:', watchId);

    return () => {
      console.log('🛑 Limpando watchPosition...');
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      navigationStartedRef.current = false;
    };
  }, [navigationActive, orderDetails]);

  const handleStartNavigation = () => {
    setNavigationActive(true);
  };

  const handleStopNavigation = () => {
    setNavigationActive(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <h4 style={{ marginTop: '20px' }}>Carregando rota de entrega...</h4>
      </div>
    );
  }

  if (error) {
    const isBillingError = error.includes('Google Maps') || error.includes('billing') || error.includes('APIs');
    
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div className={`alert ${isBillingError ? 'alert-warning' : 'alert-danger'}`} role="alert">
          <h4 className="alert-heading">
            <i className="bi bi-exclamation-triangle-fill"></i> {isBillingError ? 'Configuração Necessária' : 'Erro'}
          </h4>
          <p>{error}</p>
          
          {isBillingError && (
            <div className="mt-4">
              <h5>Para resolver:</h5>
              <ol className="text-start">
                <li>Acesse <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className="alert-link">Google Cloud APIs</a></li>
                <li>Ative as APIs necessárias:
                  <ul>
                    <li><strong>Maps JavaScript API</strong></li>
                    <li><strong>Directions API</strong></li>
                    <li><strong>Geocoding API</strong></li>
                  </ul>
                </li>
                <li>Aguarde 2-5 minutos e recarregue a página</li>
              </ol>
              <div className="alert alert-info mt-3">
                <i className="bi bi-info-circle"></i> <strong>Billing já está ativo!</strong> Só falta ativar as APIs individuais.
                <br/>Consulte <code>ATIVAR_APIS.md</code> para instruções detalhadas.
              </div>
            </div>
          )}
        </div>
        
        <div className="d-flex gap-2 justify-content-center mt-3">
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i> Voltar ao Manifesto
          </button>
          {orderDetails && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderDetails.destinationAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success"
            >
              <i className="bi bi-map"></i> Abrir no Google Maps (alternativa)
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="alert alert-warning" role="alert">
          <h4>Encomenda não encontrada</h4>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          Voltar
        </button>
      </div>
    );
  }

  const googleMapsUrl = currentPosition
    ? `https://www.google.com/maps/dir/?api=1&origin=${currentPosition.lat},${currentPosition.lng}&destination=${encodeURIComponent(orderDetails.destinationAddress)}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderDetails.destinationAddress)}`;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        backgroundColor: '#1a73e8',
        color: 'white',
        padding: '12px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn btn-light btn-sm"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left"></i> Voltar
          </button>
          <h5 style={{ margin: 0, fontWeight: '500' }}>
            <i className="bi bi-navigation"></i> Navegação GPS
          </h5>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-light btn-sm"
          >
            <i className="bi bi-box-arrow-up-right"></i>
          </a>
        </div>
      </div>

      {routeInfo && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '12px 20px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-around',
          gap: '10px'
        }}>
          <div className="text-center">
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1a73e8' }}>
              {routeInfo.remainingDistance || routeInfo.distance}
            </div>
            <small className="text-muted">Distância</small>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1a73e8' }}>
              {routeInfo.remainingTime || routeInfo.duration}
            </div>
            <small className="text-muted">Tempo</small>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#34a853' }}>
              {orderDetails.weight} kg
            </div>
            <small className="text-muted">Peso</small>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        padding: '10px 20px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <div style={{ fontSize: '0.9rem' }}>
          <strong>Destino:</strong> {orderDetails.destinationAddress}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>
          Encomenda #{orderDetails.orderId.substring(0, 8)}...
        </div>
      </div>

      {/* Botão de Iniciar/Parar Navegação */}
      {!navigationActive ? (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px 20px',
          borderBottom: '2px solid #e0e0e0',
          textAlign: 'center'
        }}>
          <button
            className="btn btn-success btn-lg"
            onClick={handleStartNavigation}
            style={{
              width: '100%',
              maxWidth: '400px',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              padding: '16px'
            }}
          >
            <i className="bi bi-play-circle-fill"></i> Iniciar Navegação GPS
          </button>
          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#666' }}>
            A navegação dinâmica será ativada e acompanhará sua localização em tempo real
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#d4edda',
          padding: '12px 20px',
          borderBottom: '2px solid #c3e6cb',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="spinner-border spinner-border-sm text-success" role="status">
              <span className="visually-hidden">Navegando...</span>
            </div>
            <strong style={{ color: '#155724' }}>
              <i className="bi bi-geo-alt-fill"></i> Navegação Ativa
            </strong>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleStopNavigation}
          >
            <i className="bi bi-stop-circle"></i> Parar
          </button>
        </div>
      )}

      {/* Painel de Navegação Turn-by-Turn */}
      {navigationActive && navigationSteps.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          maxHeight: '200px',
          overflowY: 'auto',
          borderBottom: '2px solid #e0e0e0'
        }}>
          {/* Instrução atual destacada */}
          {navigationSteps[currentStepIndex] && (
            <div style={{
              backgroundColor: '#1a73e8',
              color: 'white',
              padding: '16px 20px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '2rem' }}>
                {getManeuverIcon(navigationSteps[currentStepIndex].maneuver)}
              </span>
              <div style={{ flex: 1 }}>
                <div dangerouslySetInnerHTML={{ __html: navigationSteps[currentStepIndex].instruction }} />
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>
                  {navigationSteps[currentStepIndex].distance}
                </div>
              </div>
            </div>
          )}

          {/* Próximas instruções */}
          <div style={{ padding: '10px 0' }}>
            {navigationSteps.slice(currentStepIndex + 1, currentStepIndex + 4).map((step, index) => (
              <div
                key={index}
                style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.9rem'
                }}
              >
                <span style={{ fontSize: '1.5rem', opacity: 0.7 }}>
                  {getManeuverIcon(step.maneuver)}
                </span>
                <div style={{ flex: 1 }}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: step.instruction }}
                    style={{ color: '#666' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '2px' }}>
                    {step.distance}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#f0f0f0',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: '#666'
                }}>
                  {index + 2}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        style={{
          flex: 1,
          width: '100%',
          position: 'relative'
        }}
      />

      {!mapLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3 mb-0">Carregando mapa...</p>
        </div>
      )}
    </div>
  );
};

export default DeliveryRoute;
