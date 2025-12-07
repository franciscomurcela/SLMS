import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Carrier {
  carrier_id: string;
  name: string;
  avg_cost: number;
  on_time_rate: number;
  success_rate: number;
}

interface ReportGeneratorProps {
  carriers: Carrier[];
}

export default function ReportGenerator({ carriers }: ReportGeneratorProps) {
  const [showModal, setShowModal] = useState(false);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Cores profissionais
    const primaryColor: [number, number, number] = [41, 128, 185]; // Azul
    const secondaryColor: [number, number, number] = [52, 73, 94]; // Cinza escuro
    const accentColor: [number, number, number] = [46, 204, 113]; // Verde
    const warningColor: [number, number, number] = [230, 126, 34]; // Laranja
    const dangerColor: [number, number, number] = [231, 76, 60]; // Vermelho
    
    // Calcular métricas avançadas
    const avgCost = carriers.reduce((sum, c) => sum + c.avg_cost, 0) / carriers.length;
    const avgOnTime = carriers.reduce((sum, c) => sum + c.on_time_rate, 0) / carriers.length;
    const avgSuccess = carriers.reduce((sum, c) => sum + c.success_rate, 0) / carriers.length;
    
    // Identificar best e worst performers
    const bestCost = carriers.reduce((min, c) => c.avg_cost < min.avg_cost ? c : min);
    const worstCost = carriers.reduce((max, c) => c.avg_cost > max.avg_cost ? c : max);
    const bestReliability = carriers.reduce((max, c) => 
      (c.on_time_rate + c.success_rate) > (max.on_time_rate + max.success_rate) ? c : max
    );
    
    // Calcular variação de custos
    const costVariance = Math.sqrt(
      carriers.reduce((sum, c) => sum + Math.pow(c.avg_cost - avgCost, 2), 0) / carriers.length
    );
    
    // Calcular índice de qualidade composto (0-100)
    const qualityIndex = carriers.map(c => ({
      name: c.name,
      index: ((c.on_time_rate * 0.5 + c.success_rate * 0.5) * 100)
    })).sort((a, b) => b.index - a.index);
    
    // ============ PÁGINA 1: CAPA ============
    // Cabeçalho com cor
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE', 105, 20, { align: 'center' });
    doc.text('PERFORMANCE LOGÍSTICA', 105, 35, { align: 'center' });
    
    // Linha decorativa
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(2);
    doc.line(40, 55, 170, 55);
    
    // Informações gerais
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })}`, 105, 75, { align: 'center' });
    doc.text(`Período de Análise: Últimos 6 meses`, 105, 85, { align: 'center' });
    
    // Box com resumo executivo
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(30, 110, 150, 80, 3, 3, 'F');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('Resumo Executivo', 105, 125, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Transportadoras Analisadas: ${carriers.length}`, 40, 140);
    doc.text(`Custo Médio Global: €${avgCost.toFixed(2)}`, 40, 150);
    doc.text(`Taxa de Pontualidade Média: ${(avgOnTime * 100).toFixed(1)}%`, 40, 160);
    doc.text(`Taxa de Sucesso Média: ${(avgSuccess * 100).toFixed(1)}%`, 40, 170);
    doc.text(`Desvio Padrão de Custos: €${costVariance.toFixed(2)}`, 40, 180);
    
    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Confidencial - Uso Interno', 105, 285, { align: 'center' });
    
    // ============ PÁGINA 2: ANÁLISE COMPARATIVA ============
    doc.addPage();
    
    // Cabeçalho de página
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Análise Comparativa de Transportadoras', 105, 15, { align: 'center' });
    
    // Tabela principal com todas as métricas
    autoTable(doc, {
      startY: 35,
      head: [['Transportadora', 'Custo', 'On-Time', 'Sucesso', 'Índice Qualidade']],
      body: carriers.map(c => {
        const qi = qualityIndex.find(q => q.name === c.name)?.index || 0;
        return [
          c.name,
          `€${c.avg_cost.toFixed(2)}`,
          `${(c.on_time_rate * 100).toFixed(1)}%`,
          `${(c.success_rate * 100).toFixed(1)}%`,
          qi.toFixed(1)
        ];
      }),
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor as [number, number, number],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { halign: 'right', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 40 }
      }
    });
    
    // Box de insights
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(255, 248, 220);
    doc.setDrawColor(warningColor[0], warningColor[1], warningColor[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, finalY, 170, 60, 3, 3, 'FD');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('Insights Principais', 25, finalY + 10);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`• Melhor custo-benefício: ${bestCost.name} (€${bestCost.avg_cost.toFixed(2)})`, 25, finalY + 22);
    doc.text(`• Mais confiável: ${bestReliability.name} (${((bestReliability.on_time_rate + bestReliability.success_rate) / 2 * 100).toFixed(1)}% qualidade)`, 25, finalY + 32);
    doc.text(`• Maior custo: ${worstCost.name} (€${worstCost.avg_cost.toFixed(2)}) - ${((worstCost.avg_cost / bestCost.avg_cost - 1) * 100).toFixed(0)}% mais caro`, 25, finalY + 42);
    doc.text(`• Variação de preços: €${costVariance.toFixed(2)} - ${costVariance > avgCost * 0.2 ? 'Alta' : 'Moderada'} dispersão`, 25, finalY + 52);
    
    // ============ PÁGINAS INDIVIDUAIS POR TRANSPORTADORA ============
    carriers.forEach((carrier, index) => {
      doc.addPage();
      
      // Cabeçalho colorido
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(carrier.name, 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Análise Detalhada | Página ${index + 3} de ${carriers.length + 2}`, 105, 28, { align: 'center' });
      
      // Métricas principais em cards
      const cardY = 50;
      const cardWidth = 50;
      const cardHeight = 30;
      const cardSpacing = 10;
      
      // Card 1: Custo
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(20, cardY, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Custo Médio', 45, cardY + 10, { align: 'center' });
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`€${carrier.avg_cost.toFixed(2)}`, 45, cardY + 22, { align: 'center' });
      
      // Card 2: On-Time
      doc.setFillColor(240, 255, 240);
      doc.roundedRect(20 + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Taxa On-Time', 45 + cardWidth + cardSpacing, cardY + 10, { align: 'center' });
      doc.setFontSize(16);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`${(carrier.on_time_rate * 100).toFixed(1)}%`, 45 + cardWidth + cardSpacing, cardY + 22, { align: 'center' });
      
      // Card 3: Sucesso
      doc.setFillColor(255, 250, 240);
      doc.roundedRect(20 + (cardWidth + cardSpacing) * 2, cardY, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Taxa Sucesso', 45 + (cardWidth + cardSpacing) * 2, cardY + 10, { align: 'center' });
      doc.setFontSize(16);
      const successColor = carrier.success_rate >= 0.9 ? accentColor : carrier.success_rate >= 0.75 ? warningColor : dangerColor;
      doc.setTextColor(successColor[0], successColor[1], successColor[2]);
      doc.text(`${(carrier.success_rate * 100).toFixed(1)}%`, 45 + (cardWidth + cardSpacing) * 2, cardY + 22, { align: 'center' });
      
      // Análise de performance
      const perfY = cardY + cardHeight + 20;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Análise de Performance', 20, perfY);
      
      // Tabela de indicadores
      const qi = qualityIndex.find(q => q.name === carrier.name)?.index || 0;
      const costRank = [...carriers].sort((a, b) => a.avg_cost - b.avg_cost).findIndex(c => c.name === carrier.name) + 1;
      const reliabilityRank = [...carriers].sort((a, b) => (b.on_time_rate + b.success_rate) - (a.on_time_rate + a.success_rate)).findIndex(c => c.name === carrier.name) + 1;
      
      autoTable(doc, {
        startY: perfY + 5,
        head: [['Indicador', 'Valor', 'Benchmark']],
        body: [
          ['Índice de Qualidade', qi.toFixed(1), `${qualityIndex[0].index.toFixed(1)} (melhor)`],
          ['Ranking de Custo', `${costRank}º de ${carriers.length}`, `€${avgCost.toFixed(2)} (média)`],
          ['Ranking de Confiabilidade', `${reliabilityRank}º de ${carriers.length}`, `${(avgOnTime * 100).toFixed(1)}% (média)`],
          ['Variação vs. Média', `${((carrier.avg_cost / avgCost - 1) * 100).toFixed(1)}%`, carrier.avg_cost < avgCost ? 'Abaixo' : 'Acima'],
        ],
        theme: 'striped',
        headStyles: { fillColor: secondaryColor as [number, number, number], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { halign: 'center', cellWidth: 40 },
          2: { halign: 'right', cellWidth: 60 }
        }
      });
      
      // Avaliação e recomendações
      const evalY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Avaliação e Recomendações', 20, evalY);
      
      // Determinar classificação
      let rating = '';
      let ratingColor: number[] = [];
      let recommendation = '';
      
      if (carrier.success_rate >= 0.95 && carrier.on_time_rate >= 0.90) {
        rating = 'EXCELENTE';
        ratingColor = accentColor;
        recommendation = 'Transportadora de referência. Ideal para envios críticos e de alto valor. Considere aumentar o volume de operações.';
      } else if (carrier.success_rate >= 0.85 && carrier.on_time_rate >= 0.80) {
        rating = 'BOM';
        ratingColor = primaryColor;
        recommendation = 'Performance satisfatória. Adequada para a maioria dos envios. Monitorar tendências e identificar áreas de melhoria.';
      } else if (carrier.success_rate >= 0.75 && carrier.on_time_rate >= 0.70) {
        rating = 'ACEITÁVEL';
        ratingColor = warningColor;
        recommendation = 'Performance dentro do aceitável mas com espaço para melhoria. Usar para envios menos críticos. Rever contrato.';
      } else {
        rating = 'NECESSITA ATENÇÃO';
        ratingColor = dangerColor;
        recommendation = 'Performance abaixo do esperado. Requer ação imediata. Considerar reduzir volume ou renegociar condições.';
      }
      
      // Background claro para melhor contraste
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(20, evalY + 5, 170, 50, 3, 3, 'F');
      
      // Borda colorida para destacar a classificação
      doc.setDrawColor(ratingColor[0], ratingColor[1], ratingColor[2]);
      doc.setLineWidth(1);
      doc.roundedRect(20, evalY + 5, 170, 50, 3, 3, 'S');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(ratingColor[0], ratingColor[1], ratingColor[2]);
      doc.text(rating, 25, evalY + 18);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(recommendation, 160);
      doc.text(lines, 25, evalY + 30);
      
      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${carrier.name} | ID: ${carrier.carrier_id}`, 20, 285);
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-PT')}`, 190, 285, { align: 'right' });
    });
    
    doc.save(`Relatorio_Logistica_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowModal(false);
  };

  const generateExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Resumo Executivo
    const summaryData = [
      ['Relatório de Performance Logística'],
      [`Data: ${new Date().toLocaleDateString('pt-PT')}`],
      [],
      ['KPIs Gerais:'],
      ['Métrica', 'Valor'],
      ['Total de Transportadoras', carriers.length],
      ['Custo Médio', `€${(carriers.reduce((s, c) => s + c.avg_cost, 0) / carriers.length).toFixed(2)}`],
      ['Taxa On-Time Média', `${(carriers.reduce((s, c) => s + c.on_time_rate, 0) / carriers.length * 100).toFixed(1)}%`],
      ['Taxa de Sucesso Média', `${(carriers.reduce((s, c) => s + c.success_rate, 0) / carriers.length * 100).toFixed(1)}%`],
      [],
      ['Comparação de Transportadoras:'],
      ['Nome', 'ID', 'Custo Médio', 'On-Time %', 'Sucesso %'],
      ...carriers.map(c => [
        c.name,
        c.carrier_id,
        c.avg_cost,
        (c.on_time_rate * 100).toFixed(1),
        (c.success_rate * 100).toFixed(1)
      ])
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo Executivo');
    
    // Sheets individuais por transportadora
    carriers.forEach(carrier => {
      const carrierData = [
        [carrier.name],
        [],
        ['Informação Básica:'],
        ['Campo', 'Valor'],
        ['ID', carrier.carrier_id],
        ['Nome', carrier.name],
        [],
        ['Métricas de Performance:'],
        ['Métrica', 'Valor'],
        ['Custo Médio', `€${carrier.avg_cost.toFixed(2)}`],
        ['Taxa On-Time', `${(carrier.on_time_rate * 100).toFixed(1)}%`],
        ['Taxa de Sucesso', `${(carrier.success_rate * 100).toFixed(1)}%`],
        [],
        ['Avaliação:'],
        [carrier.success_rate >= 0.95 && carrier.on_time_rate >= 0.90 
          ? 'Excelente' 
          : carrier.success_rate >= 0.85 && carrier.on_time_rate >= 0.80 
          ? 'Bom' 
          : 'Necessita Atenção']
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(carrierData);
      const sheetName = carrier.name.substring(0, 31); // Excel limita nomes a 31 chars
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    
    XLSX.writeFile(wb, `Relatorio_Logistica_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowModal(false);
  };

  const generateCSV = () => {
    let csv = 'Relatório de Performance Logística\n';
    csv += `Data: ${new Date().toLocaleDateString('pt-PT')}\n\n`;
    csv += 'Nome,ID,Custo Médio (€),On-Time Rate (%),Success Rate (%)\n';
    
    carriers.forEach(c => {
      csv += `"${c.name}","${c.carrier_id}",${c.avg_cost.toFixed(2)},${(c.on_time_rate * 100).toFixed(1)},${(c.success_rate * 100).toFixed(1)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_Logistica_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowModal(false);
  };

  return (
    <>
      <Button 
        variant="success" 
        onClick={() => setShowModal(true)}
        className="mb-3"
      >
        <i className="bi bi-file-earmark-text me-2"></i>
        Gerar Relatório
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Escolha o Formato do Relatório</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-2">
            <Button 
              variant="danger" 
              size="lg" 
              onClick={generatePDF}
              disabled={carriers.length === 0}
            >
              <i className="bi bi-file-pdf me-2"></i>
              PDF
            </Button>
            <Button 
              variant="success" 
              size="lg" 
              onClick={generateExcel}
              disabled={carriers.length === 0}
            >
              <i className="bi bi-file-excel me-2"></i>
              Excel
            </Button>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={generateCSV}
              disabled={carriers.length === 0}
            >
              <i className="bi bi-file-text me-2"></i>
              CSV
            </Button>
          </div>
          {carriers.length === 0 && (
            <div className="alert alert-warning mt-3 mb-0">
              Nenhuma transportadora disponível para gerar relatório.
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
