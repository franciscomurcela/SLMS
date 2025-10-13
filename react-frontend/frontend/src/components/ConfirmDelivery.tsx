import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./ConfirmDelivery.css";

interface ConfirmDeliveryProps {}

const ConfirmDelivery: React.FC<ConfirmDeliveryProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId") || "N/A";
  
  // Estados para upload de imagem e assinatura
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    "Outras (especificar)"
  ];

  // Dados mock do destinatário - em produção viriam do backend
  const recipientData = {
    name: "João Silva",
    phone: "+351 912 345 678",
    street: "Rua das Flores, 123",
    postalCode: "3800-123 Aveiro"
  };

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
      const signatureSavedMessage = document.getElementById("signature-saved-message");
      if (signatureSavedMessage) {
        signatureSavedMessage.style.display = "block";
      }
    }
  };

  const handleConfirmDelivery = () => {
    // Aqui seria implementada a lógica para confirmar a entrega
    alert("Entrega confirmada com sucesso!");
    navigate("/driver/manifest");
  };

  const handleReportAnomaly = () => {
    setShowAnomalyModal(true);
  };

  const handleAnomalySubmit = () => {
    if (selectedAnomaly) {
      // Aqui seria implementada a lógica para registrar a anomalia
      console.log("Anomalia registrada:", selectedAnomaly, anomalyDescription);
      alert(`Anomalia registrada: ${selectedAnomaly}`);
      navigate("/driver/manifest");
    } else {
      alert("Por favor, selecione um tipo de anomalia.");
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

  return (
    <>
      <Header role="Driver" href="/confirm-delivery" />
      <div className="container mt-4 mb-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            {/* Título e Botão de Anomalias */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="text-center flex-grow-1">
                <h2 className="display-6 fw-bold text-primary">
                  Confirmar Entrega
                </h2>
                <h4 className="text-muted">ID: {orderId}</h4>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-warning btn-lg px-4 py-3"
                  onClick={handleReportAnomaly}
                  style={{ fontSize: "1.1rem", fontWeight: "bold" }}
                >
                  <i className="bi bi-exclamation-triangle-fill me-2" style={{ fontSize: "1.3rem" }}></i>
                  Registrar Anomalia
                </button>
              </div>
            </div>

            {/* Informações do destinatário e endereço */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card h-100 shadow-sm">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-person-fill me-2"></i>
                      Informações do Destinatário
                    </h5>
                  </div>
                  <div className="card-body">
                    <p className="mb-2">
                      <i className="bi bi-person-badge me-2 text-primary"></i>
                      <strong>Nome:</strong> {recipientData.name}
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-telephone-fill me-2 text-primary"></i>
                      <strong>Telefone:</strong> {recipientData.phone}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card h-100 shadow-sm">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-geo-alt-fill me-2"></i>
                      Endereço de Entrega
                    </h5>
                  </div>
                  <div className="card-body">
                    <p className="mb-2">
                      <i className="bi bi-house-fill me-2 text-success"></i>
                      <strong>Rua:</strong> {recipientData.street}
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-mailbox me-2 text-success"></i>
                      <strong>Código Postal:</strong> {recipientData.postalCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco de Prova de Entrega */}
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
                            onClick={() => document.getElementById("imageUpload")?.click()}
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
                              height: "auto"
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
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
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
                  <strong>Nota:</strong> Ao registrar uma anomalia, a entrega não será confirmada e você retornará ao manifesto de carga.
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
    </>
  );
};

export default ConfirmDelivery;
