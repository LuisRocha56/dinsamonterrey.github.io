import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
const siteDirectory = path.resolve(backendDirectory, "..");
const app = express();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
        fields: 6,
        fieldSize: 10 * 1024
    },
    fileFilter: (_request, file, callback) => {
        const allowedExtensions = new Set([
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg",
            ".png", ".zip", ".dwg", ".dxf", ".step", ".stp"
        ]);

        if (!allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
            const error = new Error("El tipo de archivo no está permitido.");
            error.code = "UNSUPPORTED_FILE_TYPE";
            callback(error);
            return;
        }

        callback(null, true);
    }
});

const quoteRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Se alcanzó el límite de solicitudes. Inténtalo de nuevo más tarde." }
});

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use("/api", (_request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (_request.method === "OPTIONS") {
        response.sendStatus(204);
        return;
    }

    next();
});
app.use("/api/cotizaciones", quoteRateLimit);

app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
});

app.post("/api/cotizaciones", upload.single("adjunto"), async (request, response) => {
    const requiredFields = {
        nombre: 120,
        empresa: 160,
        celular: 40,
        correo: 254,
        producto: 200,
        especificaciones: 5000
    };
    const quote = {};

    for (const [field, maxLength] of Object.entries(requiredFields)) {
        const value = request.body[field];
        if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
            response.status(400).json({ error: `Revisa el campo "${field}".` });
            return;
        }
        quote[field] = value.trim();
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quote.correo)) {
        response.status(400).json({ error: "Ingresa un correo válido." });
        return;
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !Number.isInteger(smtpPort) || smtpPort < 1 || !smtpUser || !smtpPass) {
        response.status(503).json({
            error: "El envío de cotizaciones aún no está configurado. Contacta a DINSA directamente."
        });
        return;
    }

    const safeFilename = request.file?.originalname
        .replace(/[\\/]/g, "_")
        .replace(/[^\w.-]/g, "_");
    const message = {
        from: process.env.SMTP_FROM || smtpUser,
        to: "luisrocha.v.340@gmail.com",
        replyTo: quote.correo,
        subject: "Nueva solicitud de cotización DINSA",
        text: [
            "Nueva solicitud de cotización",
            "",
            `Nombre: ${quote.nombre}`,
            `Empresa: ${quote.empresa}`,
            `Celular: ${quote.celular}`,
            `Correo: ${quote.correo}`,
            `Producto que requiere: ${quote.producto}`,
            "",
            "Especificaciones:",
            quote.especificaciones
        ].join("\n"),
        attachments: request.file
            ? [{
                filename: safeFilename,
                content: request.file.buffer,
                contentType: request.file.mimetype
            }]
            : []
    };

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: process.env.SMTP_SECURE === "true",
            auth: { user: smtpUser, pass: smtpPass }
        });
        await transporter.sendMail(message);
        response.status(200).json({ message: "Solicitud enviada correctamente." });
    } catch (error) {
        console.error("Error al enviar una solicitud de cotización:", error);
        response.status(502).json({
            error: "No se pudo enviar la solicitud en este momento. Inténtalo más tarde."
        });
    }
});

app.use((error, _request, response, _next) => {
    if (error instanceof multer.MulterError) {
        const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "El archivo supera el límite de 10 MB."
            : "El formulario o el archivo no cumple los límites permitidos.";
        response.status(status).json({ error: message });
        return;
    }

    if (error.code === "UNSUPPORTED_FILE_TYPE") {
        response.status(400).json({ error: error.message });
        return;
    }

    console.error("Error procesando la solicitud:", error);
    response.status(500).json({ error: "Ocurrió un error al procesar la solicitud." });
});

app.use((request, response, next) => {
    if (request.path === "/backend" || request.path.startsWith("/backend/")) {
        response.sendStatus(404);
        return;
    }
    next();
});
app.use(express.static(siteDirectory, { dotfiles: "deny" }));

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => {
    console.log(`DINSA listo en http://${host}:${port}`);
});
