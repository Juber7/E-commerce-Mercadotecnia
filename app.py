from flask import Flask
from controllers.home import home_bp

# Inicialización de la aplicación Flask
app = Flask(__name__)

# Llave secreta requerida para el manejo de sesiones (obligatoria para el carrito de compras)
app.secret_key = "titan_secret_key_2026"

# Registro del Blueprint que contiene las rutas de la página principal y la API
app.register_blueprint(home_bp)

# Punto de entrada para arrancar el servidor local de desarrollo
if __name__ == "__main__":
    app.run(debug=True, port=5000)