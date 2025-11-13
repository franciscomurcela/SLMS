import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./ConfirmDelivery.css";
import { useKeycloak } from "../context/keycloakHooks";
import { useFeatureFlags } from "../context/featureFlagsHooks";
import { API_ENDPOINTS } from "../config/api.config";

type ConfirmDeliveryProps = Record<string, never>;

interface OrderDetails {
  orderId: string;
  destinationAddress: string;
  customerName?: string;
  customerId?: string;
  orderDate: string;
  weight: number;
}

const ConfirmDelivery: React.FC<ConfirmDeliveryProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();
  const { isFeatureEnabled } = useFeatureFlags();
  const orderId = searchParams.get("orderId") || "N/A";

  // Feature flags
  const showAnomalyButton = isFeatureEnabled('driver-register-anomalies');
  const showProofOfDelivery = isFeatureEnabled('driver-pod');

  console.log("ConfirmDelivery component loaded");

  // Estados para upload de imagem e assinatura
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Estados para order details
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para anomalias
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<string>("");
  const [anomalyDescription, setAnomalyDescription] = useState<string>("");

  // Opções de anomalias
  const anomalyOptions = [
    "Destinatário ausente",
    "Indisponibilidade horária",
    "Endereço incorreto",
    "Produto danificado",
    "Acesso negado ao local",
    "Problemas de segurança",
    "Outras (especificar)",
  ];

  // Fetch order details
  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!keycloak?.token || !orderId || orderId === "N/A") {
        setLoading(false);
        return;
      }

      try {
        const shipmentsResponse = await fetch(
          `${API_ENDPOINTS.SHIPMENTS}/driver`,
          {
            headers: {
              Authorization: `Bearer ${keycloak.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!shipmentsResponse.ok) {
          throw new Error("Failed to fetch shipments");
        }

        const shipments = await shipmentsResponse.json();

        let foundOrder = null;
        for (const shipment of shipments) {
          const order = shipment.orders?.find(
            (o: any) => o.orderId === orderId
          );
          if (order) {
            foundOrder = order;
            break;
          }
        }

        if (!foundOrder) {
          throw new Error("Order not found");
        }

        setOrderDetails({
          orderId: foundOrder.orderId,
          destinationAddress: foundOrder.destinationAddress,
          customerName: foundOrder.customerName || "Cliente",
          customerId: foundOrder.customerId,
          orderDate: foundOrder.orderDate,
          weight: foundOrder.weight,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error loading order details:", err);
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [keycloak?.token, orderId]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Funções para desenhar assinatura
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL("image/png");
      setSignatureData(dataURL);
    }
  };

  // Funções para câmera
  const startCamera = async () => {
    try {
      console.log("Starting camera...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Usar câmera traseira se disponível
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      console.log("Media stream obtained:", mediaStream);
      console.log("Stream active:", mediaStream.active);
      console.log("Video tracks:", mediaStream.getVideoTracks());

      setStream(mediaStream);

      // Wait a bit for state to update
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Video element found:", videoRef.current);
          videoRef.current.srcObject = mediaStream;

          // Try to play immediately
          videoRef.current
            .play()
            .then(() => {
              console.log("Video playing successfully");
            })
            .catch((err) => {
              console.error("Error playing video:", err);
            });
        } else {
          console.error("Video ref is null");
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Erro ao acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    console.log("Capturado");
    if (!videoRef.current || !captureCanvasRef.current) {
      console.error("Video or canvas ref not available");
      return;
    }

    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Canvas context not available");
      return;
    }

    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error(
        "Video dimensions are invalid:",
        video.videoWidth,
        video.videoHeight
      );
      alert("Aguarde o vídeo carregar completamente antes de capturar.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoData = canvas.toDataURL("image/jpeg", 0.8);
    console.log("Photo captured, data length:", photoData.length);
    setCapturedPhoto(photoData);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL();
      console.log("Assinatura salva:", dataURL);
      const signatureSavedMessage = document.getElementById(
        "signature-saved-message"
      );
      if (signatureSavedMessage) {
        signatureSavedMessage.style.display = "block";
      }
    }
  };

  const handleConfirmDelivery = async () => {
    // Verificar se temos alguma prova de entrega (apenas se feature flag ativa)
    const proofData = capturedPhoto || signatureData || uploadedImage;

    if (showProofOfDelivery && !proofData) {
      alert("Por favor, forneça uma prova de entrega (foto ou assinatura)");
      return;
    }

    try {
      // Obter localização atual (opcional)
      let location;
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            });
          }
        );
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (locationError) {
        console.warn("Could not get location:", locationError);
      }

      // Preparar dados de confirmação
      const confirmationData: {
        orderId: string;
        proofType?: "photo" | "signature";
        proofData?: string;
        timestamp: string;
        location?: { latitude: number; longitude: number };
      } = {
        orderId,
        timestamp: new Date().toISOString(),
        location,
      };

      // Adicionar prova de entrega apenas se feature flag ativa e houver dados
      if (showProofOfDelivery && proofData) {
        // Determinar o tipo de prova
        let proofType: "photo" | "signature";
        if (capturedPhoto) proofType = "photo";
        else if (signatureData) proofType = "signature";
        else proofType = "photo"; // upload de arquivo também é tratado como photo

        confirmationData.proofType = proofType;
        confirmationData.proofData = proofData.split(",")[1]; // Remove data:image/... prefix
      }

      const response = await fetch(API_ENDPOINTS.CONFIRM_DELIVERY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keycloak?.token}`,
        },
        body: JSON.stringify(confirmationData),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      alert("Entrega confirmada com sucesso!");
      navigate("/driver/manifest");
    } catch (error) {
      console.error("Error confirming delivery:", error);
      alert("Erro ao confirmar entrega. Tente novamente.");
    }
  };

  const handleReportAnomaly = () => {
    setShowAnomalyModal(true);
  };

  const handleAnomalySubmit = async () => {
    if (!selectedAnomaly) {
      alert("Por favor, selecione um tipo de anomalia.");
      return;
    }

    try {
      const errorMessage = selectedAnomaly === "Outras (especificar)" ? anomalyDescription : selectedAnomaly;
      
      const token = keycloak?.token;
      const response = await fetch(API_ENDPOINTS.REPORT_ANOMALY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: orderId,
          errorMessage: errorMessage
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Anomalia registrada com sucesso: ${errorMessage}`);
        navigate("/driver/manifest");
      } else {
        console.error('Erro ao registrar anomalia:', data);
        alert(`Erro ao registrar anomalia: ${data.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao registrar anomalia:', error);
      alert('Erro ao registrar anomalia. Tente novamente.');
    }
  };

  const handleCloseAnomalyModal = () => {
    setShowAnomalyModal(false);
    setSelectedAnomaly("");
    setAnomalyDescription("");
  };

  useEffect(() => {
    // Configurar o canvas para desenho
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
      }
    }
  }, []);

  // Effect to handle video stream assignment
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log("Assigning stream to video element in useEffect");
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .then(() => {
          console.log("Video started playing");
        })
        .catch((err) => {
          console.error("Failed to play video in useEffect:", err);
        });
    }
  }, [stream]);

  // Cleanup da câmera quando componente for desmontado
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Função cleanup da câmera (deve ser definida antes do useEffect)
  useEffect(() => {
    const cleanup = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    return cleanup;
  }, [stream]);

  if (loading) {
    console.log("ConfirmDelivery: Showing loading state");
    return (
      <>
        <Header role="Driver" href="/confirm-delivery" />
        <div className="container mt-4 mb-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <h4 style={{ marginTop: "20px" }}>
              Carregando detalhes da entrega...
            </h4>
          </div>
        </div>
      </>
    );
  }

  if (!orderDetails) {
    console.log("ConfirmDelivery: No order details found");
    return (
      <>
        <Header role="Driver" href="/confirm-delivery" />
        <div className="container mt-4 mb-5">
          <div className="alert alert-warning" role="alert">
            <h4>Encomenda não encontrada</h4>
            <p>ID: {orderId}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/driver/manifest")}
          >
            Voltar ao Manifesto
          </button>
        </div>
      </>
    );
  }

  console.log("ConfirmDelivery: Rendering main component");
  console.log("Stream state before render:", stream);
  console.log("VideoRef current before render:", videoRef.current);

  return (
    <>
      <Header role="Driver" href="/confirm-delivery" />
      <div className="container mt-4 mb-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            {/* Título e Botão de Anomalias */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg px-4 py-3"
                  onClick={() => navigate(`/driver-route/${orderId}`)}
                  style={{ fontSize: "1.1rem", fontWeight: "bold" }}
                >
                  <i
                    className="bi bi-arrow-left me-2"
                    style={{ fontSize: "1.3rem" }}
                  ></i>
                  Voltar à Rota
                </button>
              </div>
              <div className="text-center flex-grow-1">
                <h2 className="display-6 fw-bold text-primary">
                  Confirmar Entrega
                </h2>
                <h4 className="text-muted">ID: {orderId}</h4>
              </div>
              {showAnomalyButton && (
                <div>
                  <button
                    type="button"
                    className="btn btn-warning btn-lg px-4 py-3"
                    onClick={handleReportAnomaly}
                    style={{ fontSize: "1.1rem", fontWeight: "bold" }}
                  >
                    <i
                      className="bi bi-exclamation-triangle-fill me-2"
                      style={{ fontSize: "1.3rem" }}
                    ></i>
                    Registrar Anomalia
                  </button>
                </div>
              )}
            </div>

            {/* Informações do destinatário e endereço combinadas */}
            <div className="card mb-4 shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0" style={{ fontSize: "1.5rem" }}>
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Informações do Destinatário e Entrega
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p
                      className="mb-2"
                      style={{ fontSize: "1.2rem", fontWeight: "bold" }}
                    >
                      <i className="bi bi-person-badge me-2 text-primary"></i>
                      <strong>Nome:</strong>{" "}
                      {orderDetails.customerName || "N/A"}
                    </p>
                    <p
                      className="mb-2"
                      style={{ fontSize: "1.2rem", fontWeight: "bold" }}
                    >
                      <i className="bi bi-calendar-fill me-2 text-primary"></i>
                      <strong>Data:</strong>{" "}
                      {new Date(orderDetails.orderDate).toLocaleDateString(
                        "pt-PT"
                      )}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p
                      className="mb-2"
                      style={{ fontSize: "1.2rem", fontWeight: "bold" }}
                    >
                      <i className="bi bi-house-fill me-2 text-success"></i>
                      <strong>Endereço:</strong>{" "}
                      {orderDetails.destinationAddress}
                    </p>
                    <p
                      className="mb-0"
                      style={{ fontSize: "1.2rem", fontWeight: "bold" }}
                    >
                      <i className="bi bi-box-seam me-2 text-success"></i>
                      <strong>Peso:</strong> {orderDetails.weight} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco de Prova de Entrega */}
            {showProofOfDelivery && (
              <div className="card mb-4 shadow-sm">
                <div className="card-header bg-secondary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-clipboard-check me-2"></i>
                    Prova de Entrega
                  </h5>
                </div>
              <div className="card-body">
                <p className="text-muted text-center mb-4">
                  Carregar uma foto ou assinatura do destinatário.
                </p>

                <div className="row">
                  {/* Área de Upload de Foto */}
                  <div className="col-md-6">
                    <div className="card mb-4 shadow-sm">
                      <div className="card-header bg-info text-white">
                        <h5 className="mb-0">
                          <i className="bi bi-camera-fill me-2"></i>
                          Prova Fotográfica da Entrega
                        </h5>
                      </div>
                      <div className="card-body text-center">
                        <div className="mb-3">
                          <label htmlFor="imageUpload" className="form-label">
                            <i className="bi bi-image me-2 text-info"></i>
                            Carregar foto da entrega:
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            id="imageUpload"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </div>

                        {/* Botão para capturar com câmera */}
                        <div className="mb-3">
                          <button
                            type="button"
                            className="btn btn-success me-2"
                            onClick={() => {
                              console.log("Button clicked!");
                              console.log("Stream state:", stream);
                              console.log(
                                "CapturedPhoto state:",
                                capturedPhoto
                              );
                              startCamera();
                            }}
                            disabled={stream !== null || capturedPhoto !== null}
                          >
                            <i className="bi bi-camera me-2"></i>
                            Usar Câmera
                          </button>
                        </div>

                        {/* Interface da câmera */}
                        {stream && !capturedPhoto && (
                          <div className="mt-3">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="img-thumbnail mb-2"
                              style={{ width: "100%", maxWidth: "300px" }}
                            />
                            <div>
                              <button
                                type="button"
                                className="btn btn-primary me-2"
                                onClick={capturePhoto}
                              >
                                <i className="bi bi-camera-fill me-2"></i>
                                Capturar
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={stopCamera}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Foto capturada */}
                        {capturedPhoto && (
                          <div className="mt-3">
                            <div className="alert alert-success" role="alert">
                              <i className="bi bi-check-circle-fill me-2"></i>
                              <strong>Foto capturada com sucesso</strong>
                            </div>
                            <img
                              src={capturedPhoto}
                              alt="Foto capturada"
                              className="img-thumbnail"
                              style={{ maxWidth: "300px", maxHeight: "200px" }}
                            />
                            <div className="mt-2">
                              <button
                                type="button"
                                className="btn btn-warning"
                                onClick={retakePhoto}
                              >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Tirar Nova Foto
                              </button>
                            </div>
                          </div>
                        )}

                        {uploadedImage ? (
                          <div className="mt-3">
                            <div className="alert alert-success" role="alert">
                              <i className="bi bi-check-circle-fill me-2"></i>
                              <strong>Prova carregada</strong>
                            </div>
                            <img
                              src={uploadedImage}
                              alt="Prova de entrega"
                              className="img-thumbnail"
                              style={{ maxWidth: "300px", maxHeight: "200px" }}
                            />
                          </div>
                        ) : (
                          <div
                            className="border border-2 border-dashed rounded p-4 bg-light"
                            onClick={() =>
                              document.getElementById("imageUpload")?.click()
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <i className="bi bi-cloud-upload display-4 text-info"></i>
                            <p className="text-muted mt-2">
                              <i className="bi bi-hand-index me-1"></i>
                              Clique aqui para carregar uma imagem
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Área de Assinatura */}
                  <div className="col-md-6">
                    <div className="card mb-4 shadow-sm">
                      <div className="card-header bg-warning text-dark">
                        <h5 className="mb-0">
                          <i className="bi bi-pencil-fill me-2"></i>
                          Assinatura do Destinatário
                        </h5>
                      </div>
                      <div className="card-body text-center">
                        <p className="text-muted mb-3">
                          <i className="bi bi-person-check me-2 text-warning"></i>
                          Solicite ao destinatário que assine na área abaixo:
                        </p>

                        <div className="signature-container mb-3">
                          <canvas
                            ref={canvasRef}
                            width={500}
                            height={200}
                            className="border border-2 rounded bg-white"
                            style={{
                              cursor: "crosshair",
                              maxWidth: "100%",
                              height: "auto",
                            }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                          />
                        </div>

                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={clearSignature}
                          >
                            <i className="bi bi-eraser-fill me-1"></i>
                            Limpar
                          </button>
                          <button
                            type="button"
                            className="btn btn-warning"
                            onClick={saveSignature}
                          >
                            <i className="bi bi-check-square-fill me-1"></i>
                            Gravar Assinatura
                          </button>
                        </div>

                        <div
                          id="signature-saved-message"
                          className="alert alert-success mt-3"
                          style={{ display: "none" }}
                        >
                          <i className="bi bi-check-circle-fill me-2"></i>
                          <strong>Assinatura gravada</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Botão de Confirmação */}
            <div className="text-center">
              <button
                type="button"
                className="btn btn-success btn-lg px-5 py-3"
                onClick={handleConfirmDelivery}
              >
                <i className="bi bi-check-circle-fill me-2"></i>
                Confirmar Entrega
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Anomalias */}
      {showAnomalyModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Registrar Anomalia
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseAnomalyModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="anomalySelect" className="form-label">
                    Tipo de Anomalia:
                  </label>
                  <select
                    className="form-select"
                    id="anomalySelect"
                    value={selectedAnomaly}
                    onChange={(e) => setSelectedAnomaly(e.target.value)}
                  >
                    <option value="">Selecione uma anomalia...</option>
                    {anomalyOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAnomaly === "Outras (especificar)" && (
                  <div className="mb-3">
                    <label htmlFor="anomalyDescription" className="form-label">
                      Descrição da Anomalia:
                    </label>
                    <textarea
                      className="form-control"
                      id="anomalyDescription"
                      rows={3}
                      value={anomalyDescription}
                      onChange={(e) => setAnomalyDescription(e.target.value)}
                      placeholder="Descreva a anomalia encontrada..."
                    />
                  </div>
                )}

                <div className="alert alert-info">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  <strong>Nota:</strong> Ao registrar uma anomalia, a entrega
                  não será confirmada e você retornará ao manifesto de carga.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseAnomalyModal}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleAnomalySubmit}
                >
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Registrar Anomalia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas oculto para captura de foto */}
      <canvas ref={captureCanvasRef} style={{ display: "none" }} />
    </>
  );
};

export default ConfirmDelivery;
