from flask import Blueprint, render_template, request, jsonify, session
from flask import Flask

# ── Blueprint ─────────────────────────────────────────────────────────────────
home_bp = Blueprint("home", __name__)

# ── Datos del producto (en producción vendrían de una BD) ─────────────────────
PRODUCT = {
    "name": "Galleta Titán",
    "tagline": "Potencia tu día. Cada mordida cuenta.",
    "price_unit": 1.25,          # Precio por unidad en USD
    "price_box": 12.00,          # Precio por caja (12 unidades)
    "min_order": 12,             # Pedido mínimo (1 caja)
    "protein_per_unit": 15,      # Gramos de proteína por galleta
    "calories_per_unit": 180,    # Calorías por galleta
    "weight_per_unit": 60,       # Gramos por galleta
    "flavors": ["Chocolate Oscuro", "Vainilla & Almendra", "Mantequilla de Maní"],
}

# ── Ruta: Página principal ────────────────────────────────────────────────────
@home_bp.route("/")
@home_bp.route("/inicio")
def index():
    """Renderiza la vista principal del e-commerce."""
    return render_template("index.html", product=PRODUCT)


# ── Ruta: Descripción del producto ───────────────────────────────────────────
@home_bp.route("/descripcion")
def descripcion():
    """Redirige al ancla de descripción en index (SPA-style)."""
    return render_template("index.html", product=PRODUCT, scroll_to="descripcion")


# ── Ruta: API de cotización (POST - JSON) ─────────────────────────────────────
@home_bp.route("/cotizar", methods=["POST"])
def cotizar():
    """
    Recibe cantidad y sabor, devuelve JSON con el desglose del costo.
    Body esperado: { "cantidad": int, "sabor": str }
    """
    data = request.get_json(silent=True) or request.form

    try:
        cantidad = int(data.get("cantidad", 0))
        sabor    = data.get("sabor", "")
    except (ValueError, TypeError):
        return jsonify({"error": "Cantidad inválida."}), 400

    if cantidad < PRODUCT["min_order"]:
        return jsonify({
            "error": f"El pedido mínimo es de {PRODUCT['min_order']} unidades (1 caja)."
        }), 400

    cajas          = cantidad // 12
    sueltas        = cantidad % 12
    subtotal_cajas = cajas * PRODUCT["price_box"]
    subtotal_sueltas = sueltas * PRODUCT["price_unit"]
    total          = subtotal_cajas + subtotal_sueltas
    proteina_total = cantidad * PRODUCT["protein_per_unit"]

    return jsonify({
        "cantidad"       : cantidad,
        "sabor"          : sabor,
        "cajas"          : cajas,
        "sueltas"        : sueltas,
        "subtotal_cajas" : round(subtotal_cajas, 2),
        "subtotal_sueltas": round(subtotal_sueltas, 2),
        "total"          : round(total, 2),
        "proteina_total_g": proteina_total,
        "currency"       : "USD",
    })


# ── Ruta: Carrito (sesión del servidor) ───────────────────────────────────────
@home_bp.route("/carrito", methods=["GET"])
def carrito():
    """Devuelve el estado actual del carrito desde la sesión."""
    cart = session.get("cart", [])
    total = sum(item["subtotal"] for item in cart)
    return jsonify({"items": cart, "total": round(total, 2)})


@home_bp.route("/carrito/agregar", methods=["POST"])
def agregar_al_carrito():
    """
    Agrega un ítem al carrito en sesión.
    Body: { "cantidad": int, "sabor": str, "subtotal": float }
    """
    data = request.get_json(silent=True) or {}
    cart = session.get("cart", [])

    item = {
        "producto" : PRODUCT["name"],
        "sabor"    : data.get("sabor", "Sin especificar"),
        "cantidad" : int(data.get("cantidad", 0)),
        "subtotal" : float(data.get("subtotal", 0.0)),
    }
    cart.append(item)
    session["cart"] = cart

    return jsonify({"message": "Ítem agregado.", "cart_count": len(cart)}), 201


@home_bp.route("/carrito/limpiar", methods=["DELETE"])
def limpiar_carrito():
    """Vacía el carrito de la sesión actual."""
    session.pop("cart", None)
    return jsonify({"message": "Carrito vaciado."}), 200
