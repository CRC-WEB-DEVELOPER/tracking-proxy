exports.handler = async (event) => {
  try {
    const barcode = (event.queryStringParameters?.barcode || "").trim();

    if (!barcode || barcode.length < 6) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ found: false, error: "Barcode non valido" })
      };
    }

    const upstream =
      "https://www.campaniaspike.express/api/consegne.php?barcode=" +
      encodeURIComponent(barcode);

    const body = new URLSearchParams();
    body.set("username", process.env.SPIKE_USERNAME);
    body.set("password", process.env.SPIKE_PASSWORD);

    const r = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    if (!r.ok) {
      return {
        statusCode: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ found: false, error: "Tracking non disponibile" })
      };
    }

    let data;
    try {
      data = await r.json();
    } catch {
      return {
        statusCode: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ found: false, error: "Risposta non valida" })
      };
    }

    const item = Array.isArray(data) ? data[0] : null;

    if (!item) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60"
        },
        body: JSON.stringify({ found: false, barcode })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
      },
      body: JSON.stringify({
        found: true,
        barcode: item.barcode,
        esito: item.esito,
        cod_esito: item.cod_esito,
        data_creazione: item.data_creazione,
        data_accettazione: item.data_accettazione,
        data_esito: item.data_esito,
        filiale: item.filiale,
        localita: item.localita,
        provincia: item.provincia,
        cap: item.cap,
        indirizzo: item.indirizzo,
        gps: item.gps || ""
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ found: false, error: "Errore interno" })
    };
  }
};
