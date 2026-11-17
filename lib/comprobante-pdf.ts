import PDFDocument from "pdfkit";
import type { obtenerComprobantePorPagoId } from "./pago-service";

type Comprobante = Awaited<ReturnType<typeof obtenerComprobantePorPagoId>>;

export function generarComprobantePdf(comprobante: Comprobante): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).font("Helvetica-Bold").text("SALA MÉDICA");
    doc.fontSize(10).font("Helvetica").text("Comprobante de pago");
    doc.moveDown(0.5).fontSize(12).font("Helvetica-Bold").text(`Comprobante N° ${comprobante.correlativo}`);
    doc.fontSize(9).font("Helvetica-Bold").text("DOCUMENTO NO FISCAL");
    doc.moveDown().fontSize(16).text(`TOTAL ABONADO: $ ${comprobante.importe}`);
    doc.moveDown().fontSize(12).font("Helvetica-Bold").text("DATOS DEL PAGO");
    doc.font("Helvetica").fontSize(10)
      .text(`Número de comprobante: ${comprobante.correlativo}`)
      .text(`Fecha de pago: ${comprobante.fechaPago}`)
      .text(`Hora de pago: ${comprobante.horaPago}`)
      .text(`Importe: $ ${comprobante.importe}`)
      .text(`Medio de pago: ${comprobante.medioPago}`);
    doc.moveDown().font("Helvetica-Bold").fontSize(12).text("DATOS DEL PACIENTE");
    doc.font("Helvetica").fontSize(10)
      .text(`Nombre: ${comprobante.paciente.nombre}`)
      .text(`DNI: ${comprobante.paciente.dni ?? "—"}`)
      .text(`Cobertura: ${comprobante.paciente.cobertura ?? "Particular"}`)
      .text(`N.º de afiliado: ${comprobante.paciente.numeroAfiliado ?? "—"}`);
    doc.moveDown().font("Helvetica-Bold").fontSize(12).text("DATOS DE LA CONSULTA");
    doc.font("Helvetica").fontSize(10)
      .text(`Médico: ${comprobante.consulta.medico}`)
      .text(`Especialidad: ${comprobante.consulta.especialidad ?? "—"}`)
      .text(`Fecha de consulta: ${comprobante.consulta.fecha}`)
      .text(`Hora de consulta: ${comprobante.consulta.hora}`);
    doc.end();
  });
}
