document.addEventListener("DOMContentLoaded", async () => {
    console.log("Verificando autenticación...");

    try {
        const verifyResponse = await fetch('/verificarToken', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await verifyResponse.json();
        console.log("Respuesta del servidor:", data);

        if (data.authenticated) {
            console.log("✅ Usuario autenticado, redirigiendo a admin.html...");
            window.location.href = "admin.html"; 
            return;
        }
    } catch (error) {
        console.error("Error verificando autenticación:", error);
    }

    // Manejar el envío del formulario de inicio de sesión
    const form = document.querySelector("#login-form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.querySelector("#username").value;
        const password = document.querySelector("#password").value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ username, password }),
                credentials: 'include' // ✅ Enviar cookies para sesión
            });

            const data = await response.json();
            console.log("Respuesta del servidor tras login:", data);

            if (data.success) {
                console.log("✅ Redirigiendo a admin.html...");
                window.location.href = data.redirect; 
            } else {
                console.error("❌ Error: " + data.message);
                alert(data.message);
            }
        } catch (error) {
            console.error("Error en el login:", error);
        }
    });
});
