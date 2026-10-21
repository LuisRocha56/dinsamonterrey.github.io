const contactForm = document.querySelector("#contact-form");

if (contactForm) {
    const note = document.querySelector("#form-note");
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const productField = contactForm.querySelector("#producto");
    const requestedProduct = new URLSearchParams(window.location.search).get("producto");

    if (productField && requestedProduct) {
        productField.value = requestedProduct.trim().slice(0, 200);
    }

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!contactForm.reportValidity()) {
            return;
        }

        submitButton.disabled = true;
        note.textContent = "Enviando tu solicitud…";
        note.dataset.state = "sending";
        const controller = new AbortController();
        const requestTimeout = setTimeout(() => controller.abort(), 45000);

        try {
            const response = await fetch("https://dinsamonterrey-github-io.onrender.com/api/cotizaciones", {
                method: "POST",
                body: new FormData(contactForm),
                signal: controller.signal
            });
            const responseText = await response.text();
            let result = {};

            if (responseText) {
                try {
                    result = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        `El servidor respondió con un formato inesperado (HTTP ${response.status}). ` +
                        "Verifica la configuración del backend de cotizaciones."
                    );
                }
            }

            if (!responseText && !response.ok) {
                throw new Error(
                    `El servidor no pudo procesar la solicitud (HTTP ${response.status}) y no devolvió detalles. ` +
                    "Verifica la configuración del backend de cotizaciones."
                );
            }

            if (!response.ok) {
                throw new Error(result.error || `No se pudo enviar la solicitud (HTTP ${response.status}).`);
            }

            if (!responseText) {
                throw new Error(
                    "El servidor devolvió una respuesta vacía. Verifica la configuración del backend."
                );
            }

            contactForm.reset();
            note.textContent = "¡Listo! Recibimos tu solicitud de cotización.";
            note.dataset.state = "success";
        } catch (error) {
            console.error("No se pudo enviar la solicitud de cotización:", error);
            note.textContent = error instanceof DOMException && error.name === "AbortError"
                ? "El servidor tardó demasiado en responder. Espera un momento e inténtalo de nuevo."
                : error instanceof Error
                ? error.message
                : "No se pudo enviar la solicitud. Inténtalo de nuevo más tarde.";
            note.dataset.state = "error";
        } finally {
            clearTimeout(requestTimeout);
            submitButton.disabled = false;
        }
    });
}
