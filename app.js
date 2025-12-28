<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Zeugnis-Eingabe</title>

  <style>
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
      background: #f6f7fb;
      margin: 0;
    }
    .wrap {
      max-width: 900px;
      margin: 40px auto;
      padding: 0 16px;
    }
    .card {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
    }
    label {
      font-size: 13px;
      color: #555;
      display: block;
      margin-bottom: 6px;
    }
    select, input {
      width: 100%;
      padding: 10px;
      font-size: 14px;
      border-radius: 8px;
      border: 1px solid #ccc;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    #status {
      font-size: 14px;
      color: #333;
    }
  </style>
</head>

<body>
  <div class="wrap">
    <div class="card">
      <h1>Zeugnis-Eingabe</h1>
      <p>Minimaltest: Supabase → Tabelle <b>fach</b></p>
    </div>

    <div class="card">
      <div class="grid">
        <div>
          <label for="kind_code">Kind-Code</label>
          <input id="kind_code" placeholder="TEST01" />
        </div>
        <div>
          <label for="fach">Fach</label>
          <select id="fach">
            <option value="">— wird geladen —</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card" id="status">Bereit.</div>
  </div>

  <!-- WICHTIG: type="module" -->
  <script type="module" src="./app.js?v=1"></script>
</body>
</html>
